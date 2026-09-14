#!/usr/bin/env python3
"""Añade únicamente el hostname de LARAMS a un túnel local existente."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile
import time
import urllib.request

import yaml

SERVICE = "http://127.0.0.1:3100"


class SafeError(Exception):
    pass


class UniqueLoader(yaml.SafeLoader):
    pass


def unique_mapping(loader, node, deep=False):
    loader.flatten_mapping(node)
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in result:
            raise SafeError("La configuración YAML tiene claves repetidas; no se modifica.")
        result[key] = loader.construct_object(value_node, deep=deep)
    return result


UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, unique_mapping)


def load_config(text):
    try:
        data = yaml.load(text, Loader=UniqueLoader)
    except SafeError:
        raise
    except Exception:
        raise SafeError("No se pudo interpretar el YAML; no se imprime su contenido.") from None
    if not isinstance(data, dict) or not isinstance(data.get("ingress"), list) or not data["ingress"]:
        raise SafeError("Se necesita una configuración local con ingress en forma de lista.")
    if "token" in data or "token-file" in data:
        raise SafeError("El túnel usa un token; configura su hostname desde el panel de Cloudflare.")
    tunnel = str(data.get("tunnel", ""))
    if not re.fullmatch(r"[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}", tunnel):
        raise SafeError("La configuración debe identificar el túnel local por su UUID real.")
    if any(not isinstance(item, dict) for item in data["ingress"]):
        raise SafeError("Una regla ingress tiene un formato no admitido.")
    return data


def prepare(text, hostname):
    if not re.fullmatch(r"(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?", hostname):
        raise SafeError("El hostname no es válido.")
    data = load_config(text)
    matches = [item for item in data["ingress"] if str(item.get("hostname", "")).lower() == hostname]
    if matches:
        if len(matches) != 1 or matches[0] != {"hostname": hostname, "service": SERVICE}:
            raise SafeError("El hostname ya tiene otra regla o ajustes propios; no se sobrescribe.")
        # Solo es idempotente si es la primera regla: un comodín anterior podría ocultarla.
        if data["ingress"][0] != matches[0]:
            raise SafeError("La regla LARAMS existe en otra posición; revisar su prioridad antes de cambiarla.")
        return text, data, False
    lines = text.splitlines(keepends=True)
    roots = [i for i, line in enumerate(lines) if re.fullmatch(r"ingress:\s*(?:#[^\r\n]*)?\r?\n?", line)]
    if len(roots) != 1:
        raise SafeError("ingress debe ser un bloque YAML explícito; no se reescriben formatos especiales.")
    root = roots[0]
    first = root + 1
    while first < len(lines) and (not lines[first].strip() or lines[first].lstrip().startswith("#")):
        first += 1
    if first == len(lines):
        raise SafeError("Falta la primera regla ingress.")
    match = re.match(r"^( *)-\s", lines[first])
    if not match:
        raise SafeError("Formato de lista ingress no admitido; no se cambia el archivo.")
    indent = match[1]
    newline = "\r\n" if "\r\n" in text else "\n"
    addition = indent + "- hostname: " + hostname + newline + indent + "  service: " + SERVICE + newline
    result = "".join(lines[:first]) + addition + "".join(lines[first:])
    after = load_config(result)
    expected = dict(data)
    expected["ingress"] = [{"hostname": hostname, "service": SERVICE}] + data["ingress"]
    if after != expected:
        raise SafeError("La inserción cambiaría otras reglas; se descarta.")
    return result, data, True


def run(args, timeout=30):
    try:
        result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout, check=False)
    except (OSError, subprocess.TimeoutExpired):
        raise SafeError("No se pudo completar " + Path(args[0]).name + "; no se cambian sus credenciales.") from None
    if result.returncode:
        # Los diagnósticos de cloudflared pueden incluir rutas o información de cuenta.
        raise SafeError(Path(args[0]).name + " rechazó la operación. No se muestran tokens ni certificados.")
    return result.stdout.decode("utf-8", errors="replace").strip()


def service_config():
    pid = run(["systemctl", "show", "--property=MainPID", "--value", "cloudflared"])
    if not pid.isdigit() or int(pid) <= 0:
        raise SafeError("El servicio cloudflared no tiene un proceso activo.")
    args = Path("/proc", pid, "cmdline").read_bytes().decode().split("\0")
    env_keys = {entry.split(b"=", 1)[0] for entry in Path("/proc", pid, "environ").read_bytes().split(b"\0")}
    if any(arg in ("--token", "--token-file") or arg.startswith(("--token=", "--token-file=")) for arg in args) or env_keys.intersection({b"TUNNEL_TOKEN", b"TUNNEL_TOKEN_FILE"}):
        raise SafeError("Túnel administrado desde Cloudflare: añade el hostname con servicio " + SERVICE + " en su panel; la instalación local está lista.")
    config = None
    for index, arg in enumerate(args):
        if arg == "--config" and index + 1 < len(args):
            config = Path(args[index + 1])
        elif arg.startswith("--config="):
            config = Path(arg.split("=", 1)[1])
    if config is None:
        raise SafeError("El servicio no declara --config; falta confirmar el archivo efectivo. No se adivina ni se reemplaza.")
    if not config.is_absolute() or config.is_symlink() or not config.is_file():
        raise SafeError("La configuración efectiva debe ser un archivo local absoluto, sin enlace.")
    return config


def write_temporary(config, content, metadata):
    descriptor, filename = tempfile.mkstemp(prefix=".larams-", suffix=".yml", dir=config.parent)
    with os.fdopen(descriptor, "w", encoding="utf-8", newline="") as handle:
        handle.write(content)
        handle.flush()
        os.fsync(handle.fileno())
    candidate = Path(filename)
    os.chown(candidate, metadata.st_uid, metadata.st_gid)
    os.chmod(candidate, stat.S_IMODE(metadata.st_mode))
    return candidate


def replace_if_unchanged(config, candidate, digest):
    if hashlib.sha256(config.read_bytes()).hexdigest() != digest:
        raise SafeError("Cloudflare cambió durante la preparación; se conserva la configuración más reciente.")
    os.replace(candidate, config)


def public_health(hostname):
    for attempt in range(12):
        try:
            request = urllib.request.Request("https://" + hostname + "/api/health", headers={"Cache-Control": "no-cache"})
            with urllib.request.urlopen(request, timeout=5) as response:
                body = json.load(response)
                if response.status == 200 and body == {"status": "ok", "service": "larams-web", "phase": 0}:
                    return True
        except Exception:
            pass
        if attempt < 11:
            time.sleep(2)
    return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--hostname", required=True)
    parser.add_argument("--user-home", required=True)
    options = parser.parse_args()
    if os.geteuid() != 0:
        raise SafeError("Este paso requiere sudo para editar el archivo efectivo de cloudflared.")
    executable = shutil.which("cloudflared")
    if not executable:
        raise SafeError("No se encuentra cloudflared.")
    config = service_config()
    original = config.read_bytes()
    digest = hashlib.sha256(original).hexdigest()
    text, data, changed = prepare(original.decode("utf-8"), options.hostname)
    # cert.pem permite crear DNS; el JSON del conector no lo sustituye.
    cert = next((candidate for candidate in [
        Path(options.user_home) / ".cloudflared/cert.pem",
        config.parent / "cert.pem",
        Path("/root/.cloudflared/cert.pem"),
    ] if candidate.is_file()), None)
    if cert is None:
        raise SafeError("No se encontró cert.pem para crear DNS. LARAMS sigue instalado. Falta autenticar cloudflared o crear el CNAME del hostname hacia " + str(data["tunnel"]) + ".cfargotunnel.com; no se modificó el túnel.")
    metadata = config.stat()
    candidate = write_temporary(config, text, metadata)
    backup = None
    applied = False
    try:
        run([executable, "tunnel", "--config", str(candidate), "ingress", "validate"])
        # Sin overwrite-dns: una entrada DNS ajena nunca se sustituye.
        try:
            run([executable, "tunnel", "--origincert", str(cert), "route", "dns", str(data["tunnel"]), options.hostname], timeout=45)
        except SafeError:
            raise SafeError("No se pudo crear o confirmar el DNS. Revisar permisos de cert.pem o un registro existente; no se sobrescribe DNS ni se cambia el túnel.") from None
        if changed:
            backup = config.with_name(config.name + ".larams-" + time.strftime("%Y%m%dT%H%M%S") + "-" + str(os.getpid()) + ".bak")
            # La copia queda junto al archivo del servicio, con su propietario y modo.
            shutil.copy2(config, backup)
            os.chown(backup, metadata.st_uid, metadata.st_gid)
            replace_if_unchanged(config, candidate, digest)
            applied = True
            print("Entrada LARAMS validada. Se reinicia cloudflared: las conexiones del túnel pueden reconectarse brevemente.", flush=True)
            run(["systemctl", "restart", "cloudflared"], timeout=45)
            time.sleep(2)
            run(["systemctl", "is-active", "--quiet", "cloudflared"])
            print("Copia de configuración: " + str(backup))
        else:
            print("La entrada LARAMS ya estaba configurada; no se reinició el túnel.")
    except BaseException:
        if applied and backup:
            if config.read_bytes() == text.encode("utf-8"):
                restore = write_temporary(config, original.decode("utf-8"), metadata)
                os.replace(restore, config)
                try:
                    run(["systemctl", "restart", "cloudflared"], timeout=45)
                    run(["systemctl", "is-active", "--quiet", "cloudflared"])
                    print("Se restauró la configuración anterior del túnel.", flush=True)
                except SafeError:
                    print("La copia fue restaurada; el servicio cloudflared necesita revisión.", flush=True)
            else:
                print("La configuración cambió por otra operación; no se sobrescribe. Copia anterior: " + str(backup), flush=True)
        raise
    finally:
        candidate.unlink(missing_ok=True)
    if public_health(options.hostname):
        print("HTTPS verificado: https://" + options.hostname)
        return 0
    print("Configuración aplicada; la salud por HTTPS aún no está confirmada. Revisar propagación DNS, Access y conexión del túnel.")
    return 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SafeError as error:
        print("Cloudflare pendiente: " + str(error))
        raise SystemExit(2)
    except Exception:
        print("Cloudflare pendiente: error de sistema. No se imprime la configuración ni sus credenciales.")
        raise SystemExit(2)

#!/usr/bin/env python3
"""Diagnóstico de solo lectura. No modifica DNS, servicios, certificados ni releases."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from ipaddress import ip_address
import json
import os
from pathlib import Path
import pwd
import re
import shutil
import subprocess
import tempfile
from urllib.parse import urlsplit

HOST = "larams.aliproinv.com"
EXPECTED = {"status": "ok", "service": "larams-web", "phase": 0}
ERRORS = {
    5: ("dns", "no se resolvió el proxy"),
    6: ("dns", "el resolver de la HP no resolvió el nombre"),
    7: ("connection", "no se pudo establecer la conexión"),
    28: ("timeout", "tiempo de espera agotado"),
    35: ("tls", "falló la negociación TLS"),
    60: ("tls", "no se pudo validar el certificado"),
    63: ("size", "la respuesta excede el límite del diagnóstico"),
}


def probe(url, resolve=None, headers=()):
    with tempfile.TemporaryDirectory(prefix="larams-red-") as directory:
        body_file = Path(directory) / "body"
        headers_file = Path(directory) / "headers"
        # --disable ignora curlrc; no se envían cookies, tokens ni credenciales.
        command = ["curl", "--disable", "--silent", "--show-error", "--noproxy", "*",
                   "--connect-timeout", "4", "--max-time", "12", "--max-filesize", "65536",
                   "--proto", "=http,https", "--output", str(body_file),
                   "--dump-header", str(headers_file), "--write-out", "%{http_code} %{remote_ip}"]
        if resolve:
            command += ["--resolve", resolve]
        for header in ("Cache-Control: no-cache", *headers):
            command += ["--header", header]
        command.append(url)
        try:
            result = subprocess.run(command, capture_output=True, timeout=15, check=False)
        except subprocess.TimeoutExpired:
            return {"exit": 28, "status": 0, "body": "", "headers": {}}
        except OSError:
            return {"exit": 127, "status": 0, "body": "", "headers": {}}
        meta = result.stdout.decode("utf-8", errors="replace").split()
        parsed_headers = {}
        if headers_file.exists():
            for line in headers_file.read_text(errors="replace").splitlines():
                if ":" in line:
                    key, value = line.split(":", 1)
                    if key.lower() in ("location", "cf-mitigated", "cf-ray"):
                        parsed_headers[key.lower()] = value.strip()
        return {
            "exit": result.returncode,
            "status": int(meta[0]) if meta and meta[0].isdigit() else 0,
            "body": body_file.read_text(errors="replace")[:65536] if body_file.exists() else "",
            "headers": parsed_headers,
        }


def classify(result, service="larams-web"):
    code = result["exit"]
    if code:
        kind, detail = ERRORS.get(code, ("tool", "curl terminó con código " + str(code)))
        return {"kind": kind, "detail": detail, "status": result["status"]}
    status = result["status"]
    try:
        body = json.loads(result["body"])
    except (ValueError, TypeError):
        body = None
    expected = dict(EXPECTED, service=service)
    if status == 200 and body == expected:
        return {"kind": "ok", "detail": "salud correcta de " + service, "status": status}
    headers = result["headers"]
    if headers.get("cf-mitigated") == "challenge":
        return {"kind": "challenge", "detail": "Cloudflare exige una comprobación de acceso", "status": status}
    if 300 <= status < 400:
        try:
            destination = urlsplit(headers.get("location", "")).hostname or ""
        except ValueError:
            destination = ""
        detail = "redirección HTTP; no se siguió"
        if destination.endswith(".cloudflareaccess.com"):
            detail = "redirección a Cloudflare Access; requiere una sesión autorizada"
        return {"kind": "redirect", "detail": detail, "status": status}
    # Se extraen solo códigos conocidos, nunca el HTML o parámetros de sesión.
    plain = re.sub(r"<[^>]*>", " ", result["body"])
    error = re.search(r"\b(?:error|code)\D{0,30}\b(1016|1033)\b", plain, re.IGNORECASE)
    detail = "respuesta distinta de la salud esperada"
    if error and status >= 400:
        detail += "; código Cloudflare " + error.group(1)
    return {"kind": "http", "detail": detail, "status": status}


def public_dns(provider):
    if provider == "Cloudflare":
        url = "https://cloudflare-dns.com/dns-query?name=" + HOST + "&type=A"
        resolve = "cloudflare-dns.com:443:1.1.1.1"
    else:
        url = "https://dns.google/resolve?name=" + HOST + "&type=A"
        resolve = "dns.google:443:8.8.8.8"
    result = probe(url, resolve, ("Accept: application/dns-json",))
    if result["exit"] or result["status"] != 200:
        return {"provider": provider, "status": None, "ips": [], "detail": classify(result)["detail"]}
    try:
        data = json.loads(result["body"])
        status = data.get("Status")
        if type(status) is not int:
            raise ValueError()
        addresses = []
        for answer in data.get("Answer", []):
            if answer.get("type") == 1:
                address = ip_address(answer["data"])
                if address.version == 4 and address.is_global:
                    addresses.append(str(address))
        return {"provider": provider, "status": status, "ips": sorted(set(addresses)), "detail": ""}
    except (ValueError, KeyError, TypeError, AttributeError):
        return {"provider": provider, "status": None, "ips": [], "detail": "respuesta DNS no interpretable"}


def report(label, result, service="larams-web"):
    summary = classify(result, service)
    print(label + ": HTTP " + str(summary["status"]) + " — " + summary["detail"], flush=True)
    return summary


def conclusion(local, normal, resolved, dns):
    if any(item["kind"] != "ok" for item in local):
        return "Falta recuperar un servicio local de LARAMS. Resolver primero la respuesta web/API."
    if normal["kind"] == "ok":
        return "HTTPS de LARAMS verificado desde la HP. La comprobación anterior pudo ser transitoria; falta comprobar el navegador."
    if any(item["kind"] == "ok" for item in resolved):
        if normal["kind"] == "dns":
            return "LARAMS responde por HTTPS usando DNS público. El acceso normal falla al resolver el nombre en la HP; revisar su resolver/caché."
        return "LARAMS responde por una IP pública con TLS válido, pero falla la ruta normal. Comparar DNS local, conectividad e IPv6 antes de modificar configuración."
    if normal["kind"] in ("redirect", "challenge") or any(item["kind"] in ("redirect", "challenge") for item in resolved):
        return "La petición encuentra una redirección o comprobación de acceso. Revisar el destino o política mostrada; la salud autenticada no fue comprobada."
    if len(dns) == 2 and all(item["status"] == 3 for item in dns):
        return "Ambos DNS públicos devolvieron NXDOMAIN. Revisar el registro y la delegación del dominio; no basta con cambiar el DNS de la HP."
    if normal["kind"] == "tls":
        return "La comprobación detectó un fallo TLS. Revisar certificado y reloj del equipo; no desactivar su validación."
    return "Los servicios locales responden, pero falta confirmar HTTPS. Usar los códigos HTTP, DNS y conexión anteriores para localizar el fallo."


def service_state(args):
    try:
        result = subprocess.run(["systemctl", *args], capture_output=True, text=True, timeout=5, check=False)
        value = result.stdout.strip()
        return value if value in ("active", "inactive", "failed", "enabled", "disabled", "static", "not-found") else "no comprobado"
    except (OSError, subprocess.TimeoutExpired):
        return "no comprobado"


def main():
    if not shutil.which("curl"):
        raise SystemExit("Falta curl; no se modificó el equipo.")
    print("LARAMS — comprobación de red (solo lectura)", flush=True)
    print("Hora UTC: " + datetime.now(timezone.utc).isoformat(timespec="seconds"), flush=True)
    print("Cloudflared: " + service_state(["is-active", "cloudflared"]), flush=True)
    username = pwd.getpwuid(os.getuid()).pw_name
    print("Arranque PM2: " + service_state(["is-enabled", "pm2-" + username]), flush=True)
    with ThreadPoolExecutor(max_workers=5) as pool:
        web = pool.submit(probe, "http://127.0.0.1:3100/api/health")
        api = pool.submit(probe, "http://127.0.0.1:3101/api/v1/health")
        normal_future = pool.submit(probe, "https://" + HOST + "/api/health")
        dns_futures = [pool.submit(public_dns, name) for name in ("Cloudflare", "Google")]
        local = [report("Web local", web.result()), report("API local", api.result(), "larams-api")]
        normal = report("HTTPS con resolución normal", normal_future.result())
        dns = [future.result() for future in dns_futures]
        for item in dns:
            detail = "estado " + str(item["status"]) + "; IPv4 " + (", ".join(item["ips"]) or "sin respuesta A") if item["status"] is not None else "no comprobado; " + item["detail"]
            print("DNS público " + item["provider"] + ": " + detail, flush=True)
        addresses = list(dict.fromkeys(address for item in dns for address in item["ips"]))[:2]
        # La IP procede de respuestas DNS actuales; --resolve conserva hostname y validación TLS.
        resolved_futures = [(address, pool.submit(probe, "https://" + HOST + "/api/health", HOST + ":443:" + address)) for address in addresses]
        resolved = [report("HTTPS vía " + address, future.result()) for address, future in resolved_futures]
    print("\nResultado: " + conclusion(local, normal, resolved, dns), flush=True)
    print("No se modificaron DNS, servicios, bases de datos ni configuración.", flush=True)
    return 0 if normal["kind"] == "ok" and all(item["kind"] == "ok" for item in local) else 2


if __name__ == "__main__":
    raise SystemExit(main())

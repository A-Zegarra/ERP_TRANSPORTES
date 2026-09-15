#!/usr/bin/env python3
"""Alta inicial interactiva; contraseña por TTY y pipe, nunca como argumento o archivo."""
import fcntl
import getpass
import json
import os
from pathlib import Path
import subprocess
import sys
import warnings


def main():
    root = Path.home() / "apps/larams-erp"
    if root.is_symlink() or (root / ".larams-installation").read_text().strip() != "A-Zegarra/ERP_TRANSPORTES":
        raise ValueError("Instalación no reconocida.")
    shared = root / "shared"
    release = (root / "current").resolve()
    if not release.is_relative_to(root / "releases"):
        raise ValueError("Release no reconocida.")
    with (shared / "install.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        env = dict(os.environ, LARAMS_ENV_FILE=str(shared / "api.env"))
        command = ["node", str(release / "apps/api/dist/admin-cli.js")]
        def invoke(action, data=None):
            result = subprocess.run(command + [action], input=json.dumps(data) if data else None,
                                    text=True, capture_output=True, env=env, timeout=45, check=False)
            if result.returncode:
                raise ValueError("No se pudo completar el alta inicial; no se muestran datos sensibles.")
            return json.loads(result.stdout)
        status = invoke("--status")
        if status["configured"]:
            print("Administrador inicial ya configurado: " + status["email"] + ". Se conserva su contraseña.")
            return
        with open("/dev/tty", "r") as reader, open("/dev/tty", "w") as tty:
            def ask(label):
                tty.write(label)
                tty.flush()
                value = reader.readline()
                if not value:
                    raise ValueError("Entrada interrumpida.")
                return value.strip()
            print("Crear administrador inicial y empresa. Sucursal: Tacna; país: Perú; moneda: PEN.")
            company = ask("Nombre de empresa [LARAM’S CARGO INTERNACIONAL]: ") or "LARAM’S CARGO INTERNACIONAL"
            name = ask("Nombre del administrador: ")
            email = ask("Correo para ingresar: ")
            with warnings.catch_warnings():
                warnings.simplefilter("error", getpass.GetPassWarning)
                password = getpass.getpass("Contraseña (15 a 128 caracteres; no se muestra): ", stream=tty)
                confirmation = getpass.getpass("Repite la contraseña: ", stream=tty)
            if password != confirmation or not 15 <= len(password) <= 128:
                raise ValueError("Las contraseñas deben coincidir y tener de 15 a 128 caracteres.")
        result = invoke("--create", {"email": email, "password": password, "displayName": name, "companyName": company})
        print("Administrador inicial preparado. Ingresa en https://larams.aliproinv.com/login")
        if result["status"] == "created":
            # Copia posterior al alta. Un fallo no elimina al administrador ya creado.
            saved = subprocess.run(["python3", str(release / "scripts/hp_mysql.py"), "backup", "--root", str(root)], check=False)
            if saved.returncode:
                raise ValueError("Administrador creado; quedó pendiente su respaldo posterior.")


if __name__ == "__main__":
    try:
        main()
    except (Exception, KeyboardInterrupt) as error:
        message = str(error) if isinstance(error, ValueError) else "Alta interrumpida; revisa la sesión SSH y la instalación propia."
        print(message, file=sys.stderr)
        raise SystemExit(2)

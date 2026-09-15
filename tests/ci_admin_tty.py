"""Ejercita el alta desde una terminal, sin poner contraseñas en argv ni mostrarlas."""
import os
from pathlib import Path
import pty
import select
import signal
import subprocess
import sys
import time

if os.environ.get("CI") != "true" or os.environ.get("LARAMS_TEST_DATABASE") != "1":
    raise SystemExit("Solo para CI desechable.")
script = Path.home() / "apps/larams-erp/current/scripts/hp-administrador.py"
password = "Larams ensayo 2026 correcto!"
answers = [
    ("Nombre de empresa", "LARAMS CI"),
    ("Nombre del administrador", "Administrador CI"),
    ("Correo para ingresar", "admin-ci@example.invalid"),
    ("Contraseña (", password),
    ("Repite la contraseña", password),
]
pid, descriptor = pty.fork()
if pid == 0:
    os.execv(sys.executable, [sys.executable, str(script)])
transcript = ""
pending = ""
index = 0
status = None
try:
    deadline = time.monotonic() + 90
    while time.monotonic() < deadline:
        if select.select([descriptor], [], [], 0.2)[0]:
            try:
                content = os.read(descriptor, 8192).decode(errors="replace")
            except OSError:
                content = ""
            transcript += content
            pending += content
            if index < len(answers) and answers[index][0] in pending:
                os.write(descriptor, (answers[index][1] + "\n").encode())
                pending = ""
                index += 1
        finished, result = os.waitpid(pid, os.WNOHANG)
        if finished:
            status = result
            break
    assert status == 0, "El alta desde TTY falló o agotó su tiempo."
    assert index == len(answers)
    assert password not in transcript, "La contraseña no debe tener eco en la terminal."
    assert "Administrador inicial preparado" in transcript
finally:
    os.close(descriptor)
    if status is None:
        os.kill(pid, signal.SIGKILL)
        os.waitpid(pid, 0)
again = subprocess.run([sys.executable, str(script)], stdin=subprocess.DEVNULL, text=True,
                       capture_output=True, timeout=45, check=True)
assert "Se conserva su contraseña" in again.stdout
print("Alta por TTY sin eco de contraseña y reintento sin cambios: correctos.")

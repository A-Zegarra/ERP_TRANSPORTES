#!/usr/bin/env python3
"""Ensayo destructible exclusivamente en GitHub Actions, MySQL Docker en 33306."""
import gzip
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import tempfile
import time
from urllib.request import urlopen

REPO = Path(__file__).resolve().parents[1]
OLD = "efb08c975805d20dac38b6a69ce5dc25e9dadfd5"
CONTAINER = "larams-mysql-ci"


def run(args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def main():
    if os.environ.get("CI") != "true" or os.environ.get("LARAMS_TEST_DATABASE") != "1":
        raise SystemExit("Solo ejecutar en el runner desechable de CI.")
    if not Path(os.environ["PM2_HOME"]).resolve().is_relative_to(Path(os.environ["RUNNER_TEMP"]).resolve()):
        raise SystemExit("Se requiere un daemon PM2 aislado dentro de RUNNER_TEMP.")
    root = Path.home() / "apps/larams-erp"
    if root.exists():
        raise SystemExit("El runner ya tiene una instalación; no se utiliza.")
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 33306))
    with tempfile.TemporaryDirectory(prefix="larams-ci-", dir=os.environ["RUNNER_TEMP"]) as temporary:
        scratch = Path(temporary)
        admin = scratch / "admin.cnf"
        # Credencial pública y efímera del contenedor de ensayo, nunca de la HP.
        admin.write_text("[client]\nhost=127.0.0.1\nport=33306\nprotocol=TCP\nuser=root\npassword=LaramsCiOnly8!\n")
        admin.chmod(0o600)
        env = dict(os.environ, LARAMS_MYSQL_ADMIN_FILE=str(admin), LARAMS_DB_PORT="33306")
        mysql = ["mysql", "--defaults-file=" + str(admin), "--batch", "--skip-column-names"]

        def sql(statement, database=None):
            result = run(mysql + ([database] if database else []), input=statement,
                         text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=45)
            return result.stdout.strip()

        def wait_mysql():
            for _ in range(60):
                try:
                    if sql("SELECT 1;") == "1":
                        return
                except (subprocess.SubprocessError, OSError):
                    pass
                time.sleep(1)
            raise AssertionError("MySQL CI no inició.")

        def collision_root(name):
            folder = scratch / name
            folder.mkdir()
            (folder / "shared").mkdir(mode=0o700)
            (folder / ".larams-installation").write_text("A-Zegarra/ERP_TRANSPORTES\n")
            return folder

        def refused(folder):
            attempt = subprocess.run(["python3", str(REPO / "scripts/hp_mysql.py"), "prepare", "--root", str(folder)],
                                     env=env, text=True, capture_output=True, timeout=45)
            assert attempt.returncode == 2, attempt.stdout + attempt.stderr
            assert not (folder / "shared/mysql-state.json").exists()

        def ready():
            for _ in range(20):
                try:
                    with urlopen("http://127.0.0.1:3101/api/v1/ready", timeout=7) as response:
                        result = json.load(response)
                        if result.get("database") == "ok" and result.get("schemaVersion") == 1:
                            return
                except Exception:
                    pass
                time.sleep(1)
            raise AssertionError("Readiness MySQL no se recuperó.")

        try:
            run(["docker", "run", "--detach", "--name", CONTAINER, "--network", "host",
                 "-e", "MYSQL_ROOT_PASSWORD=LaramsCiOnly8!", "-e", "MYSQL_ROOT_HOST=127.0.0.1",
                 "mysql:8.4", "--bind-address=127.0.0.1", "--port=33306"])
            wait_mysql()
            print("MySQL real:", sql("SELECT VERSION();"), flush=True)
            sql("CREATE DATABASE larams_sentinel_ci; CREATE TABLE larams_sentinel_ci.marker (value INT);"
                "INSERT INTO larams_sentinel_ci.marker VALUES (42);"
                "CREATE DATABASE laramsXerp; CREATE TABLE laramsXerp.marker (value INT);"
                "INSERT INTO laramsXerp.marker VALUES (43);")
            sql("CREATE DATABASE larams_erp; CREATE TABLE larams_erp.marker (value INT);"
                "INSERT INTO larams_erp.marker VALUES (44);")
            refused(collision_root("collision-database"))
            assert sql("SELECT value FROM larams_erp.marker;") == "44"
            assert sql("SELECT COUNT(*) FROM mysql.user WHERE User LIKE 'larams%';") == "0"
            # Solo se eliminan recursos creados arriba, en este contenedor desechable.
            sql("DROP DATABASE larams_erp; CREATE USER 'larams_app'@'127.0.0.1' IDENTIFIED BY 'CollisionCi8!';")
            refused(collision_root("collision-user"))
            sql("DROP USER 'larams_app'@'127.0.0.1';")
            print("Colisiones con base y cuenta ajenas: protegidas.", flush=True)

            previous_script = scratch / "phase0.sh"
            run(["curl", "-fsSL", "--connect-timeout", "15", "--max-time", "60",
                 "https://raw.githubusercontent.com/A-Zegarra/ERP_TRANSPORTES/" + OLD + "/scripts/hp-instalar.sh",
                 "-o", str(previous_script)])
            run(["bash", str(previous_script), "--local-only"], env=dict(env, LARAMS_REF=OLD), timeout=600)
            assert (root / "current").resolve().name == OLD
            run(["bash", str(REPO / "scripts/hp-instalar.sh"), "--local-only"], env=env, timeout=600)
            ready()
            assert sql("SELECT COUNT(*) FROM companies;", "larams_erp") == "0"
            assert sql("SELECT COUNT(*) FROM users;", "larams_erp") == "0"
            state = root / "shared/mysql-state.json"
            before = hashlib.sha256(state.read_bytes()).hexdigest()
            for name in ["mysql-state.json", "api.env", "migrate.env"]:
                assert (root / "shared" / name).stat().st_mode & 0o077 == 0
            refused(collision_root("second-installation"))

            test_env = dict(env, LARAMS_ENV_FILE=str(root / "shared/api.env"))
            run(["pnpm", "test:db"], cwd=REPO, env=test_env, timeout=90)
            sql("INSERT INTO companies (id,legalName,countryCode,currencyCode,timeZone,updatedAt)"
                " VALUES ('00000000-0000-4000-8000-000000000001','Persistencia CI','PE','PEN','America/Lima',UTC_TIMESTAMP(3));",
                "larams_erp")
            run(["bash", str(REPO / "scripts/hp-instalar.sh"), "--local-only"], env=env, timeout=240)
            assert hashlib.sha256(state.read_bytes()).hexdigest() == before
            assert sql("SELECT legalName FROM companies;", "larams_erp") == "Persistencia CI"
            assert sql("SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;", "larams_erp") == "1"

            # Conexión nueva tras vaciar el caché de caching_sha2_password del servidor.
            run(["docker", "restart", CONTAINER], timeout=90)
            wait_mysql()
            ready()
            print("Actualización desde fase 0, reintento y reconexión tras reinicio MySQL: correctos.", flush=True)

            backup = sorted((root / "shared/backups").glob("*-despues.sql.gz"))[-1]
            expected = Path(str(backup) + ".sha256").read_text().split()[0]
            assert hashlib.sha256(backup.read_bytes()).hexdigest() == expected
            sql("CREATE DATABASE larams_restore_ci CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            with gzip.open(backup, "rt") as saved:
                sql(saved.read(), "larams_restore_ci")
            assert sql("SELECT legalName FROM companies;", "larams_restore_ci") == "Persistencia CI"
            assert sql("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='larams_restore_ci';") == "12"
            # Comparar también índices y relaciones, no solo filas restauradas.
            url = "mysql://root:LaramsCiOnly8%21@127.0.0.1:33306/larams_restore_ci"
            run(["pnpm", "exec", "prisma", "migrate", "diff", "--from-config-datasource",
                 "--to-schema", "prisma/schema.prisma", "--exit-code"],
                cwd=REPO, env=dict(env, DATABASE_URL=url), timeout=90)
            assert sql("SELECT value FROM larams_sentinel_ci.marker;") == "42"
            assert sql("SELECT value FROM laramsXerp.marker;") == "43"
            print("Respaldo restaurado con datos, índices y claves foráneas; bases ajenas intactas.", flush=True)
        finally:
            subprocess.run(["pm2", "kill"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
            subprocess.run(["docker", "rm", "--force", CONTAINER], check=False)


if __name__ == "__main__":
    main()

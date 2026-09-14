#!/usr/bin/env python3
"""Recursos MySQL exclusivos de LARAMS. Nunca adopta ni borra una base ajena."""
import argparse
from datetime import datetime, timezone
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import stat
import subprocess
import tempfile
from urllib.parse import quote

DATABASE = "larams_erp"
ACCOUNTS = {"app": "larams_app", "migrate": "larams_migrate"}
TABLES = {"companies", "branches", "users", "memberships", "roles", "permissions",
          "role_permissions", "user_roles", "branch_access", "sessions", "audit_events"}


class SafeError(Exception):
    pass


def private_file(path):
    data = path.lstat()
    if not stat.S_ISREG(data.st_mode) or data.st_mode & 0o077 or data.st_uid != os.getuid():
        raise SafeError("El archivo propio debe ser regular, del usuario actual y con permisos 600.")


def atomic_private(path, content):
    descriptor, filename = tempfile.mkstemp(prefix=".larams-", dir=path.parent)
    temporary = Path(filename)
    try:
        with os.fdopen(descriptor, "w") as handle:
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temporary, 0o600)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def command(args, sql=None, cwd=None, env=None, output=None, timeout=45):
    try:
        result = subprocess.run(args, input=sql.encode() if sql is not None else None,
                                stdout=output if output is not None else subprocess.PIPE,
                                stderr=subprocess.PIPE, cwd=cwd, env=env, timeout=timeout, check=False)
    except (OSError, subprocess.TimeoutExpired):
        raise SafeError("No se pudo completar " + Path(args[0]).name + " dentro del tiempo permitido.") from None
    if result.returncode:
        error = result.stderr.decode(errors="replace")
        match = re.search(r"(?:ERROR\s+(\d+)|\b(P\d{4})\b)", error)
        code = " (código " + next(group for group in match.groups() if group) + ")" if match else ""
        raise SafeError(Path(args[0]).name + " rechazó la operación" + code + ". Se conserva el estado actual; no se imprimen credenciales.")
    return "" if output is not None else result.stdout.decode().strip()


class DatabaseSetup:
    def __init__(self, root):
        self.root = Path(root)
        if self.root.is_symlink() or not self.root.is_dir():
            raise SafeError("La carpeta de LARAMS debe ser una carpeta propia.")
        self.root = self.root.resolve()
        if (self.root / ".larams-installation").read_text().strip() != "A-Zegarra/ERP_TRANSPORTES":
            raise SafeError("La carpeta no corresponde a LARAMS.")
        self.shared = self.root / "shared"
        if self.shared.is_symlink() or not self.shared.is_dir():
            raise SafeError("Falta la carpeta compartida propia.")
        self.state_path = self.shared / "mysql-state.json"
        self.port = int(os.environ.get("LARAMS_DB_PORT", "3306"))
        if not 1024 <= self.port <= 65535:
            raise SafeError("Puerto de MySQL inválido.")
        admin_file = os.environ.get("LARAMS_MYSQL_ADMIN_FILE")
        if admin_file:
            admin_path = Path(admin_file).resolve()
            private_file(admin_path)
            self.admin = ["mysql", "--defaults-file=" + str(admin_path)]
        else:
            self.admin = ["sudo", "-n", "mysql", "--protocol=socket", "--user=root"]
        self.admin += ["--batch", "--raw", "--skip-column-names", "--connect-timeout=5"]
        self.state = None

    def sql(self, sql):
        return command(self.admin, sql)

    def save(self):
        atomic_private(self.state_path, json.dumps(self.state, indent=2) + "\n")

    def load(self):
        private_file(self.state_path)
        data = json.loads(self.state_path.read_text())
        if (data.get("database") != DATABASE or data.get("port") != self.port
                or not re.fullmatch(r"[0-9a-f]{32}", str(data.get("owner", "")))):
            raise SafeError("El estado guardado no coincide con esta instalación.")
        for key in ACCOUNTS:
            if not re.fullmatch(r"[A-Za-z0-9_-]{43}Aa7!", str(data.get(key + "Password", ""))):
                raise SafeError("La credencial guardada no tiene el formato esperado.")
        self.state = data

    def exists(self):
        return self.sql("SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME='larams_erp';") == "1"

    def users(self):
        return self.sql("SELECT User,Host FROM mysql.user WHERE User IN ('larams_app','larams_migrate');")

    def check_owner(self):
        for account in ACCOUNTS.values():
            rows = self.sql("SELECT Host FROM mysql.user WHERE User='" + account + "';").splitlines()
            if rows != ["127.0.0.1"]:
                raise SafeError("Una cuenta LARAMS falta o existe con un alcance de red no reconocido.")
            owner = self.sql("SELECT JSON_UNQUOTE(JSON_EXTRACT(ATTRIBUTE,'$.larams_owner')) "
                             "FROM INFORMATION_SCHEMA.USER_ATTRIBUTES WHERE USER='" + account + "' AND HOST='127.0.0.1';")
            if owner != self.state["owner"]:
                raise SafeError("Una cuenta MySQL no pertenece a esta instalación; no se modifica.")

    def url(self, kind):
        return ("mysql://" + ACCOUNTS[kind] + ":" + quote(self.state[kind + "Password"], safe="")
                + "@127.0.0.1:" + str(self.port) + "/" + DATABASE)

    def credentials(self):
        for filename, content in {
            "api.env": "DATABASE_URL=" + self.url("app") + "\nDB_POOL_SIZE=5\n",
            "migrate.env": "DATABASE_URL=" + self.url("migrate") + "\n",
        }.items():
            target = self.shared / filename
            if target.exists() or target.is_symlink():
                private_file(target)
                if target.read_text() != content:
                    raise SafeError(filename + " ya tiene una configuración diferente; no se sobrescribe.")
            else:
                atomic_private(target, content)

    def prepare(self):
        version = self.sql("SELECT VERSION();")
        if not version.startswith("8.4."):
            raise SafeError("Esta entrega requiere un servidor MySQL 8.4; no se actualiza el MySQL compartido.")
        server = self.sql("SELECT @@server_uuid;")
        if self.sql("SELECT @@port;") != str(self.port):
            raise SafeError("La conexión administrativa no corresponde al puerto MySQL indicado.")
        if self.state_path.exists() or self.state_path.is_symlink():
            self.load()
            if self.state.get("server") != server:
                raise SafeError("El servidor MySQL no coincide con el registrado; no se modifica.")
        else:
            if self.exists() or self.users() or any((self.shared / name).exists() or (self.shared / name).is_symlink() for name in ["api.env", "migrate.env"]):
                raise SafeError("Ya existen recursos con los nombres de LARAMS sin identificación propia. No se adoptan ni se borran.")
            self.state = {"database": DATABASE, "port": self.port, "server": server, "owner": secrets.token_hex(16),
                          "databaseCreated": False, "appPassword": secrets.token_urlsafe(32) + "Aa7!",
                          "migratePassword": secrets.token_urlsafe(32) + "Aa7!"}
            self.save()
        for kind, account in ACCOUNTS.items():
            rows = self.sql("SELECT Host FROM mysql.user WHERE User='" + account + "';").splitlines()
            if not rows:
                # No IF NOT EXISTS: una colisión concurrente interrumpe el proceso.
                self.sql("CREATE USER '" + account + "'@'127.0.0.1' IDENTIFIED BY '" + self.state[kind + "Password"]
                         + "' WITH MAX_USER_CONNECTIONS " + ("12" if kind == "app" else "3")
                         + " ATTRIBUTE '{\"larams_owner\":\"" + self.state["owner"] + "\"}';")
        self.check_owner()
        if not self.state["databaseCreated"]:
            if self.exists():
                raise SafeError("La base existe, pero su creación no quedó acreditada; revisar sin sobrescribirla.")
            self.sql("CREATE DATABASE larams_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            self.state["databaseCreated"] = True
            self.save()
        elif not self.exists():
            raise SafeError("La base registrada fue retirada; no se recrea silenciosamente.")
        # MySQL interpreta _ como comodín en GRANT si partial_revokes está deshabilitado.
        escaped = DATABASE if self.sql("SELECT @@partial_revokes;") == "1" else DATABASE.replace("_", "\\_")
        for kind, account in ACCOUNTS.items():
            privileges = "SELECT,INSERT,UPDATE,DELETE"
            if kind == "migrate":
                privileges += ",CREATE,ALTER,INDEX,REFERENCES"
            self.sql("GRANT " + privileges + " ON `" + escaped + "`.* TO '" + account + "'@'127.0.0.1';")
        self.credentials()
        print("MySQL propio preparado: larams_erp; cuentas limitadas para aplicación y migraciones.", flush=True)

    def mysql_client(self, kind, program="mysql"):
        descriptor, filename = tempfile.mkstemp(prefix=".mysql-", suffix=".cnf", dir=self.shared)
        with os.fdopen(descriptor, "w") as handle:
            handle.write("[client]\nhost=127.0.0.1\nport=" + str(self.port) + "\nprotocol=TCP\nuser="
                         + ACCOUNTS[kind] + "\npassword=" + self.state[kind + "Password"] + "\n")
        return Path(filename), [program, "--defaults-file=" + filename]

    def verify(self):
        self.load()
        filename, args = self.mysql_client("app")
        try:
            actual = command(args + ["--batch", "--skip-column-names", DATABASE], "SHOW TABLES;")
            if not TABLES.issubset(set(actual.splitlines())):
                raise SafeError("Faltan tablas de la migración inicial.")
            command(args + [DATABASE], "SELECT id FROM companies LIMIT 1;")
        finally:
            filename.unlink(missing_ok=True)
        print("Conexión de aplicación comprobada; 11 tablas base presentes.", flush=True)

    def backup(self, label):
        self.load()
        directory = self.shared / "backups"
        if directory.is_symlink():
            raise SafeError("La carpeta de respaldos no puede ser un enlace.")
        directory.mkdir(mode=0o700, exist_ok=True)
        if shutil.disk_usage(directory).free < 1024**3:
            raise SafeError("Se requiere al menos 1 GiB libre antes del respaldo local.")
        filename, args = self.mysql_client("migrate", "mysqldump")
        target = directory / ("larams-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + "-" + label + ".sql.gz")
        try:
            with tempfile.TemporaryFile(dir=directory) as sql_file:
                command(args + ["--single-transaction", "--quick", "--skip-lock-tables", "--no-tablespaces",
                                "--set-gtid-purged=OFF", "--column-statistics=0", "--skip-add-drop-table",
                                "--skip-triggers", DATABASE], output=sql_file, timeout=180)
                sql_file.seek(0)
                with target.open("xb") as output:
                    os.chmod(target, 0o600)
                    with gzip.GzipFile(fileobj=output, mode="wb") as compressed:
                        shutil.copyfileobj(sql_file, compressed, length=1024*1024)
                    output.flush()
                    os.fsync(output.fileno())
            digest = hashlib.sha256()
            with target.open("rb") as saved:
                for chunk in iter(lambda: saved.read(1024*1024), b""):
                    digest.update(chunk)
            atomic_private(Path(str(target) + ".sha256"), digest.hexdigest() + "  " + target.name + "\n")
        except BaseException:
            target.unlink(missing_ok=True)
            raise
        finally:
            filename.unlink(missing_ok=True)
        print("Respaldo local " + label + ": " + str(target), flush=True)
        return target

    def migrate(self, release):
        self.load()
        release = Path(release).resolve()
        if not release.is_relative_to(self.root / "releases") or not (release / ".larams-ready").is_file():
            raise SafeError("La migración debe proceder de una release preparada de esta instalación.")
        env = dict(os.environ, DATABASE_URL=self.url("migrate"))
        env.pop("LARAMS_ENV_FILE", None)
        command(["npm", "exec", "--yes", "--package=pnpm@11.19.0", "--", "pnpm", "db:deploy"],
                cwd=release, env=env, timeout=180)
        command(["npm", "exec", "--yes", "--package=pnpm@11.19.0", "--", "pnpm", "db:status"],
                cwd=release, env=env, timeout=90)
        print("Migraciones versionadas aplicadas y estado comprobado.", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["prepare", "apply", "verify", "backup"])
    parser.add_argument("--root", required=True)
    parser.add_argument("--release")
    options = parser.parse_args()
    setup = DatabaseSetup(options.root)
    if options.action == "prepare":
        setup.prepare()
    elif options.action == "verify":
        setup.verify()
    elif options.action == "backup":
        setup.backup("manual")
    elif options.action == "apply":
        if not options.release:
            raise SafeError("Falta la release para aplicar migraciones.")
        setup.prepare()
        setup.backup("antes")
        setup.migrate(options.release)
        setup.verify()
        setup.backup("despues")


if __name__ == "__main__":
    try:
        main()
    except SafeError as error:
        print("MySQL pendiente: " + str(error), flush=True)
        raise SystemExit(2)
    except Exception:
        print("MySQL pendiente: error de configuración o archivos propios; no se imprime información sensible.", flush=True)
        raise SystemExit(2)

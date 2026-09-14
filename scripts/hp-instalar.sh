#!/usr/bin/env bash
# Fase 0: no crea usuarios, bases de datos ni migraciones.
set -Eeuo pipefail
umask 077

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
[[ "$EUID" -ne 0 ]] || fail "Ejecuta como alvaro, sin sudo delante del instalador."
[[ "$(uname -s)" == Linux && "$(uname -m)" == x86_64 ]] || fail "Esta entrega está preparada para Linux x86_64."
larams_ref="${LARAMS_REF:-}"
[[ "$larams_ref" =~ ^[0-9a-f]{40}$ ]] || fail "LARAMS_REF debe contener el commit completo entregado."
larams_mode="${1:---cloudflare}"
[[ "$larams_mode" == --cloudflare || "$larams_mode" == --local-only ]] || fail "Opciones: --cloudflare o --local-only."
for larams_tool in node npm pm2 curl tar flock python3; do
  command -v "$larams_tool" >/dev/null || fail "Falta $larams_tool."
done
[[ "$(node -p 'process.versions.node.split(".")[0]')" == 24 ]] || fail "Se requiere Node 24."
[[ -z "${DATABASE_URL:-}" ]] || fail "La fase 0 no usa DATABASE_URL; ejecútala fuera del entorno de otra aplicación."

larams_root="$HOME/apps/larams-erp"
[[ ! -L "$larams_root" ]] || fail "La carpeta de instalación no puede ser un enlace."
if [[ -e "$larams_root" ]]; then
  [[ -f "$larams_root/.larams-installation" ]] || fail "La ruta ya existe sin identificador de LARAMS; no se modifica."
  [[ "$(cat "$larams_root/.larams-installation")" == A-Zegarra/ERP_TRANSPORTES ]] || fail "La ruta pertenece a otro proyecto."
else
  mkdir -p "$larams_root"
  printf '%s\n' A-Zegarra/ERP_TRANSPORTES > "$larams_root/.larams-installation"
fi
mkdir -p "$larams_root/releases" "$larams_root/shared"
[[ ! -L "$larams_root/releases" && ! -L "$larams_root/shared" ]] || fail "releases y shared deben ser carpetas propias."
exec 9>"$larams_root/shared/install.lock"
flock -n 9 || fail "Ya hay otra instalación de LARAMS en curso."

larams_stage=""
cleanup() {
  if [[ -n "$larams_stage" && "$larams_stage" == "$larams_root/releases/.prepare-"* ]]; then
    rm -rf -- "$larams_stage"
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

larams_release="$larams_root/releases/$larams_ref"
if [[ ! -f "$larams_release/.larams-ready" ]]; then
  [[ ! -e "$larams_release" ]] || fail "Hay una release incompleta en la ruta de destino; no se sobrescribe."
  python3 - "$larams_root" <<'PY'
import shutil, sys
from pathlib import Path
available = int(next(line.split()[1] for line in Path("/proc/meminfo").read_text().splitlines() if line.startswith("MemAvailable:"))) * 1024
if available < 3 * 1024**3:
    raise SystemExit("Se requieren 3 GiB de RAM disponible para compilar; no se detienen otras aplicaciones.")
if shutil.disk_usage(sys.argv[1]).free < 4 * 1024**3:
    raise SystemExit("Se requieren 4 GiB libres para preparar la release.")
PY
  larams_stage="$(mktemp -d "$larams_root/releases/.prepare-XXXXXXXX")"
  printf 'Descargando LARAMS, commit %s...\n' "$larams_ref"
  curl --proto '=https' --tlsv1.2 -fsSL --connect-timeout 15 --max-time 180 --retry 2 \
    "https://codeload.github.com/A-Zegarra/ERP_TRANSPORTES/tar.gz/$larams_ref" -o "$larams_stage/source.tgz"
  mkdir "$larams_stage/source"
  tar --extract --gzip --file="$larams_stage/source.tgz" --directory="$larams_stage/source" \
    --strip-components=1 --no-same-owner --no-same-permissions
  larams_source="$larams_stage/source"
  [[ "$(node -e 'process.stdout.write(require(process.argv[1]).name)' "$larams_source/package.json")" == larams-erp ]] || fail "El paquete no corresponde a LARAMS."
  node "$larams_source/scripts/hp-activar.mjs" check "$larams_root"
  (
    cd "$larams_source"
    export NEXT_TELEMETRY_DISABLED=1
    export NODE_OPTIONS=--max-old-space-size=2048
    # pnpm temporal fijado al repositorio: no actualiza el pnpm global 11.1.1.
    larams_pnpm=(npm exec --yes --package=pnpm@11.19.0 -- pnpm)
    "${larams_pnpm[@]}" install --frozen-lockfile
    "${larams_pnpm[@]}" check
    "${larams_pnpm[@]}" build
    "${larams_pnpm[@]}" test:smoke
  )
  printf '%s\n' "$larams_ref" > "$larams_source/.larams-ready"
  mv "$larams_source" "$larams_release"
fi

node "$larams_release/scripts/hp-activar.mjs" activate "$larams_root" "$larams_release"
if [[ "$larams_mode" == --cloudflare ]]; then
  if ! bash "$larams_release/scripts/hp-cloudflare.sh"; then
    printf '\nLARAMS quedó instalado en la HP. La publicación Cloudflare está pendiente; conserva el mensaje anterior.\n'
    exit 2
  fi
fi
printf '\nInstalación de fase 0 terminada. MySQL y los datos de otros proyectos no se modificaron.\n'
printf 'Estado local: curl -fsS http://127.0.0.1:3100/api/health\n'
printf 'Reversión de código (sin otra instalación en curso): node "%s/current/scripts/hp-activar.mjs" rollback "%s"\n' "$larams_root" "$larams_root"
if command -v systemctl >/dev/null && systemctl is-enabled --quiet "pm2-$(id -un)" 2>/dev/null; then
  printf 'Servicio de arranque PM2: habilitado.\n'
else
  printf 'Arranque tras reinicio: falta comprobar el servicio PM2 del usuario; no se configuró automáticamente.\n'
fi

#!/usr/bin/env bash
set -euo pipefail
[[ "$EUID" -ne 0 ]] || { printf 'Ejecuta como el usuario de despliegue, sin sudo delante del script.\n' >&2; exit 1; }
larams_script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
larams_hostname="${LARAMS_HOSTNAME:-larams.aliproinv.com}"
for larams_tool in sudo python3 cloudflared systemctl; do
  command -v "$larams_tool" >/dev/null || { printf 'Falta %s para publicar por Cloudflare.\n' "$larams_tool" >&2; exit 1; }
done
curl -fsS --connect-timeout 2 --max-time 5 http://127.0.0.1:3100/api/health |
  python3 -c 'import json,sys; data=json.load(sys.stdin); sys.exit(0 if data == {"status":"ok","service":"larams-web","phase":0} else 1)'
printf '\nSe usará sudo para conservar una copia y añadir %s al túnel existente.\n' "$larams_hostname"
sudo -v
if ! sudo /usr/bin/python3 -c 'import yaml' >/dev/null 2>&1; then
  printf 'Instalando python3-yaml para validar el archivo sin modificar otras reglas...\n'
  sudo apt-get install -y python3-yaml
fi
sudo /usr/bin/python3 "$larams_script_dir/hp_cloudflare.py" --hostname "$larams_hostname" --user-home "$HOME"

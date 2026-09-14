#!/usr/bin/env bash
# Solo lectura. Ejecutar en la HP, dentro de una sesión SSH abierta desde Termux.
set -euo pipefail

if [[ "$(uname -s)" != "Linux" ]]; then
  printf '%s\n' 'Este diagnóstico está preparado para la HP con Linux.' >&2
  exit 1
fi
printf '%s\n' 'LARAMS ERP — diagnóstico de preparación (solo lectura)'
printf 'Arquitectura: %s\n' "$(uname -m)"
if [[ -r /etc/os-release ]]; then
  # El archivo lo administra el sistema operativo.
  . /etc/os-release
  printf 'Sistema: %s\n' "${PRETTY_NAME:-Linux}"
fi
for executable in node pnpm pm2 mysql git; do
  if command -v "$executable" >/dev/null 2>&1; then
    # No iniciar el daemon de PM2: solo comprobar si está instalado.
    if [[ "$executable" == "pm2" ]]; then
      printf '%s\n' 'pm2: instalado'
    else
      printf '%s: ' "$executable"
      "$executable" --version 2>/dev/null || true
    fi
  else
    printf '%s: no encontrado en PATH\n' "$executable"
  fi
done
printf '\n%s\n' 'Memoria disponible:'
free -m
printf '\n%s\n' 'Espacio para aplicaciones:'
df -h "${HOME}/apps" 2>/dev/null || df -h "$HOME"
printf '\n%s\n' 'Puertos TCP en escucha (sin información de procesos):'
if command -v ss >/dev/null 2>&1; then ss -lnt; fi
printf '\n%s\n' 'Rutas propuestas:'
for directory in "${HOME}/apps/larams-erp" "${HOME}/apps/larams-erp/releases"; do
  if [[ -e "$directory" ]]; then printf 'Ya existe: %s\n' "$directory"; else printf 'Disponible: %s\n' "$directory"; fi
done
printf '\n%s\n' 'Puertos candidatos: web 3100, API 3101. Confirmar con el listado anterior.'
printf '%s\n' 'No se crearon archivos ni se modificaron servicios, bases de datos o dominios.'

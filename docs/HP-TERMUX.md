# Flujo de trabajo: GitHub → Termux → HP

## Diagnóstico confirmado el 14 de septiembre de 2026

Equipo del usuario: `alvaro@ali-home-server`, Ubuntu 26.04 LTS x86_64; Node 24.19.0, pnpm 11.1.1, PM2 instalado, MySQL 8.4.11 y cloudflared 2026.8.2. Túnel activo. Memoria total 7371 MiB, disponible 5740 MiB; disco libre 76 GiB. Las direcciones 3100/3101 y la carpeta propuesta estaban disponibles al ejecutar el diagnóstico; el instalador vuelve a comprobarlas.

| Recurso | Valor |
|---|---|
| Carpeta | `/home/alvaro/apps/larams-erp` |
| Releases | `releases/<commit>` |
| Versión activa/anterior | enlaces `current` y `previous` |
| Configuración y logs | `shared` |
| Frontend | `127.0.0.1:3100`, PM2 `larams-erp-web` |
| API | `127.0.0.1:3101`, PM2 `larams-erp-api` |
| Acceso previsto | `https://larams.aliproinv.com` mediante el túnel existente |
| MySQL | disponible en el equipo; conexión del ERP pendiente de fase 1 |

No existe acceso remoto a la HP desde este entorno de desarrollo. Un resultado satisfactorio de CI no demuestra que la HP esté instalada.

## Instalar desde la sesión SSH habitual en Termux

La entrega del chat proporciona el comando completo y un commit con CI aprobado. El script se ejecuta como `alvaro`, sin poner `sudo` delante de todo el instalador. Solo el paso Cloudflare eleva permisos para su configuración existente.

```bash
# Con el script descargado del mismo commit indicado en la entrega:
LARAMS_REF=<commit-completo-de-40-caracteres> bash hp-instalar.sh --cloudflare
```

El instalador:

1. Comprueba Linux x86_64, Node 24, herramientas, carpeta propia, puertos y nombres PM2. Bloquea instalaciones simultáneas mediante `flock`.
2. Descarga el commit exacto a una carpeta temporal dentro de `releases`. Requiere al menos 3 GiB de RAM disponible y 4 GiB de disco libre para preparar una versión nueva.
3. Usa `npm exec --package=pnpm@11.19.0` para ejecutar el pnpm del proyecto. No actualiza el pnpm global de la HP. Instala con lockfile, comprueba tipos/lint/esquema, compila secuencialmente y ejecuta la prueba HTTP.
4. Conserva la release preparada y arranca únicamente los dos procesos LARAMS. Comprueba el contenido de las respuestas de salud de ambos. Si falla, recupera los procesos de la release anterior o retira solo los nuevos cuando es la primera instalación.
5. Cambia el enlace `current` después de superar la salud, conserva `previous` y registra la instalación en `shared/installation.json`. Ejecuta `pm2 save` para guardar la lista actual, sin reiniciar otros procesos. Esto actualiza el inventario persistido del usuario PM2.
6. Publica el hostname siguiendo `CLOUDFLARE.md`. Si Cloudflare no puede completarse, mantiene la aplicación local y termina con código 2 indicando lo que falta. El código 0 con mensaje `HTTPS verificado` acredita la respuesta web recibida por el script en ese momento.

El modo `--local-only` instala y verifica la aplicación sin ejecutar el paso Cloudflare. No crea usuarios, bases, tablas, migraciones ni datos de negocio. No ejecuta el servidor heredado.

## Comprobación y reintento

```bash
curl -fsS http://127.0.0.1:3100/api/health
curl -fsS http://127.0.0.1:3101/api/v1/health
# Reintentar únicamente la publicación después de resolver el mensaje pendiente:
bash "$HOME/apps/larams-erp/current/scripts/hp-cloudflare.sh"
```

El instalador informa si encuentra habilitado `pm2-alvaro`; no crea un servicio global de arranque. Si ese servicio no existe, debe configurarse antes de cerrar la fase 0 y después comprobar un reinicio programado de la HP.

## Actualizar y recuperar código

Cada actualización se entrega por commit validado y se instala con el mismo procedimiento. Una release ya preparada no se recompila. La activación reinicia únicamente LARAMS, por lo que puede haber una breve pausa de este ERP. No se garantiza despliegue sin interrupción.

Para recuperar la release anterior, sin otra instalación en curso:

```bash
flock -n "$HOME/apps/larams-erp/shared/install.lock" \
  node "$HOME/apps/larams-erp/current/scripts/hp-activar.mjs" rollback \
  "$HOME/apps/larams-erp"
```

La recuperación intercambia las referencias activa/anterior y vuelve a comprobar la salud. En la primera instalación no existe `previous`. Conservamos las releases, así que debe vigilarse el espacio libre y retirar versiones antiguas solo tras identificar cuáles siguen activas. La rotación de logs se incorpora antes de la operación con usuarios.

Este procedimiento recupera código de fase 0. No revierte migraciones de datos; en fase 1 se preparan respaldos probados y migraciones compatibles. No usar `pm2 restart all`, `pm2 delete all`, reinicios de MySQL, `prisma db push`, `migrate reset` ni el SQL heredado sobre bases existentes.

## Validación automatizada y cierre real

CI compila y prueba Next/Nest, revisa Bash con ShellCheck, prueba la inserción de Cloudflare sobre archivos temporales, comprueba la reversión con un daemon PM2 aislado y ejecuta el instalador real dos veces en un runner Linux. CI no usa el túnel ni las credenciales de la HP. Quedan para el equipo real: instalación, HTTPS, inspección visual, arranque tras reinicio y comprobación de las demás aplicaciones después de aplicar el cambio del túnel. No enviar contraseñas, certificados, tokens ni archivos de entorno por el chat.

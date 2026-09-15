# Flujo de trabajo: GitHub → Termux → HP

## Actualización 1A.3

El usuario confirmó 1A.2 (commit `76ffd7f152a085ba3bd82cc3a0bb077da878c504`), el registro del administrador y el inicio de sesión. La siguiente actualización conserva esa cuenta: instalar el commit entregado con `--local-only`, comprobar `schemaVersion: 3` y abrir `/configuracion`. No repetir el alta inicial. [Operación y aceptación 1A.3](ADMINISTRACION-1A3.md).

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
| Acceso confirmado | `https://larams.aliproinv.com` mediante el túnel existente |
| MySQL | disponible; la entrega 1A.1 prepara base y cuentas propias al instalarla |

Actualización confirmada: el usuario instaló 1A.1 (`92b261bbd7cadc58037b26ecce3bbe3b3c921c8d`) el 14 de septiembre, con migraciones, 11 tablas y `schemaVersion: 1` correctos. Para 1A.2 se instala el nuevo commit validado con el mismo modo `--local-only` y después se ejecuta `scripts/hp-administrador.py`. El bloque completo de entrega incluye ambos pasos; solicita la contraseña del nuevo administrador directamente en la terminal. Ver [acceso 1A.2](ACCESO-1A2.md).

No existe acceso remoto a la HP desde este entorno de desarrollo. El usuario confirmó la instalación local del commit `efb08c975805d20dac38b6a69ce5dc25e9dadfd5` el 14 de septiembre de 2026: web/API saludables y entrada Cloudflare aplicada. El diagnóstico de las 15:17:30 UTC confirmó HTTPS, DNS públicos, túnel activo y arranque PM2 habilitado. El usuario confirmó apertura normal en navegador. El diagnóstico de red no actualizó esa release; posteriormente el usuario instaló 1A.1 según la confirmación indicada arriba.

## Instalar desde la sesión SSH habitual en Termux

La entrega del chat proporciona el comando completo y un commit con CI aprobado. Se ejecuta como `alvaro`, sin `sudo` delante del instalador. 1A.1 solicita sudo para preparar únicamente los recursos MySQL propios. Cloudflare ya funciona; la actualización se ejecuta con `--local-only`.

```bash
# Con el script descargado del mismo commit indicado en la entrega:
LARAMS_REF=<commit-completo-de-40-caracteres> bash hp-instalar.sh --local-only
```

El instalador:

1. Comprueba Linux x86_64, Node 24, herramientas, carpeta propia, puertos y nombres PM2. Bloquea instalaciones simultáneas mediante `flock`.
2. Descarga el commit exacto a una carpeta temporal dentro de `releases`. Requiere al menos 3 GiB de RAM disponible y 4 GiB de disco libre para preparar una versión nueva.
3. Usa `npm exec --package=pnpm@11.19.0` para ejecutar el pnpm del proyecto. No actualiza el pnpm global de la HP. Instala con lockfile, comprueba tipos/lint/esquema, compila secuencialmente y ejecuta la prueba HTTP.
4. Si la release exige MySQL, prepara recursos propios, respalda, aplica migraciones y verifica la conexión. Después arranca únicamente los dos procesos LARAMS; comprueba salud y readiness MySQL. Si falla el arranque, recupera los procesos de la release anterior o retira solo los nuevos cuando es la primera instalación.
5. Cambia el enlace `current` después de superar la salud, conserva `previous` y registra la instalación en `shared/installation.json`. Ejecuta `pm2 save` para guardar la lista actual, sin reiniciar otros procesos. Esto actualiza el inventario persistido del usuario PM2.
6. Solo con `--cloudflare` publica el hostname siguiendo `CLOUDFLARE.md`. Si ese paso falla, mantiene la aplicación local y termina con código 2. Para la actualización actual se omite ese paso porque el túnel ya está configurado.

El modo `--local-only` instala y verifica la aplicación sin ejecutar el paso Cloudflare. En 1A.1 sí crea la base, cuentas SQL y tablas propias; no crea cuentas de acceso ni datos de negocio. No ejecuta el servidor heredado. Consultar [MySQL y respaldos](MYSQL-1A1.md).

## Comprobación y reintento

Si solo falla la última comprobación HTTPS, no hace falta recompilar. La entrega proporciona el script independiente `scripts/hp-verificar-red.py` para ejecutarlo con `python3`, sin sudo. Comprueba los dos servicios locales, el estado del túnel y el servicio de arranque PM2; compara HTTPS normal con consultas DNS públicas por HTTPS a Cloudflare y Google y solicitudes que conservan el hostname/TLS. No sigue redirecciones de autenticación ni imprime cookies, HTML o parámetros de sesión. No modifica resolvers, DNS, túnel, PM2 ni bases. Un DNS público inaccesible se identifica como no comprobado, no como NXDOMAIN. Solo atribuye el fallo al resolver de la HP si curl no resuelve el nombre y el mismo HTTPS responde usando una IP pública actual. En CI se prueba con un servidor HTTP local, sin consultar el subdominio real.

El diagnóstico temporal puede terminar con código 2 si queda un punto pendiente; esto no revierte ni cambia la aplicación instalada.


```bash
curl -fsS http://127.0.0.1:3100/api/health
curl -fsS http://127.0.0.1:3101/api/v1/health
# Después de instalar 1A.1:
curl -fsS http://127.0.0.1:3101/api/v1/ready
# Reintentar únicamente la publicación después de resolver el mensaje pendiente:
bash "$HOME/apps/larams-erp/current/scripts/hp-cloudflare.sh"
```

El diagnóstico posterior confirmó habilitado el servicio de arranque PM2 del usuario. El instalador no creó ni reemplazó ese servicio. Aún falta comprobar la recuperación de LARAMS después de un reinicio programado de la HP. Si ese servicio no existe, debe configurarse antes de cerrar la fase 0 y después comprobar un reinicio programado de la HP.

## Actualizar y recuperar código

Cada actualización se entrega por commit validado y se instala con el mismo procedimiento. Una release ya preparada no se recompila. La activación reinicia únicamente LARAMS, por lo que puede haber una breve pausa de este ERP. No se garantiza despliegue sin interrupción.

Para recuperar la release anterior, sin otra instalación en curso:

```bash
flock -n "$HOME/apps/larams-erp/shared/install.lock" \
  node "$HOME/apps/larams-erp/current/scripts/hp-activar.mjs" rollback \
  "$HOME/apps/larams-erp"
```

La recuperación intercambia las referencias activa/anterior y vuelve a comprobar la salud. En la primera instalación no existe `previous`. Conservamos las releases, así que debe vigilarse el espacio libre y retirar versiones antiguas solo tras identificar cuáles siguen activas. La rotación de logs se incorpora antes de la operación con usuarios.

Este procedimiento recupera código; conserva MySQL. La migración inicial de 1A.1 es compatible con fase 0 y no se deshace al recuperar esa versión. No usar `pm2 restart all`, `pm2 delete all`, reinicios de MySQL, `prisma db push`, `migrate reset` ni el SQL heredado sobre bases existentes.

## Validación automatizada y cierre real

CI compila y prueba Next/Nest, revisa Bash con ShellCheck, prueba la inserción de Cloudflare sobre archivos temporales, comprueba la reversión con un daemon PM2 aislado y ejecuta el instalador real dos veces en un runner Linux. CI no usa el túnel ni las credenciales de la HP. La instalación local ya fue confirmada por el usuario. HTTPS y apertura en navegador ya fueron confirmados por el usuario. Quedan la revisión visual completa, el ensayo de actualización/reversión, la recuperación tras reinicio y la comprobación de las demás aplicaciones después del cambio del túnel. No enviar contraseñas, certificados, tokens ni archivos de entorno por el chat.

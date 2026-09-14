# Publicación con Cloudflare Tunnel

Decisión confirmada: el ERP se publica mediante el túnel existente de la HP. Hostname publicado: `larams.aliproinv.com`. El 14 de septiembre de 2026 a las 15:17:30 UTC, el diagnóstico ejecutado por el usuario confirmó HTTPS con resolución normal y mediante las dos IPv4 obtenidas de DNS públicos; el usuario también confirmó apertura normal en su navegador. El primer fallo de verificación no volvió a reproducirse; su causa exacta no fue demostrada.

Next.js escucha en `127.0.0.1:3100`. NestJS permanece en `127.0.0.1:3101`; no se crea otro hostname para la API ni se abren estos puertos en el router. La comunicación autenticada entre frontend y API se incorpora en fase 1. La fase 0 contiene páginas de alcance y salud, sin login ni datos operativos.

## Qué aplica el script

`scripts/hp-cloudflare.sh` solicita sudo y ejecuta el helper `hp_cloudflare.py`. Usa `python3-yaml` del sistema para validar el documento; si falta, instala únicamente ese paquete mediante apt. No instala otro túnel.

1. Lee los argumentos del proceso activo de `cloudflared` en memoria, sin imprimirlos. Detecta tokens de gestión remota. Exige que el servicio declare explícitamente su archivo local mediante `--config` y que ese archivo identifique el túnel por UUID.
2. Interpreta el YAML, rechaza claves repetidas o formatos especiales no admitidos y prepara una copia candidata. Inserta al principio de `ingress` la regla exacta del ERP, para darle prioridad frente a comodines existentes. Conserva el texto y el significado de todas las reglas anteriores. No sobrescribe una regla existente con el mismo hostname y otro servicio o ajustes.
3. Valida la candidata con `cloudflared tunnel --config ... ingress validate`.
4. Busca un `cert.pem` existente en la carpeta Cloudflare del usuario, junto al archivo efectivo o en la carpeta Cloudflare de root. El certificado de cuenta permite crear DNS; el JSON de credenciales del conector no lo sustituye. No muestra su contenido.
5. Crea/confirma el CNAME mediante `cloudflared tunnel --origincert ... route dns UUID HOSTNAME`, sin la opción de sobrescribir DNS. Si falta el certificado o existe un conflicto, la publicación queda pendiente y el archivo del túnel no cambia.
6. Conserva una copia junto al archivo efectivo, comprueba que nadie lo haya modificado durante la preparación y sustituye la configuración de forma atómica. Reinicia el servicio `cloudflared` y comprueba que siga activo. Este reinicio puede cortar brevemente conexiones de otras aplicaciones del mismo túnel; una actualización posterior de código del ERP no necesita reiniciarlo si su regla ya coincide.
7. Si falla la aplicación local del cambio, restaura la copia anterior siempre que ninguna otra operación haya modificado entretanto el archivo. El registro DNS del nuevo hostname puede permanecer creado; no se borran registros automáticamente. Verifica finalmente la respuesta de salud de Next por HTTPS. La propagación, Cloudflare Access o la conectividad pueden dejar esta última comprobación pendiente aunque el servicio esté activo.

## Si el túnel se administra desde el panel

El script conserva la aplicación instalada y comunica que debe añadirse al túnel existente la aplicación publicada `larams.aliproinv.com` con servicio `http://127.0.0.1:3100`. No modifica un archivo local que el servicio no utilice. Configurar el hostname en el panel y comprobar su respuesta HTTPS completa este paso.

En esta HP el instalador confirmó gestión mediante archivo local y aplicó la entrada con copia de `/etc/cloudflared/config.yml`. En otros equipos debe comprobarse la configuración efectiva. No se adivinan identificadores ni se solicitan tokens por el chat. Los cambios manuales se revisan sobre la configuración efectiva, conservando las demás aplicaciones.

## Acceso y GPS

Antes de admitir información real deben estar implementados autenticación, permisos y sesiones. Las políticas existentes de Cloudflare Access no se cambian con esta entrega; si protegen el hostname, una petición sin sesión puede no alcanzar el endpoint de salud.

El túnel web no resuelve automáticamente los protocolos TCP/UDP de dispositivos GPS. Su receptor y conectividad se definen en fase 9 según los equipos reales.

Referencias oficiales: [configuración y validación de ingress](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/local-management/configuration-file/) y [DNS y certificado de cuenta](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/).

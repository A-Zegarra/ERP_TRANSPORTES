# Flujo de trabajo: GitHub → Termux → HP

## Situación

La HP es un servidor del usuario con otras aplicaciones. No se tiene acceso SSH a ella desde este entorno. El usuario confirmó Cloudflare Tunnel para publicar el ERP; no hay ruta, dirección interna ni dominio de LARAM’S comprobados todavía.

Esta entrega prepara la fase 0 y el diagnóstico. No instala servicios en la HP ni utiliza MySQL de otros proyectos.

## Propuesta de aislamiento (pendiente de diagnóstico)

| Recurso | Candidato |
|---|---|
| Carpeta propia | `$HOME/apps/larams-erp` bajo el usuario de despliegue |
| Releases | `$HOME/apps/larams-erp/releases/<commit>` |
| Configuración/archivos | `$HOME/apps/larams-erp/shared` |
| Frontend | `127.0.0.1:3100`, proceso `larams-erp-web` |
| API | `127.0.0.1:3101`, proceso `larams-erp-api` |
| Base MySQL futura | `larams_erp`, usuario limitado propio |
| Dominio/túnel | Cloudflare Tunnel existente; hostname propuesto `larams.aliproinv.com` |

La API no se conecta todavía con el frontend ni con MySQL: únicamente se valida el arranque independiente. La comunicación autenticada de negocio se incorpora en la fase 1.

## Primer paso: diagnóstico de solo lectura

Abrir la conexión SSH habitual desde Termux y ejecutar `bash scripts/hp-diagnostico.sh` si se tiene la rama descargada. También se puede descargar ese único script desde el commit exacto indicado en la entrega, validarlo con `bash -n` y ejecutarlo. No requiere sudo, no lee `.env` ni muestra credenciales.

Recoge arquitectura, sistema operativo, versiones disponibles, memoria, espacio, puertos y existencia de las rutas candidatas. No ejecuta `pm2 jlist` ni otros comandos que puedan imprimir variables de entorno. No inicia el daemon de PM2.

La entrega del chat proporciona un comando completo que usa un archivo temporal y una URL fijada al commit. El usuario debe ejecutarlo dentro de la sesión de la HP, no directamente en el shell local de Android.

## Instalación de fase 0 tras el diagnóstico

La instalación se concretará con los recursos confirmados:

1. Seleccionar el commit con CI aprobado y la ruta propia. Comprobar que el repositorio y las rutas pertenecen a este ERP; no reutilizar otro proyecto.
2. Usar Node 24 para estos procesos sin reiniciar aplicaciones ajenas. El uso de nvm no cambia el intérprete de procesos PM2 ya arrancados; la configuración del nuevo proceso debe fijar su ejecutable.
3. Verificar los puertos antes de arrancar. Si alguno está ocupado, elegir otro y registrar el cambio en la entrega.
4. Instalar dependencias bloqueadas en una release nueva y compilar secuencialmente, solo si la memoria disponible lo permite. Alternativa: descargar el artefacto standalone de CI y verificar commit/arquitectura/sistema y su SHA-256. El archivo `larams-web.tgz` conserva enlaces y permisos; se extrae en una carpeta propia y se inicia con `PORT=<puerto> node start.cjs`. Un artefacto de frontend no incluye el backend Nest ni MySQL.
5. Arrancar web y API bajo nombres propios en loopback. Registrar salud de ambos. Verificar el acceso mediante túnel SSH o dirección de prueba elegida.
6. Preparar reversión de código conservando la release anterior y la configuración compartida. No prometer reversión automática de migraciones destructivas: en fase 1 se adopta expandir/migrar/contraer y respaldo previo.
7. La exposición por subdominio HTTPS se configura mediante Cloudflare Tunnel, como las otras aplicaciones. Consultar `CLOUDFLARE.md`; los puertos son exclusivamente internos y no se abren en el router. La fase 0 no tiene autenticación ni datos de negocio; mantener el piloto restringido.

## Actualizaciones siguientes

Se entregará un comando por actualización, identificado por commit, con estas operaciones cuando correspondan: comprobaciones → respaldo → nueva release → instalación/build o artefacto → migraciones compatibles → reinicio exclusivo del ERP → salud y verificación funcional → registro de resultado. Si una comprobación falla, detener antes de sustituir la versión activa.

El usuario aplica el comando desde Termux. El desarrollo y CI se mantienen en GitHub. No utilizar `pm2 restart all`, `pm2 delete all`, reinicios de MySQL compartido o cambios globales de Nginx/Cloudflare para actualizar este ERP.

No introducir seeds ni `prisma db push`, `migrate reset` o importaciones del SQL heredado sobre una base existente. Toda migración del legado será una entrega propia con mapeo, prueba y reconciliación de cantidades/relaciones.

## Datos que habilitan la siguiente entrega

Resultado del diagnóstico, subdominio o forma de acceso deseada y confirmación de si existe una base anterior con información que deba conservarse. No enviar contraseñas, tokens, certificados ni archivos `.env` en el chat.

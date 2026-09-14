# Publicación con Cloudflare Tunnel

Decisión confirmada por el usuario: este ERP funcionará como sus otras aplicaciones, mediante Cloudflare Tunnel en la HP.

## Acceso

- Dirección propuesta: `https://larams.aliproinv.com`. Todavía no está creada ni comprobada.
- Cloudflare recibe HTTPS y el túnel conecta con Next.js en una dirección de loopback de la HP.
- El puerto local candidato `3100` es un dato interno del servicio. No aparece en la dirección de acceso ni requiere abrir ese puerto en el router.
- NestJS permanece en loopback, candidato `3101`. El navegador usará el mismo origen del ERP; su acceso autenticado a la API se implementa en la fase 1 mediante la capa de servidor de Next/proxy. No se necesita publicar un segundo subdominio de API para esta base.

## Incorporación al túnel existente

La HP utiliza un túnel existente con aplicaciones ya configuradas. Primero comprobar cómo se gestiona actualmente; si sigue usando el archivo local, el bloque de ejemplo está en `infra/cloudflare/larams.ingress.example.yml`.

1. Verificar el arranque del ERP y la dirección interna disponible.
2. Conservar una copia del archivo de configuración del túnel existente.
3. Añadir solo la entrada del ERP dentro de `ingress`, antes del último `http_status:404`. El ejemplo es un fragmento, no un sustituto del archivo completo.
4. Crear la ruta DNS del subdominio al mismo túnel mediante su mecanismo de gestión actual; usar su identificador real, sin inventarlo ni compartir credenciales.
5. Validar la configuración antes de aplicar el cambio y comprobar el hostname localmente mediante las herramientas de `cloudflared`.
6. Aplicar únicamente la configuración necesaria y comprobar HTTPS, Next.js y las aplicaciones existentes.

La fase 0 no tiene sesiones ni datos operativos. La exposición inicial se realizará con el acceso de prueba acordado; antes de admitir información real debe cerrarse la fase de autenticación y permisos.

El diagnóstico de puertos sigue siendo necesario para evitar que dos aplicaciones intenten escuchar en la misma dirección interna. No equivale a proponer acceso público por IP: el acceso de usuario será siempre el subdominio HTTPS.

## Separación respecto de GPS

Este túnel resuelve la publicación web. Los dispositivos GPS pueden usar protocolos TCP/UDP propios; su ingreso requiere una solución compatible que se definirá en la fase 9. No asumir que apuntarlos al subdominio HTTPS del ERP permite recibir sus mensajes.

Referencia: [protocolos de aplicaciones publicadas en Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/protocols/).

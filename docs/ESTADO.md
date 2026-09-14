# Estado del proyecto

Fecha de referencia: 14 de septiembre de 2026.

## Decisiones confirmadas por el usuario

- Adoptar Next.js para mantener coherencia con sus otros proyectos.
- MySQL como base relacional.
- Empresa de transporte con base en Tacna y rutas terrestres internacionales, inicialmente Perú–Chile.
- Cotizaciones y viajes por tramos, tipos de carga, toneladas, refrigeración, peajes, viáticos y otros gastos.
- Clientes, proveedores, logística, almacén, mantenimiento, recursos humanos, finanzas y otros servicios.
- Visualización por vehículo y posición de llantas, con historial de desgaste y daños.
- Seguimiento por GPS de conductores y dispositivos, mapa y llegada estimada.
- Configuración independiente y personalizable de empresa, logos y colores; configuración SUNAT.
- Implementación por fases en la HP, actualizada desde Termux.
- Publicación mediante Cloudflare Tunnel como las otras aplicaciones; puertos solo internos. Subdominio `larams.aliproinv.com` incorporado al túnel local; HTTPS y acceso en navegador confirmados por el usuario.

## Implementado en esta entrega

- Workspace independiente del código heredado: `apps/web` y `apps/api`.
- Next.js, React, TypeScript y Tailwind; páginas navegables con alcances explícitos.
- API NestJS con prefijo `/api/v1` y salud del proceso.
- Cliente Prisma y adaptador MySQL, migración inicial de 11 tablas para organización y futuro acceso.
- Base propia, cuentas MySQL limitadas, respaldo previo/posterior y comprobación real de conexión en `/api/v1/ready` (1A.1, pendiente de aplicar en la HP).
- Pipeline CI, prueba de humo de compilados y diagnóstico de la HP.
- Instalador por commit, releases, procesos PM2 propios, comprobación de salud y recuperación automática de código ante un arranque fallido.
- Publicación preparada para el túnel Cloudflare local existente, con copia previa, validación y detección de conflictos; alternativa indicada para túneles administrados desde el panel.
- Plan maestro, arquitectura y operación documentados.

## No implementado todavía

Autenticación, autorización de peticiones, CRUD de configuración, carga de archivos, datos operativos, cotizaciones, pagos, contabilidad, telemetría, integración SUNAT y migración del sistema heredado.

## Fase 0: despliegue y acceso confirmados

Validación local realizada: instalación con lockfile, lint, TypeScript, `prisma validate`, compilación de web/API y prueba HTTP del frontend standalone, estilos, navegación, 404 y API de salud. El usuario proporcionó el diagnóstico de la HP: Ubuntu 26.04 x86_64, Node 24.19.0, pnpm 11.1.1, MySQL 8.4.11, cloudflared 2026.8.2 activo, 5740 MiB de memoria disponible y 76 GiB libres. El usuario instaló en la HP el commit `efb08c975805d20dac38b6a69ce5dc25e9dadfd5`: dependencias, lint, tipos, esquema, compilación y prueba HTTP aprobados; web y API arrancaron bajo PM2 y respondieron correctamente. MySQL del ERP sigue pendiente de fase 1. El usuario confirmó que la página abre normalmente en su navegador. Esto acredita el acceso visual inicial, no una revisión completa de todas las pantallas ni de todos los tamaños de dispositivo.

- [x] Confirmar recursos actuales de la HP, versiones y puertos con el diagnóstico aportado por el usuario.
- [x] Verificar disponibilidad inicial de `/home/alvaro/apps/larams-erp` y 3100/3101; nombres PM2 reservados en el instalador y sujetos a comprobación antes de usarlos.
- [x] Incorporar `larams.aliproinv.com` al túnel efectivo local y comprobar el servicio activo después del reinicio.
- [x] Confirmar salud pública por HTTPS y acceso en navegador, según diagnóstico y confirmación del usuario.
- [x] Instalar el commit validado y verificar ambas aplicaciones desde la HP, según salida proporcionada por el usuario.
- [x] Registrar la instalación y su resultado.
- [x] Confirmar apertura normal en el navegador del usuario.
- [x] Confirmar `cloudflared` activo y servicio de arranque PM2 habilitado.
- [ ] Ensayar actualización/reversión en la HP y comprobar recuperación después de un reinicio programado. El servicio habilitado no acredita por sí solo esa prueba.
- [ ] Completar revisión visual de módulos y adaptación móvil.

CI incorpora pruebas de conservación del YAML, protección de procesos PM2 ajenos, recuperación tras un arranque fallido e instalación real repetida en runner Linux. Estas pruebas no utilizan Cloudflare real ni sustituyen la aceptación en la HP.

La instalación en HP se acredita por el resultado compartido por el usuario. No se dispone de acceso SSH desde este entorno. El 14 de septiembre el instalador validó y aplicó la entrada Cloudflare y conservó `/etc/cloudflared/config.yml.larams-20260914T150345-2751.bak`. La primera consulta final de salud HTTPS no se confirmó. La comprobación posterior del 14 de septiembre a las 15:17:30 UTC fue satisfactoria; la incidencia ya no se reproduce y no se identificó su causa exacta.

`scripts/hp-verificar-red.py` se ejecutó desde el commit `4daa99ce06387015cd1ceba90f4d130f06bdec53`; fue un diagnóstico independiente y no actualizó la release instalada `efb08c975805d20dac38b6a69ce5dc25e9dadfd5`.

| Comprobación en HP | Resultado comunicado |
|---|---|
| Web local | HTTP 200, identidad `larams-web` y salud correcta |
| API local | HTTP 200, identidad `larams-api` y salud correcta |
| HTTPS con resolución normal | HTTP 200 y salud de LARAMS |
| DNS públicos Cloudflare y Google | Ambos resolvieron el hostname correctamente |
| HTTPS mediante las dos IPv4 obtenidas | HTTP 200 y salud de LARAMS, con validación TLS |
| Cloudflare Tunnel | Servicio activo |
| Arranque PM2 | Servicio habilitado |
| Navegador del usuario | Abre normalmente |

La evidencia se basa en la salida y confirmación proporcionadas por el usuario. No se atribuye una comprobación remota independiente al entorno de desarrollo. No hace falta modificar DNS ni repetir la instalación para resolver esta incidencia.

El despliegue y el acceso público quedan validados. Los ensayos operativos pendientes permanecen abiertos; no se declara realizada una prueba de reinicio de la HP ni de recuperación de código en ese equipo.

## Siguiente unidad de trabajo

Fase 1A.1 implementada en la rama `feat/fase-1a-mysql`. El alcance detallado está en [FASE-1-EMPRESA-ACCESO.md](FASE-1-EMPRESA-ACCESO.md); la operación y límites están en [MYSQL-1A1.md](MYSQL-1A1.md). CI incorpora MySQL 8.4 real: colisiones de nombres, actualización desde el commit instalado en la HP, reintento, conservación de datos/credenciales, permisos SQL, claves entre empresas, reconexión y restauración en una base separada. El resultado aprobado debe verificarse en el commit entregado.

Siguiente paso: instalar 1A.1 y comprobar MySQL desde la HP. Después, 1A.2 incorpora administrador inicial, sesiones y autorización; 1A.3 habilita la edición de empresa/sucursales. Fase 1B: configuración visual y consulta de auditoría. La base publicada actual se conserva como versión conocida para recuperación; antes de admitir información operativa se completarán los ensayos pendientes en la HP y el respaldo fuera del equipo.

## Datos a concretar en su fase

Modelo real de ejes y vehículos; unidades/tarifas; usuarios y responsabilidades; documentos y reglas de aprobación; primera serie de comprobantes; modalidad de emisión SUNAT y tratamiento tributario con el contador; marca/modelo/protocolo de GPS; disponibilidad de sensores; cantidad de dispositivos, frecuencia de envío y retención; alcance de planillas.

Estos datos no impiden implementar la base, pero sí condicionan las pruebas y la aceptación de esos módulos.

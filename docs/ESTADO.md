# Estado del proyecto

Fecha de referencia: 16 de septiembre de 2026.

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
- Cliente Prisma y adaptador MySQL, migraciones aditivas y 14 tablas de aplicación para organización, acceso, identidad visual y auditoría.
- Base propia, cuentas MySQL limitadas, respaldos y readiness (1A.1 ya confirmada en la HP).
- Login, Mi cuenta, cierre de sesión, sesiones con vencimiento/revocación, autorización en API y alta inicial por terminal (1A.2 instalada; registro e ingreso confirmados en la HP).
- Empresa, sucursales, usuarios, perfiles Administrador/Consulta, cambio de contraseña, paginación y protección de edición concurrente (1A.3 instalada y funcionamiento confirmado por el usuario).
- Nombre visible, lema, colores, logo validado, espaciado de tablas y auditoría paginada con antes/después; respaldo SQL y archivos de logos (1B implementada, pendiente de aceptación en la HP).
- Pipeline CI, prueba de humo de compilados y diagnóstico de la HP.
- Instalador por commit, releases, procesos PM2 propios, comprobación de salud y recuperación automática de código ante un arranque fallido.
- Publicación preparada para el túnel Cloudflare local existente, con copia previa, validación y detección de conflictos; alternativa indicada para túneles administrados desde el panel.
- Plan maestro, arquitectura y operación documentados.

## No implementado todavía

Edición de identidad informática y perfiles personalizados, MFA, recuperación de contraseña por correo o por otro administrador, adjuntos operativos, datos maestros, cotizaciones, pagos, contabilidad, telemetría, integración SUNAT y migración del sistema heredado.

## Fase 0: despliegue y acceso confirmados

Validación local realizada: instalación con lockfile, lint, TypeScript, `prisma validate`, compilación de web/API y prueba HTTP del frontend standalone, estilos, navegación, 404 y API de salud. El usuario proporcionó el diagnóstico de la HP: Ubuntu 26.04 x86_64, Node 24.19.0, pnpm 11.1.1, MySQL 8.4.11, cloudflared 2026.8.2 activo, 5740 MiB de memoria disponible y 76 GiB libres. El usuario instaló en la HP el commit `efb08c975805d20dac38b6a69ce5dc25e9dadfd5`: dependencias, lint, tipos, esquema, compilación y prueba HTTP aprobados; web y API arrancaron bajo PM2 y respondieron correctamente. En esa entrega MySQL del ERP todavía estaba pendiente de fase 1. El usuario confirmó que la página abre normalmente en su navegador. Esto acredita el acceso visual inicial, no una revisión completa de todas las pantallas ni de todos los tamaños de dispositivo.

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

El usuario confirmó la instalación de 1A.1, commit `92b261bbd7cadc58037b26ecce3bbe3b3c921c8d`: lint, tipos, build y smoke aprobados; MySQL preparado, migración aplicada, 11 tablas presentes y JSON `{"status":"ok","service":"larams-api","database":"ok","schemaVersion":1}`. Respaldos reportados: `larams-20260914T203302223214Z-antes.sql.gz` y `larams-20260914T203335152803Z-despues.sql.gz` dentro de `shared/backups`. PM2 habilitado. Esta es evidencia aportada por el usuario, no acceso SSH desde desarrollo.

El 15 de septiembre el usuario confirmó la instalación de 1A.2, commit `76ffd7f152a085ba3bd82cc3a0bb077da878c504`: validaciones/build aprobados, 13 tablas, servicios saludables y PM2 habilitado. Respaldos: `larams-20260915T044213117510Z-antes.sql.gz` y `larams-20260915T044228565147Z-despues.sql.gz`. El primer alta se detuvo por validación de contraseña; posteriormente confirmó registro del administrador e inicio de sesión. Esto acredita ingreso, no cierre de sesión ni reinicio del equipo.

El usuario instaló 1A.3, commit c0c5a56dc2ae876918ab7758617c0de81568b5b6, y compartió validaciones aprobadas, migraciones, 13 tablas y readiness con database: ok y schemaVersion: 3. Respaldos reportados: larams-20260915T231111816957Z-antes.sql.gz y larams-20260915T231126038368Z-despues.sql.gz. Posteriormente confirmó que todo funciona y autorizó continuar con 1B. Esta aceptación no acredita por sí sola todos los ensayos de recuperación, reinicio o volumen.

Siguiente paso: instalar y aceptar [1B: identidad visual y auditoría](PERSONALIZACION-1B.md). CI ensaya actualización desde 1A.3 con administrador existente, conservación de datos/hash, permisos, concurrencia, paginación, recuperación y restauración de SQL y logos. Después sigue fase 2: datos maestros. Los ensayos pendientes en la HP y el respaldo externo siguen abiertos.

## Datos a concretar en su fase

Modelo real de ejes y vehículos; unidades/tarifas; usuarios y responsabilidades; documentos y reglas de aprobación; primera serie de comprobantes; modalidad de emisión SUNAT y tratamiento tributario con el contador; marca/modelo/protocolo de GPS; disponibilidad de sensores; cantidad de dispositivos, frecuencia de envío y retención; alcance de planillas.

Estos datos no impiden implementar la base, pero sí condicionan las pruebas y la aceptación de esos módulos.

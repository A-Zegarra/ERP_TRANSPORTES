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
- Publicación mediante Cloudflare Tunnel como las otras aplicaciones; puertos solo internos. Subdominio `larams.aliproinv.com` incorporado al túnel local; comprobación HTTPS pendiente.

## Implementado en esta entrega

- Workspace independiente del código heredado: `apps/web` y `apps/api`.
- Next.js, React, TypeScript y Tailwind; páginas navegables con alcances explícitos.
- API NestJS con prefijo `/api/v1` y salud del proceso.
- Esquema Prisma inicial para MySQL, sin migraciones.
- Pipeline CI, prueba de humo de compilados y diagnóstico de la HP.
- Instalador por commit, releases, procesos PM2 propios, comprobación de salud y recuperación automática de código ante un arranque fallido.
- Publicación preparada para el túnel Cloudflare local existente, con copia previa, validación y detección de conflictos; alternativa indicada para túneles administrados desde el panel.
- Plan maestro, arquitectura y operación documentados.

## No implementado todavía

Autenticación, permisos, conexión MySQL, CRUD de configuración, carga de archivos, datos operativos, cotizaciones, pagos, contabilidad, telemetría, integración SUNAT y migración del sistema heredado.

## Cierre pendiente de fase 0

Validación local realizada: instalación con lockfile, lint, TypeScript, `prisma validate`, compilación de web/API y prueba HTTP del frontend standalone, estilos, navegación, 404 y API de salud. El usuario proporcionó el diagnóstico de la HP: Ubuntu 26.04 x86_64, Node 24.19.0, pnpm 11.1.1, MySQL 8.4.11, cloudflared 2026.8.2 activo, 5740 MiB de memoria disponible y 76 GiB libres. El usuario instaló en la HP el commit `efb08c975805d20dac38b6a69ce5dc25e9dadfd5`: dependencias, lint, tipos, esquema, compilación y prueba HTTP aprobados; web y API arrancaron bajo PM2 y respondieron correctamente. MySQL del ERP sigue pendiente de fase 1. La comprobación visual en navegador queda pendiente si el entorno no dispone de Chromium; la prueba HTTP no la sustituye.

- [x] Confirmar recursos actuales de la HP, versiones y puertos con el diagnóstico aportado por el usuario.
- [x] Verificar disponibilidad inicial de `/home/alvaro/apps/larams-erp` y 3100/3101; nombres PM2 reservados en el instalador y sujetos a comprobación antes de usarlos.
- [x] Incorporar `larams.aliproinv.com` al túnel efectivo local y comprobar el servicio activo después del reinicio.
- [ ] Confirmar salud pública por HTTPS y acceso en navegador.
- [x] Instalar el commit validado y verificar ambas aplicaciones desde la HP, según salida proporcionada por el usuario.
- [x] Registrar la instalación y su resultado.
- [ ] Comprobar visualmente, probar actualización/reversión en la HP y arranque tras reinicio.

CI incorpora pruebas de conservación del YAML, protección de procesos PM2 ajenos, recuperación tras un arranque fallido e instalación real repetida en runner Linux. Estas pruebas no utilizan Cloudflare real ni sustituyen la aceptación en la HP.

La instalación en HP se acredita por el resultado compartido por el usuario. No se dispone de acceso SSH desde este entorno. El 14 de septiembre el instalador validó y aplicó la entrada Cloudflare y conservó `/etc/cloudflared/config.yml.larams-20260914T150345-2751.bak`. La consulta final de salud HTTPS no se confirmó; ese mensaje genérico no permite atribuir la causa a propagación, DNS local, Access o al túnel.

Se añade `scripts/hp-verificar-red.py`, independiente y de solo lectura, para comparar servicios locales, acceso HTTPS normal y acceso con direcciones obtenidas de dos DNS públicos. Conserva la validación TLS y no modifica la release instalada. La comprobación externa desde el entorno de desarrollo no estuvo disponible; no equivale a una prueba de caída del sitio.

## Siguiente unidad de trabajo

Fase 1A: migración inicial MySQL, empresa/sucursal, usuarios, sesiones y permisos denegados por defecto. Primero confirmar HTTPS y cerrar la aceptación de fase 0. Fase 1B: personalización persistente y auditoría.

## Datos a concretar en su fase

Modelo real de ejes y vehículos; unidades/tarifas; usuarios y responsabilidades; documentos y reglas de aprobación; primera serie de comprobantes; modalidad de emisión SUNAT y tratamiento tributario con el contador; marca/modelo/protocolo de GPS; disponibilidad de sensores; cantidad de dispositivos, frecuencia de envío y retención; alcance de planillas.

Estos datos no impiden implementar la base, pero sí condicionan las pruebas y la aceptación de esos módulos.

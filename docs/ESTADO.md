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
- Publicación mediante Cloudflare Tunnel como las otras aplicaciones; puertos solo internos. Subdominio propuesto `larams.aliproinv.com`, pendiente de configurar.

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

Validación local realizada: instalación con lockfile, lint, TypeScript, `prisma validate`, compilación de web/API y prueba HTTP del frontend standalone, estilos, navegación, 404 y API de salud. El usuario proporcionó el diagnóstico de la HP: Ubuntu 26.04 x86_64, Node 24.19.0, pnpm 11.1.1, MySQL 8.4.11, cloudflared 2026.8.2 activo, 5740 MiB de memoria disponible y 76 GiB libres. No se ha comprobado la conexión MySQL del ERP ni se ha instalado la aplicación en ese equipo. La comprobación visual en navegador queda pendiente si el entorno no dispone de Chromium; la prueba HTTP no la sustituye.

- [x] Confirmar recursos actuales de la HP, versiones y puertos con el diagnóstico aportado por el usuario.
- [x] Verificar disponibilidad inicial de `/home/alvaro/apps/larams-erp` y 3100/3101; nombres PM2 reservados en el instalador y sujetos a comprobación antes de usarlos.
- [ ] Publicar y verificar `larams.aliproinv.com` en el túnel efectivo de la HP.
- [ ] Instalar el commit validado y verificar ambas aplicaciones desde la HP.
- [ ] Registrar instalación, prueba visual y actualización/reversión en la HP; comprobar arranque tras reinicio.

CI incorpora pruebas de conservación del YAML, protección de procesos PM2 ajenos, recuperación tras un arranque fallido e instalación real repetida en runner Linux. Estas pruebas no utilizan Cloudflare real ni sustituyen la aceptación en la HP.

La existencia del código y de CI no demuestra un despliegue en la HP. No se dispone de acceso remoto a ese equipo en esta entrega.

## Siguiente unidad de trabajo

Fase 1A: migración inicial MySQL, empresa/sucursal, usuarios, sesiones y permisos denegados por defecto. Primero resolver la instalación aislada de fase 0. Fase 1B: personalización persistente y auditoría.

## Datos a concretar en su fase

Modelo real de ejes y vehículos; unidades/tarifas; usuarios y responsabilidades; documentos y reglas de aprobación; primera serie de comprobantes; modalidad de emisión SUNAT y tratamiento tributario con el contador; marca/modelo/protocolo de GPS; disponibilidad de sensores; cantidad de dispositivos, frecuencia de envío y retención; alcance de planillas.

Estos datos no impiden implementar la base, pero sí condicionan las pruebas y la aceptación de esos módulos.

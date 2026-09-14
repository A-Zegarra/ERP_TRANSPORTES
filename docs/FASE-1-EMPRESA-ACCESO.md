# Fase 1 — Empresa, MySQL y acceso

Estado: planificada. Este documento define la siguiente entrega; no declara funcionalidades implementadas ni modifica la HP.

## Punto de partida confirmado

La fase 0 está instalada en `/home/alvaro/apps/larams-erp`, con web/API saludables y acceso normal en `https://larams.aliproinv.com`. Cloudflare está activo y el servicio de arranque PM2 habilitado. MySQL 8.4 está disponible en la HP, pero el ERP aún no tiene conexión, migraciones ni usuarios operativos. La versión instalada es `efb08c975805d20dac38b6a69ce5dc25e9dadfd5`.

## Entregas controladas

| Entrega | Trabajo | Resultado verificable |
|---|---|---|
| 1A.1 — Persistencia | Base MySQL exclusiva, usuarios de conexión limitados, cliente Prisma y adaptador compatibles, migraciones versionadas, empresa y sucursal | Crear desde una base vacía y comprobar conexión real; detectar una base existente antes de modificarla |
| 1A.2 — Acceso | Administrador inicial mediante comando local, inicio/cierre de sesión, expiración/revocación y permisos por área/acción | Login real; peticiones sin sesión rechazadas; usuarios sin permiso rechazados directamente en API |
| 1A.3 — Empresa | Datos básicos de empresa/sucursal y administración de usuarios con alcance autorizado | Guardar y recuperar configuración desde MySQL; los cambios sobreviven al reinicio de los procesos |
| 1B — Personalización y trazabilidad | Logos, colores, preferencias y consulta de auditoría | Configuración visual persistente; historial de cambios con usuario y fecha, sin registrar contraseñas o sesiones |

Cada entrega se valida por separado. Configurar SUNAT se mantiene en la fase correspondiente: guardar datos de empresa no equivale a emitir comprobantes.

## Reglas de implementación

- Mantener Next.js como interfaz y capa del mismo origen; NestJS concentra autenticación, autorización, reglas y acceso a MySQL. Una sola autoridad de sesión.
- Separar identidad informática de colaboradores y conductores. Un usuario no implica automáticamente un registro laboral.
- Proteger operaciones en el backend con denegación por defecto; verificar alcance de empresa/sucursal. Ocultar una opción del menú no concede ni revoca permisos.
- Registrar empresa, sucursal, usuario, sesión, rol, permiso y asignaciones con claves, relaciones y restricciones coherentes. Los eventos de acceso y cambios de permisos tendrán trazabilidad desde 1A; su pantalla de consulta se completa en 1B.
- Usar migraciones, un pool acotado y paginación en servidor. Definir índices según filtros, unicidad y orden de los listados; medir antes de ampliar conexiones o infraestructura.
- Conservar secretos y archivos compartidos fuera de las releases y de Git. La aplicación utiliza una cuenta MySQL limitada; las migraciones tienen los permisos específicos que requieran.
- Comprobar acceso administrativo local a MySQL y la existencia de los nombres previstos antes de crear recursos. No importar el SQL heredado ni restablecer bases existentes como parte del arranque.
- La creación inicial del administrador será explícita e idempotente; una actualización no debe crear usuarios extra, cambiar contraseñas existentes ni cargar datos de demostración.

## Pruebas de aceptación

1. Migración sobre una base vacía y actualización compatible desde la versión anterior; detección de colisiones con bases o usuarios ya existentes.
2. Inicio de sesión correcto e incorrecto, cierre, expiración y revocación; validación de entradas y controles de las peticiones que modifican datos.
3. Rechazo de operaciones sin sesión, sin permiso o fuera del alcance autorizado, aunque se llame directamente a la API.
4. Persistencia real de empresa/configuración después de reiniciar los procesos del ERP y listados con límites comprobados.
5. Respaldo y restauración inicial en una base de prueba separada; recuperación de código compatible con la migración.

Los ensayos de reinicio y recuperación de la HP pendientes de fase 0 siguen registrados; no se consideran realizados por tener PM2 habilitado o por aprobar CI. Se completarán antes de admitir información operativa.

## Despliegue previsto

Se entregará un único comando por versión validada, ejecutado desde la sesión SSH de la HP iniciada en Termux. El flujo comprobará el estado actual, preparará la base exclusiva y el respaldo cuando corresponda, instalará una nueva release, aplicará migraciones compatibles y verificará servicios y acceso. La ruta Cloudflare existente ya funciona y no necesita cambios para incorporar persistencia y login.

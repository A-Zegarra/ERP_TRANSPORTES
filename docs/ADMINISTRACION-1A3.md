# Empresa, sucursales y usuarios — 1A.3

## Punto de partida

El usuario confirmó la instalación de 1A.2, commit `76ffd7f152a085ba3bd82cc3a0bb077da878c504`, y posteriormente el registro del administrador y el inicio de sesión en la HP. El primer intento de alta se detuvo por validación de contraseña antes de guardar. No se recibió confirmación del cierre de sesión ni del reinicio del equipo.

1A.3 incorpora `/configuracion`: empresa, sucursales y usuarios. Queda pendiente instalar y aceptar esta entrega en la HP; CI no sustituye esa aceptación.

## Funciones

- Empresa: razón social, nombre comercial, país, documento, moneda y zona horaria. Para Perú, el documento opcional se guarda como RUC de 11 dígitos; no se consulta SUNAT ni se verifica su estado tributario.
- Sucursales: alta, edición y desactivación conservando historial, con país, zona horaria y dirección propios. Se conserva al menos una sucursal activa.
- Usuarios: alta con nombre, correo, contraseña inicial confirmada, perfil y sucursales. Edición de acceso activo, perfil y asignaciones. No se eliminan usuarios ni se modifica su identidad global (nombre/correo) desde otra empresa.
- Mi cuenta: cambio de contraseña verificando la actual; cierra todas las sesiones de esa identidad. Las cuentas nuevas deben cambiar la contraseña inicial antes de acceder a configuración. La cuenta existente conserva su contraseña y no recibe esa obligación al actualizar.
- Listados: búsqueda literal por prefijo, páginas de hasta 20 filas y cursor por ID, sin OFFSET ni conteo total. Hasta 50 sucursales asignadas por usuario mediante selector paginado.

## Perfiles

| Perfil | Empresa | Sucursales | Usuarios |
|---|---|---|---|
| Administrador | Consulta y edición | Administra todas las de su empresa | Alta y administración de accesos |
| Consulta | Solo lectura | Solo las activas asignadas | Sin acceso |

El administrador tiene alcance de configuración de toda su empresa, aunque tenga menos sucursales asignadas. Los permisos de operaciones futuras se implementarán en sus módulos. No hay selector multiempresa ni editor de perfiles personalizados en esta entrega.

## Controles

La API toma la empresa de la sesión, nunca del cuerpo de la petición. Rechaza campos adicionales, relaciones entre empresas y métodos no habilitados. Next publica solo las rutas enumeradas; no expone readiness ni un proxy arbitrario. Se conservan el límite de JSON, validación de Origin, cabecera de intención, cookies privadas y respuestas sin caché.

Cada edición exige la versión leída del registro; si quedó obsoleta devuelve 409. Las escrituras administrativas bloquean la fila de empresa y revalidan sesión y permiso dentro de la transacción ReadCommitted. Dos bajas simultáneas no pueden dejar la empresa sin administrador: debe permanecer otro administrador activo que ya haya cambiado su contraseña inicial.

Cambiar perfil, sucursales o estado revoca las sesiones anteriores de esa membresía. Reactivar no revive sesiones. El cambio de contraseña verifica atómicamente el hash anterior; el login coordina sus bloqueos para no emitir sesiones con una contraseña que acaba de cambiar.

Las altas y cambios guardan actor, entidad, acción y fecha en auditoría, dentro de la misma transacción. No guardan contraseñas ni hashes. La pantalla de auditoría y valores anteriores/posteriores quedan para 1B.

## Migración y despliegue

Tercera migración aditiva: versiones de empresa, sucursal y membresía; indicador de cambio de contraseña; cinco permisos adicionales y perfil Consulta. Amplía el perfil Administrador existente. Mantiene 13 tablas de aplicación y la tabla técnica de Prisma. Readiness devuelve `schemaVersion: 3`.

Instalar el commit fijo entregado con `--local-only`. El instalador respalda MySQL, aplica migraciones, activa y comprueba los procesos propios. La ruta Cloudflare permanece configurada. No repetir el alta inicial ni cargar datos de demostración.

La recuperación de código a 1A.2 conserva la base y las cuentas. Esa versión no dispone de administración ni exige el cambio de contraseña inicial añadido en 1A.3: recuperar código no conserva todas las garantías funcionales de la versión nueva. No se deshacen datos ni migraciones automáticamente.

## Pruebas y aceptación

CI instala 1A.2 en MySQL 8.4 desechable, crea su administrador por TTY y actualiza con datos, conservando identidad y hash. Comprueba operaciones mediante Next/API, entradas inválidas, permisos, aislamiento, contraseñas, revocación, versiones obsoletas, dos bajas simultáneas, paginación y persistencia tras reiniciar la API. Reinstala, recupera código, reinicia MySQL y restaura un respaldo en otra base comparando datos, índices y relaciones.

Las cuentas y datos ficticios de pruebas se crean solo en CI. La revisión local de interfaz con datos simulados no acredita persistencia MySQL.

Aceptación en la HP:

1. Instalar y comprobar `database: ok, schemaVersion: 3`.
2. Ingresar con la cuenta existente y abrir Configuración.
3. Guardar datos reales de empresa, recargarlos y comprobarlos.
4. Crear/editar una sucursal de la operación y comprobar persistencia.
5. Crear una cuenta autorizada de Consulta; cambiar su contraseña inicial y verificar que solo consulte sus sucursales.
6. Cerrar sesión y comprobar el rechazo de acceso sin sesión.

Después sigue 1B: logos, colores y consulta de auditoría. Pendientes: recuperación administrativa de contraseñas, correo transaccional, MFA, roles personalizados, respaldo externo, retención y pruebas de volumen. Cotizaciones, GPS y SUNAT mantienen sus fases.

Referencias: [bloqueos de MySQL 8.4](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html), [Route Handlers de Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/route).

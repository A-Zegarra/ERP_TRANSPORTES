# Identidad visual y auditoría — 1B

Base aceptada: 1A.3 c0c5a56dc2ae876918ab7758617c0de81568b5b6. El usuario confirmó instalación, schemaVersion: 3 y funcionamiento de configuración. Esta entrega 1B requiere instalación y aceptación propias en la HP.

## Funciones

Configuración incorpora Identidad visual y Auditoría. El administrador puede guardar nombre visible, lema, colores principal/acento y espaciado cómodo/compacto de tablas. Los colores deben alcanzar contraste 4,5:1 con texto blanco. El nombre y lema se muestran en navegación, ingreso y pie; el acento identifica el detalle de auditoría. Los datos fiscales permanecen en Empresa. El perfil Consulta solo lee la identidad.

La identidad es pública antes del login, por lo que no debe contener información reservada. El endpoint público expone solo campos visuales y la referencia del logo; nunca RUC, usuarios, sucursales ni sesiones. La instalación actual publica una empresa por dominio, identificada por el alta inicial; no hay selector multiempresa.

Logo: PNG, JPEG o WebP estático, hasta 1 MiB y 4096 × 4096 píxeles. Se verifica la firma, se decodifica con límite de píxeles y una conversión simultánea, se elimina metadata y se convierte a WebP de hasta 512 × 512 y 256 KiB. No admite SVG ni animaciones. Guardar y quitar logo son acciones separadas de guardar colores/texto. Cada escritura verifica permisos, sesión y versión dentro de la transacción. La excepción al límite JSON de 4 KiB solo aplica al endpoint exacto de carga (1400 KiB).

Auditoría muestra actor, fecha, acción y entidad. Filtros por fecha y acción, hasta 90 días, páginas de 20 y cursor compuesto fecha/ID; índices por empresa/fecha/ID y empresa/acción/fecha/ID. El detalle se obtiene aparte, acotado a la empresa de la sesión. Los nuevos cambios administrativos incluyen valores anteriores/posteriores seleccionados explícitamente; no se serializan entradas con contraseñas, hashes o tokens. Los eventos antiguos y de acceso pueden carecer de esos valores. En un intento de login fallido, la cuenta asociada identifica el destino del intento y no demuestra quién lo realizó.

No existen rutas para editar o eliminar auditoría. Esto no equivale a un registro inviolable frente a un administrador de MySQL: la cuenta técnica conserva sus permisos DML de la fase anterior. Retención, exportación y protección externa se definirán según volumen y obligaciones reales.

## Persistencia y respaldo

Cuarta migración aditiva: company_branding y columnas opcionales de detalle en audit_events; nuevos permisos branding.write y audit.read para administradores. Mantiene cuentas y contraseñas existentes. Son 14 tablas de aplicación y la tabla técnica de Prisma. Readiness devuelve schemaVersion: 4.

Los logos se guardan en shared/logos/EMPRESA/HUELLA.webp, con directorios 700 y archivos 600, fuera de releases. No se usa el nombre suministrado por el navegador. La publicación del archivo es atómica y su huella se verifica al leer. Los objetos antiguos se conservan para respaldos; límite de 512 versiones por empresa. No hay borrado automático ni almacenamiento de adjuntos generales.

Cada respaldo nuevo produce el SQL comprimido, su suma SHA-256, un archivo compañero .logos.tar.gz con su suma y un manifiesto .backup.json. Se copia después del snapshot SQL; como los logos son inmutables y no se eliminan, los archivos referenciados permanecen disponibles durante la copia. El manifiesto solo se publica cuando ambos componentes terminaron. Para una recuperación conservar el conjunto completo, restaurar SQL en una base controlada y recuperar logos en el directorio compartido con sus permisos y huellas. No mezclar el SQL de una fecha con archivos de otra.

Estos son respaldos locales de instalación, no copias externas ni una política de retención. El disco y el respaldo externo siguen pendientes de operación.

## Actualización y aceptación en HP

Ejecutar el instalador del commit fijo entregado con --local-only desde la sesión SSH de la HP en Termux. El instalador respalda, migra y comprueba los procesos propios. La entrada Cloudflare ya existente sigue sirviendo el mismo dominio. No recrear el administrador.

1. Confirmar readiness database: ok, schemaVersion: 4.
2. Ingresar y abrir Configuración → Identidad visual.
3. Guardar nombre, lema, colores y espaciado; recargar y comprobar persistencia.
4. Seleccionar el logo real, revisar la vista previa y pulsar Guardar logo; comprobar navegación e ingreso.
5. Abrir Auditoría y Ver cambios: verificar actor, fecha, antes y después. Probar filtros.
6. Confirmar que Consulta no puede modificar identidad ni ver auditoría.

La recuperación de código a 1A.3 mantiene tablas y archivos pero deja de aplicar la personalización y de registrar detalles nuevos hasta reactivar 1B. No revierte datos automáticamente.

## Validación

La comprobación local cubre lint, tipos, esquema, compilación y humo. Las pruebas de archivos comprueban formato, límites y respaldo, incluyendo rechazo de corrupción y enlaces. CI usa MySQL 8.4 desechable, instala 1A.3 con administrador existente, actualiza a 1B, prueba permisos/API/Next, logo mayor de 4 KiB, versiones obsoletas, reinicio de API, aislamiento de auditoría, paginación con fechas iguales, reinstalación, reversión de código y restauración SQL/archivos. La revisión visual usa datos simulados; no sustituye las pruebas MySQL ni la aceptación en la HP. Consultar el resultado de Actions del commit que se instale.

Siguiente fase: datos maestros (clientes, proveedores, conductores, vehículos y catálogos). Cotizaciones, viajes, llantas, GPS y SUNAT se incorporan después según el plan maestro.

Referencias técnicas: [límites de decodificación en Sharp](https://sharp.pixelplumbing.com/api-constructor/) y [validación de archivos de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

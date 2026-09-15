# Acceso — entrega 1A.2

Punto de partida: 1A.1 confirmada en la HP en el commit `92b261bbd7cadc58037b26ecce3bbe3b3c921c8d`. La nueva entrega requiere dos tablas aditivas: `auth_throttles` y `system_bootstrap`. Hay 13 tablas de aplicación y la tabla técnica de Prisma; readiness devuelve `schemaVersion: 2`. Las credenciales MySQL, base y datos previos se conservan.

## Funcionalidad

- `/login`: ingreso mediante correo y contraseña.
- `/mi-cuenta`: datos de la sesión, empresa y sucursales autorizadas; requiere sesión real.
- Cierre de sesión: revoca el registro en MySQL y elimina la cookie.
- Alta inicial por terminal: empresa, sucursal Tacna, usuario, membresía, rol administrador y permisos existentes; una transacción completa.
- API `GET /api/v1/organization/company`: exige `company.read` y obtiene la empresa desde la sesión.

Los módulos operativos siguen mostrando su alcance público; todavía no contienen datos de negocio. No existe registro público de administradores. La edición de empresa, sucursales y usuarios se desarrolla en 1A.3.

## Primer administrador

El comando de entrega instala la release validada y ejecuta:

```bash
python3 "$HOME/apps/larams-erp/current/scripts/hp-administrador.py"
```

Se ejecuta como `alvaro` en su sesión SSH. Solicita empresa, nombre, correo y contraseña de 15 a 128 caracteres, repetida sin eco. La entrada se lee de la terminal, incluso si el instalador se lanzó mediante un bloque Bash. La contraseña pasa a Node por un pipe, nunca como argumento, variable de entorno o archivo temporal.

Solo se realiza el alta en una instalación vacía e identificada. El bloqueo de instalación evita dos comandos concurrentes; un registro único en MySQL protege la operación. Repetirlo detecta el alta y conserva la contraseña. No se adopta un usuario anterior ni se genera una contraseña predeterminada. Después del alta se crea una copia local de la base. Si falla esa copia, el administrador creado se conserva y se informa el pendiente.

## Sesiones y autorización

NestJS es la única autoridad de sesión. Next permite únicamente login, me y logout en su intermediario HTTP; nunca reenvía rutas arbitrarias. Se conserva la dirección interna 3101 y el túnel Cloudflare actual. Los endpoints de negocio se agregan por permiso explícito; un controlador sin política se rechaza por defecto.

Tokens aleatorios de 256 bits, guardados como SHA-256; el token original solo viaja en una cookie `__Host-larams_session`, Secure, HttpOnly, SameSite=Lax, Path=/ y sin Domain. Vencimiento absoluto de ocho horas. No se guarda el token en localStorage ni se devuelve en JSON. Cada petición comprueba vencimiento, revocación, usuario/membresía/empresa activos y permisos actuales. Se comprueba también la empresa de las relaciones con las claves compuestas de 1A.1.

El navegador usa HTTPS. Solo en desarrollo de loopback se utiliza la cookie distinta `larams_dev_session`; `LARAMS_ORIGIN` debe ser un origen exacto y coincidir entre web/API. El valor de producción predeterminado es `https://larams.aliproinv.com`. No se confía en Host ni X-Forwarded-Host para autorizar escrituras.

Las escrituras requieren JSON, Origin exacto y la cabecera `X-Larams-Intent: 1`; se rechaza Sec-Fetch-Site cross-site. Se verifica tanto en Next como en Nest, incluido el login. La cookie por host evita que otro subdominio de Ali establezca esta sesión. No se habilita CORS abierto.

La contraseña usa scrypt de Node, sal aleatoria de 16 bytes y N=32768, r=8, p=3. Se ejecuta la derivación también para correos inexistentes y la respuesta de credenciales incorrectas es genérica. Esta combinación está entre las alternativas documentadas por [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html); los controles HTTP siguen [sus recomendaciones para APIs y CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## Recursos y trazabilidad

Máximo ocho intentos por correo en una ventana de 15 minutos, persistidos mediante incremento atómico en MySQL; se incluyen intentos correctos y fallidos. El límite sobrevive al reinicio de la API. En este proceso único se admite un máximo de dos verificaciones simultáneas y 60 intentos/minuto en total. Respuestas 429 indican reintento posterior. Antes de multiplicar instancias se debe distribuir el límite global y ajustar el presupuesto de CPU/conexiones.

La clave del contador es un resumen del correo, no el correo en texto. Los contadores vencidos hace más de un día se retiran en lotes de hasta 100 durante el ingreso. Los cuerpos HTTP se limitan a 4 KiB en ambas capas y los errores de base no se envían al cliente.

Se registran alta, ingreso correcto, fallos de cuentas reconocidas y cierre de sesión, sin contraseñas ni tokens. La consulta de auditoría y los eventos de administración de permisos llegan con sus respectivas pantallas. No se afirma que este historial sea inmutable frente al administrador de la base.

## Comprobación y límites

CI prueba MySQL 8.4 real, migración desde 1A.1 con datos, alta interactiva por TTY sin eco, conservación de contraseña, hash con sal, acceso mediante Next/Nest, cookies, CSRF, límites de entrada/intentos, cierre, vencimiento, revocación, desactivación y retirada de permisos. Prueba recuperación de código a 1A.1 y reactivación de 1A.2 conservando los datos; también restaura un respaldo en una base separada.

La recuperación de código no deshace las tablas. Volver a 1A.1 retira el login de la web, pero conserva los usuarios y sesiones para una recuperación posterior. No ejecutar reset ni importar SQL sobre la base activa.

Quedan pendientes: alta/edición de más usuarios, selector de empresa (el ingreso elige la primera membresía activa), cambio/recuperación de contraseña, MFA, límite por IP, política de retención de sesiones/auditoría, respaldo externo y pruebas de carga. El navegador y el reinicio real de la HP requieren aceptación en ese equipo antes de incorporar información operativa.

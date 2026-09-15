# MySQL — entrega 1A.1

Referencia de la entrega instalada y confirmada el 14 de septiembre. La ampliación de acceso, dos tablas adicionales y readiness versión 2 se documentan en [1A.2](ACCESO-1A2.md).

Esta entrega prepara persistencia; no habilita login ni formularios de negocio. No importa datos heredados ni crea empresas, usuarios de acceso o ejemplos. La instalación de la HP se acredita únicamente después de recibir su resultado.

## Recursos propios

| Recurso | Configuración |
|---|---|
| Servidor | MySQL 8.4 existente, conexión local; no se reinicia ni se actualiza |
| Base | `larams_erp`, InnoDB, utf8mb4 |
| Aplicación | `larams_app@127.0.0.1`: SELECT, INSERT, UPDATE, DELETE solo en esa base |
| Migraciones | `larams_migrate@127.0.0.1`: permisos anteriores y CREATE, ALTER, INDEX, REFERENCES |
| Pool API | 5 conexiones; máximo configurable 10; límite de cuenta 12 |
| Credenciales | `shared/api.env`, `shared/migrate.env` y estado de instalación, permisos 600 |
| Respaldos | `shared/backups/*.sql.gz` con SHA-256, antes y después de migrar |

Los permisos concedidos no incluyen DROP, administración global ni acceso a otras bases. ALTER sigue siendo un permiso potente: los cambios futuros se revisan y versionan. No se reutiliza la cuenta root para la API. La marca de propiedad en las cuentas y el UUID del servidor se contrastan con el estado privado local. Un conflicto de nombres o de configuración detiene el proceso.

La vía normal de administración es `sudo mysql --protocol=socket --user=root`, después de autenticar sudo en la terminal. Si el servidor no admite esa vía, el instalador se detiene sin restablecer contraseñas. Se admite un archivo propio de opciones MySQL mediante `LARAMS_MYSQL_ADMIN_FILE`, con permisos 600; no pegar su contenido en el chat.

## Esquema y comprobaciones

11 tablas: empresas, sucursales, usuarios, membresías, roles, permisos, permisos por rol, roles por membresía, sucursales autorizadas, sesiones y auditoría. Prisma añade `_prisma_migrations` para el historial técnico. UUID para identidad; BIGINT para historial de auditoría; índices compuestos por empresa y filtros previstos. Las tablas de acceso son infraestructura para 1A.2: no hay autenticación ni autorización operativa todavía.

`/api/v1/health` y el endpoint web mantienen el contrato `phase: 0` de salud del proceso para compatibilidad. No certifican MySQL. `/api/v1/ready` devuelve 200 con `database: "ok", schemaVersion: 1` después de consultar una tabla migrada; devuelve 503 genérico si no puede hacerlo. La activación comprueba ambos endpoints y la preparación de las 11 tablas antes de marcar la release activa. El hito instalado se registra en `shared/installation.json` como 1A.1.

La API continúa en loopback. El endpoint de preparación de base no se publica a través de Next. Las conexiones SQL y los errores del controlador no se envían al navegador.

## Actualización y recuperación

El comando de la entrega descarga un commit completo validado. Para la HP que ya tiene Cloudflare funcionando se usa `--local-only`: evita reconfigurar el túnel y sí prepara MySQL cuando lo exige el manifiesto de la release.

El instalador compila antes de pedir acceso administrativo. Crea únicamente los recursos identificados de LARAMS, respalda, aplica `prisma migrate deploy`, verifica tablas y conexión, respalda otra vez y activa los procesos del ERP. Repetirlo conserva credenciales y datos; Prisma no repite una migración terminada.

Si falla la migración, no activa el código nuevo. Un DDL de MySQL no se revierte como una transacción común: una migración parcial se investiga y se corrige; nunca se ejecuta reset automáticamente. Si falla el arranque, recupera el código anterior. La migración inicial es compatible con fase 0, que no accede a estas tablas. La recuperación de código no elimina ni restaura datos.

Para un respaldo manual, sin otra actualización en curso:

```bash
flock -n "$HOME/apps/larams-erp/shared/install.lock" \
  python3 "$HOME/apps/larams-erp/current/scripts/hp_mysql.py" backup \
  --root "$HOME/apps/larams-erp"
```

El respaldo usa una transacción consistente de tablas InnoDB y compresión con memoria acotada. No contiene usuarios MySQL ni sus credenciales, ni triggers, procedimientos o eventos (esta fase no los crea). Si se introducen en otra fase, debe ampliarse el respaldo antes de desplegarlos. Se conservan las copias; aún no hay programación, retención automática ni envío fuera de la HP. Un respaldo en el mismo disco no protege contra su pérdida.

CI restaura la copia en una base vacía separada y compara datos, índices y relaciones con el esquema. No importar un respaldo sobre la base activa: antes se debe identificar el punto de recuperación, ensayar en una base separada y planificar el corte. El ensayo en la HP, respaldo externo y recuperación tras reiniciar la HP siguen pendientes antes de operar con información real.

## Validación

`pnpm check`, `pnpm build` y `pnpm test:smoke` no requieren MySQL. La prueba HTTP confirma 503 de readiness sin configuración y ausencia de operaciones de negocio abiertas.

CI ejecuta `tests/ci_mysql.py` sobre un contenedor MySQL 8.4 exclusivo en 33306 y PM2 aislado. Instala el commit de fase 0 usado por la HP, actualiza a esta entrega y la repite; comprueba colisiones, permisos, transacciones, relaciones entre empresas, conservación de credenciales/datos, reconexión tras reiniciar MySQL y restauración. El script exige entorno CI desechable; no ejecutarlo en la HP.

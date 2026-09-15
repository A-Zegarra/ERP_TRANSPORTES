# Arquitectura propuesta y base implementada

## Decisión

Monorepositorio pnpm con frontend Next.js y backend NestJS en Node.js. Un único backend organizado por dominios; trabajadores y adaptadores se despliegan aparte cuando su fase lo requiere. MySQL conserva las operaciones relacionales.

| Componente | Responsabilidad | Situación en 1A.2 |
|---|---|---|
| `apps/web` | Pantallas Next.js/React, navegación, Tailwind | Implementado como base navegable |
| `apps/api` | API REST, reglas de negocio, permisos, acceso a MySQL | Salud, MySQL, sesiones y autorización; módulos operativos pendientes |
| `prisma` | Esquema y migraciones MySQL | Cliente, adaptador MySQL y dos migraciones, 13 tablas de aplicación |
| Trabajador Node/BullMQ | Importar, exportar, emitir, reintentar | Introducir con el primer proceso duradero |
| Redis | Cola y caché selectiva | No se instala en la fase 0 |
| Almacenamiento de archivos | Adjuntos, evidencias, PDFs, XML/CDR | Pendiente; rutas fuera de los directorios de release |
| Adaptador de telemetría | API de Traccar/proveedor o ingestión autorizada | Fase 9 |

Prisma CLI, cliente y adaptador MariaDB (compatible con MySQL) comparten la versión 7.10.0. Pool inicial de cinco conexiones, servicio único NestJS y configuración privada fuera de las releases. Las claves compuestas impiden asignar sucursales, roles, sesiones o actores de auditoría a una membresía de otra empresa. La autorización global de 1A.2 y las consultas derivadas de la sesión completan ese control para las rutas implementadas.

## Fronteras de responsabilidad

- La API será propietaria de permisos, reglas, transacciones y consultas. Next no hará escrituras paralelas a MySQL que eviten esas comprobaciones.
- En la fase 1 el acceso web se resolverá bajo un mismo origen (proxy o capa BFF) y sesiones/cookies seguras. La API verificará identidad y autorización en cada operación; el menú no es un control de acceso.
- Una única autoridad de autenticación. No crear sesiones independientes en Next y Nest que puedan contradecirse.
- Permisos por área/acción y alcance de sucursal/empresa, con denegación por defecto. Los jobs llevan el contexto autorizado y sus entradas se validan.
- Controladores delgados, servicios por dominio, repositorios/consultas y contratos OpenAPI. TypeScript estricto no sustituye la validación de entrada en ejecución.
- Compartir contratos públicos sin importar código de servidor, clientes de base o secretos al bundle del navegador.

## Entidades previstas

| Dominio | Entidades y separación relevante |
|---|---|
| Organización | Empresa, sucursal, usuario, sesión, rol, permiso, asignación, auditoría, configuración |
| Maestros | Persona/empresa, documento por país, cliente, proveedor, contacto, moneda, unidad, carga, servicio |
| Personas | Colaborador, conductor, licencia, contrato, asistencia; identidad laboral separada del login |
| Comercial | Cotización, versión aprobada, líneas, costos, tarifa con vigencia, tipo de cambio aplicado |
| Operaciones | Orden de servicio, carga/envío, viaje, tramo, parada, asignación, gasto, incidente, entrega |
| Flota | Vehículo, remolque, equipo refrigerante, eje, posición, componente, inspección, instalación histórica |
| Taller/almacén | Orden de trabajo, tarea, repuesto, requisición, compra, recepción, movimiento, reserva, consumo |
| Finanzas | Cuenta, movimiento, pago, aplicación de pago, liquidación, comprobante, intento de envío, respuesta |
| GPS | Dispositivo, vinculación temporal, posición, evento, geocerca, estimación de llegada, lectura de sensor |

Entidades planificadas, no tablas declaradas como existentes. Las relaciones se implementan y validan por fase.

## Datos y concurrencia

- País ISO, moneda ISO, unidades explícitas y zonas horarias IANA. Instantes en UTC; conservar zona local cuando tenga significado operativo. Considerar cambios de horario en Chile.
- Dinero/medidas precisas con `DECIMAL` y aritmética decimal en aplicación. En la API transmitir cantidades exactas de forma explícita; no redondear dinero con operaciones binarias de `number` sin una política.
- Identificadores y referencias estables. Para telemetría de alto volumen evaluar claves secuenciales/BIGINT o equivalentes según tamaño real; no imponer un tipo de ID por estética.
- Claves foráneas y unicidad; índices compuestos que respondan a consultas reales. No poner `company_id` en todo sin implementar filtros y restricciones contra cruces de empresa.
- Listados limitados y filtros en servidor; cursor estable para historiales grandes y paginación convencional acotada donde resulte útil. No cargar millones de filas en el navegador.
- Transacciones cortas; bloqueo o control de versión donde exista competencia por stock, saldo o asignación. Un SELECT previo no garantiza exclusividad bajo concurrencia.
- Idempotencia con clave única para comandos repetibles (pago, emisión, recepción). Reintentos acotados de bloqueos/interbloqueos y un estado verificable del resultado.
- Anulaciones/reversiones e historial para operaciones confirmadas. Borrado en cascada solo en relaciones donde sea semánticamente correcto; proteger historia financiera y operativa.
- Una cotización aprobada y los datos que originaron un comprobante conservan su versión; cambios futuros de clientes/tarifas no reescriben el pasado.

## Consultas pesadas y procesos duraderos

Prioridad: medir, limitar lo consultado, corregir índices y SQL, agregar/resumir datos y después escalar infraestructura. Prisma no sustituye comprender el plan SQL; SQL parametrizado es válido para reportes complejos.

Procedimientos almacenados solo cuando una operación concreta los justifique y exista una mejora medida. Deben versionarse, probarse y tener una política explícita de transacciones. Envolver una consulta lenta en un procedimiento no la vuelve rápida.

Para trabajos externos: registro durable en MySQL y patrón outbox al introducir la cola; publicación/reintento idempotente. Evitar el caso “se guardó el pago pero no se publicó el trabajo” o “se envió dos veces el comprobante”. La cola no debe ser el único registro contable de una operación.

Exportaciones e importaciones por lotes/streaming, límites de recursos y progreso visible. Generación de documentos, reintentos SUNAT y telemetría no deben bloquear las peticiones normales.

## GPS y capacidad

- Ingestión separada del dibujo del mapa. Credenciales por dispositivo/integración y permisos por vehículo/conductor.
- Registrar fecha del dispositivo y fecha de recepción; rechazar/aislar valores inválidos; deduplicar eventos; mensajes atrasados no reemplazan una posición más reciente.
- Índices por dispositivo y tiempo, consultas por ventanas y simplificación de trazas. Tabla de posición reciente pequeña; historial con política de retención.
- SSE/WebSocket con autenticación cuando proceda; frecuencia de emisión al navegador independiente de la frecuencia de ingestión.
- MySQL inicial con pool acotado. El total de conexiones incluye instancias API y trabajadores. Aumentar réplicas de Node sin presupuesto de conexiones puede saturar MySQL.
- No introducir particiones, réplicas o microservicios antes de medir. El servidor/adaptador GPS sí puede necesitar otra ubicación por entrada TCP/UDP y recursos.

## Operación

- HP: dos procesos ligeros al comienzo (web y API), con puertos de loopback y nombres propios. MySQL de proyecto con usuario limitado cuando se implemente la fase 1.
- Acceso público del ERP por subdominio HTTPS a través del Cloudflare Tunnel existente, según decisión del usuario. Las direcciones de loopback se conservan como destinos internos del túnel/proxy; no requieren apertura de puertos en el router. Ver `CLOUDFLARE.md`.
- Presupuesto de RAM/CPU/IO según diagnóstico; evitar compilaciones de todas las aplicaciones a la vez. El CI conserva el frontend standalone como apoyo para compilar fuera de la HP.
- No se incluyen Traccar, Redis, motor de rutas ni clústeres en la fase inicial; son introducciones por necesidad.
- Logs estructurados con ID de petición y sin credenciales; errores, latencias y uso de recursos medidos desde las fases operativas.
- Respaldos de MySQL y archivos fuera del equipo, restauración probada y objetivos RPO/RTO acordados. Las copias en el mismo disco no resuelven su pérdida.
- Preparar migración a infraestructura con SSD/NVMe y mayor disponibilidad cuando las métricas del piloto lo exijan. Capacidad y disponibilidad se validan por separado.

## Puertas de calidad

Fase 0: tipos, lint, esquema, build, salud, navegación y ausencia de rutas de negocio abiertas.

Desde fase 1: pruebas de permisos/aislamiento y migración desde una base vacía y una versión anterior. Antes de finanzas: concurrencia e idempotencia. Antes del piloto: restauración, carga representativa y fallos de servicios externos.

Ejemplo de prueba a concretar: un millón de movimientos y escenarios escalonados de usuarios simultáneos. Fijar objetivos de latencia p95, tasa de errores, cola pendiente y consumo de recursos antes de medir; no convertir ese ejemplo en una promesa de capacidad.

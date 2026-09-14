# Plan maestro — LARAM’S CARGO INTERNACIONAL

Estado inicial: fase 0 en validación. Fecha: 14 de septiembre de 2026.

## Objetivo

Controlar el ciclo comercial y operativo del transporte terrestre con base en Tacna, Perú, y rutas hacia Chile y otros países cercanos. Conectar cotizaciones, viajes, flota, mantenimiento, almacenes, personas, finanzas y seguimiento. La información de cada servicio debe permitir explicar su costo, resultado, documentos y responsables.

Next.js es una decisión confirmada por el usuario. MySQL será la base relacional. La HP será el entorno inicial de desarrollo/piloto y se actualizará desde sesiones SSH iniciadas en Termux. No se presume que la capacidad actual de esa HP sea suficiente para la carga futura.

## Cómo controlar el avance

- Una fase activa, dividida en entregas pequeñas que se puedan comprobar.
- Estados: planificada → en desarrollo → en validación → cerrada.
- Cada entrega: rama, PR, CI, revisión del resultado, comando de actualización identificado por commit, comprobación en HP y actualización de `ESTADO.md`.
- Cerrar una fase exige cumplir su criterio funcional; una pantalla o un endpoint aislado no equivalen a un módulo terminado.
- Seguridad, aislamiento de datos, índices, transacciones, respaldo y observabilidad se incorporan durante el desarrollo; la fase 10 los valida con carga y contingencias.
- No asignar porcentajes arbitrarios de avance ni fechas contractuales antes de concretar el alcance con cada área.

## Fases y criterios de cierre

| Fase | Alcance | Resultado que se debe demostrar | Dependencias |
|---|---|---|---|
| 0. Base técnica | Next.js, TypeScript, Tailwind, API NestJS, diseño inicial MySQL, CI, documentación y diagnóstico HP | Compilar y navegar; salud de ambos procesos; ruta/puertos aislados y arranque comprobado en HP | Ninguna |
| 1. Empresa y acceso | Empresa/sucursal, usuarios, sesiones, permisos por área/acción, auditoría, logos, colores y parámetros | Un usuario autorizado modifica configuración persistente; uno sin permiso recibe rechazo en API; restauración de respaldo inicial comprobada | 0 |
| 2. Datos maestros | Clientes, proveedores, contactos, documentos, países, monedas, servicios, carga, conductores, vehículos y remolques | Registrar y consultar datos paginados; impedir duplicados según país/tipo/documento; relacionar unidades y conductores | 1 |
| 3. Cotizaciones | Rutas y tramos, distancias, carga seca/refrigerada, toneladas/volumen/unidades, costos, monedas, versiones y PDF | Presupuestar un caso Tacna–Chile, comprobar unidades, costos y margen; aprobar una versión inmutable | 2 |
| 4. Operaciones | Orden de servicio, planificación, viajes, cargas, recursos, tramos, fronteras, gastos y evidencias | Convertir cotización aprobada en orden/viaje; prevenir conflictos de asignación; cerrar entrega y comparar presupuesto con ejecución | 3 |
| 5. Compras y almacén | Requisiciones, proveedores, órdenes de compra, recepción, repuestos, insumos, kardex, transferencias y devoluciones | Compra → recepción → movimiento → consumo/reserva; conservar trazabilidad y coherencia bajo operaciones concurrentes | 2, 4 |
| 6. Taller y condición de flota | Órdenes de trabajo, servicios externos, mano de obra, repuestos, mantenimientos, llantas y refrigeración | Inspeccionar una unidad, mover/rotar una llanta sin perder historia, consumir repuestos y cerrar mantenimiento con costo | 4, 5 |
| 7. Recursos humanos | Áreas, puestos, legajos, contratos, asistencia, permisos, vacaciones y vencimientos | Acceso restringido a datos personales; historial por colaborador; alertas de documentos/contratos | 1, 2, 4 |
| 8. Finanzas y SUNAT | Caja, cuentas por cobrar/pagar, liquidaciones, facturación, notas, documentos electrónicos y respuestas | Conciliar un servicio y sus pagos; validar emisión y errores en entorno de pruebas; impedir duplicación por reintentos | 3, 4, 5 |
| 9. GPS y cadena de frío | Adaptadores GPS, mapa, permisos, posición reciente, historial, geocercas, ETA y sensores compatibles | Probar un dispositivo real y una ruta: sin señal, mensajes tardíos/duplicados, reconexión, alertas y acceso restringido | 1, 2, 4; inventario de dispositivos |
| 10. Reportes, escala y piloto | Rentabilidad, costos/km, indicadores, carga, retención, recuperación, operación y capacitación | Prueba representativa con umbrales acordados; restaurar datos; pilotear el ciclo completo y documentar límites | Fases operativas aceptadas |

Fase 8 se divide en 8A finanzas y 8B emisión electrónica. Puede adelantarse 8A/8B después de operaciones y compras si el negocio necesita facturar antes de concluir RR. HH. El orden técnico se mantiene mediante las dependencias, sin abrir todas las fases a la vez.

## Detalle funcional que no debe perderse

### Comercial, carga y viajes

- Tipo de servicio: transporte, refrigerado, otros servicios; parametrizable, sin confundirlo con tipo de carga o modalidad de cobro.
- Carga: descripción/producto, bultos, peso neto/bruto/tara cuando corresponda, volumen, unidades y restricciones. Unidades explícitas: kg, t, m³, km, litros, galones y horas; no mezclar números sin unidad.
- Tarifa por viaje, tonelada, volumen, bulto/unidad u otra base acordada. Carga completa o consolidada; modelar orden/carga y viaje como relaciones que admitan varios envíos por viaje y varios tramos por envío.
- Ruta como plantilla de recorrido; viaje como ejecución concreta. Los cambios de una ruta no alteran el historial del viaje cerrado.
- Origen, destino, paradas, pasos fronterizos, distancia prevista/real, horarios previstos/reales, responsable y evidencia.
- Costos: combustible, peajes, viáticos, hospedaje, maniobras, terceros, espera, refrigeración, mantenimiento imputado y otros conceptos configurables. Registrar qué valores son presupuestados, reales o estimados.
- Moneda por movimiento (PEN, CLP, USD u otras), importe decimal, tasa aplicada, fecha y fuente. No sumar monedas distintas antes de convertirlas con una regla explícita.
- Diferenciar margen sobre venta y recargo sobre costo. Establecer reglas de impuestos con el responsable contable.
- Refrigeración: unidad/equipo, rango solicitado, consigna, controles manuales, horas de funcionamiento y temperatura medida. Tener Thermo King u otra unidad no implica contar con telemetría accesible: la fase 9 depende de sensores e interfaces disponibles.

### Taller, llantas y accesorios

- La unidad tractora, el semirremolque/remolque y la unidad refrigerante tienen identificadores e historial propios.
- Diagrama configurable por ejes, lado, posición interna/externa, gemelas y repuesto. No dibujar todos los vehículos con una configuración fija.
- Cada llanta tiene serie/identificación, marca/modelo, medida, adquisición, montaje, desmontaje, rotaciones, reparaciones y recapados.
- Inspecciones: fecha, odómetro, profundidad de surco medida, presión, fotos, daños, responsable y método. Conservar mediciones originales.
- Porcentaje de vida útil del dibujo: estimación derivada de profundidad inicial, profundidad actual y límite de retiro configurado con el responsable técnico. Si falta una medición o el límite, mostrar “sin evaluación”. No usar un límite universal inventado.
- Desgaste del dibujo, daño y aptitud de uso son conceptos distintos. Una llanta con dibujo restante puede tener un daño que requiera inspección inmediata. El software no certifica seguridad mecánica.
- Relacionar kilómetros, peso transportado, presión y tipo de ruta para analizar costo/km y tendencias. Peso y distancia por sí solos no miden desgaste ni daño real; los modelos predictivos se incorporarán solo con datos y validación.
- Otros componentes usan sus unidades: horas de equipo, ciclos, kilómetros o fecha. Reparaciones, costos y consumos deben quedar asociados a la orden de trabajo.

### Organización, almacén y servicios

- Clientes/proveedores pueden ser personas o empresas, con documentos según país; datos bancarios y personales requieren permisos específicos.
- Un colaborador no es necesariamente un usuario del sistema; un conductor es un rol laboral, independiente de los permisos informáticos.
- Servicios mecánicos internos y de terceros, órdenes de trabajo, mano de obra e insumos. Otros servicios reutilizan el catálogo, costos y facturación.
- Compras/almacén: unidades de compra/consumo, conversiones, ubicaciones, stock disponible/reservado, lotes o series donde aplique. Método de valorización acordado con administración; no reemplazar saldos sin registrar movimientos.
- Planillas y cálculos laborales completos requieren un alcance específico por país y revisión especializada; no se consideran terminados con asistencia y contratos.

### Configuración y comprobantes

- Pestaña propia de configuración: razón social, nombre comercial, sucursales, domicilio, logos, colores, plantillas, monedas, zonas horarias, numeración y permisos.
- Identidad visual por variables/tokens; validar legibilidad de colores. Logos almacenados como archivos privados/gestionados según su uso, no incrustar secretos ni permitir HTML/CSS ejecutable arbitrario.
- Integración SUNAT mediante adaptador independiente: modalidad de emisión elegida, certificado/credenciales fuera de Git, series y ambientes separados.
- Facturas/boletas de servicios y notas según alcance, XML/PDF/CDR cuando corresponda, estados y reintentos idempotentes. Ninguna emisión real se dispara en la fase inicial.
- Transporte internacional no implica automáticamente una categoría tributaria. Documentos, impuestos y supuestos se validan con el contador y especificaciones vigentes. Guías del transportista y documentación aduanera/internacional se relevan como entregables propios antes de prometer cobertura.

### Seguimiento y escalabilidad

- Dos fuentes: seguimiento autorizado desde el dispositivo del conductor y GPS instalado. Vincular dispositivo/vehículo/conductor con vigencia temporal.
- Una pestaña web puede suspenderse en segundo plano. El seguimiento continuo exige comprobar un cliente móvil apropiado o equipo GPS dedicado, conectividad/SIM y permisos.
- Mostrar siempre hora de la última posición, precisión si existe y estado de conexión. El ETA es una estimación que contempla ruta, restricciones conocidas, paradas y fronteras; no prometer una hora exacta.
- MapLibre como candidato de mapa y Traccar como candidato de servidor/adaptador GPS; confirmar protocolo y comandos por dispositivo. No modificar directamente la base interna de Traccar: usar su API.
- El mapa, el enrutamiento/ETA y la recepción GPS son servicios distintos. Datos OSM libres no equivalen a servicios de teselas o rutas ilimitados y gratuitos.
- Los GPS con protocolos TCP/UDP necesitan entrada de red compatible. El túnel HTTP del sitio no resuelve automáticamente la conexión de esos equipos; decidir ingreso público/adaptador en la fase 9.
- Retener posiciones crudas por un plazo acordado, resumir recorridos y separar historial de ubicación reciente. Ejemplo de dimensionamiento: 100 unidades enviando cada 30 segundos producen 288 000 posiciones por día si transmiten continuamente; es un escenario de diseño, no una medición de la empresa.

## Límites de esta entrega

Se entrega la base y el plan, no la totalidad del ERP. El cierre de fase 0 requiere evidencia de instalación en HP. No se ha accedido a datos de producción ni se han emitido comprobantes, configurado rastreadores o modificado dominios.

## Referencias técnicas consultadas

- Next.js: https://nextjs.org/docs/app/getting-started/installation
- Alojamiento propio: https://nextjs.org/docs/app/guides/self-hosting
- Traccar arquitectura e interfaces: https://www.traccar.org/architecture/
- Compatibilidad de GPS: https://www.traccar.org/devices/
- Política de teselas OSM: https://operations.osmfoundation.org/policies/tiles/
- Geolocalización web: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- Protocolos publicados con Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/protocols/
- SUNAT, SEE del contribuyente: https://cpe.sunat.gob.pe/sistema_emision/see_contribuyente

Son referencias de diseño revisadas en esta entrega. Antes de integrar SUNAT/GPS se contrastarán las especificaciones vigentes y la compatibilidad real.

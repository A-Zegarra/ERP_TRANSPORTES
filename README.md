# LARAM’S CARGO INTERNACIONAL — ERP

ERP para transporte terrestre desde Tacna, Perú, con operaciones internacionales hacia Chile y otros países. Desarrollo progresivo con Next.js, TypeScript, Tailwind, Node/NestJS y MySQL.

## Estado verificable

**Fase 0: base técnica implementada, pendiente de cierre en la HP.**

- `apps/web`: Next.js App Router, Tailwind y navegación adaptable. Inicio, alcance de módulos, configuración prevista, plan de fases y endpoint de salud.
- `apps/api`: NestJS modular, conectado únicamente a un endpoint de salud del proceso; escucha en loopback.
- `prisma`: esquema inicial de diseño para MySQL. No hay migraciones ni conexión operativa todavía.
- `docs`: alcance, decisiones, criterios de aceptación y preparación del despliegue.
- `.github/workflows`: validación de tipos, compilación y prueba de la aplicación compilada.
- `scripts/hp-diagnostico.sh`: inventario de recursos y puertos, de solo lectura.

No hay login funcional, persistencia, cotizaciones, GPS ni emisión SUNAT en esta fase. Las pantallas de módulos muestran su alcance previsto, sin métricas ficticias ni botones de guardado simulados.

Los directorios `client/`, `server/` y `tablas.sql` son la referencia heredada del commit `c4636ba` (12 de febrero de 2025). No pertenecen al workspace nuevo, no se instalan ni se despliegan mediante los comandos de esta versión. El servidor heredado contiene configuración insegura conocida: las credenciales utilizadas deben rotarse fuera de Git; no ejecutar ese servidor como parte de la nueva base.

## Documentación de trabajo

- [Plan maestro y fases](docs/PLAN-MAESTRO.md)
- [Arquitectura y modelo de dominio](docs/ARQUITECTURA.md)
- [Estado y siguiente entrega](docs/ESTADO.md)
- [Trabajo con HP y Termux](docs/HP-TERMUX.md)
- [Publicación con Cloudflare Tunnel](docs/CLOUDFLARE.md)

## Desarrollo local

Requisitos: Node.js 24 LTS y la versión de pnpm declarada en `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm test:smoke
```

Frontend de desarrollo: `pnpm dev:web` en `http://127.0.0.1:3100`.

API: `pnpm --filter @larams/api build` y después `pnpm --filter @larams/api start` en otra terminal. Salud: `http://127.0.0.1:3101/api/v1/health`. `pnpm dev:api` recompila TypeScript al guardar; reiniciar el proceso compilado cuando corresponda.

Los puertos son candidatos, no una afirmación sobre los puertos libres en la HP. En producción se usará un despliegue identificado por commit y se verificará antes la disponibilidad.

`pnpm db:validate` valida el esquema sin abrir conexión con MySQL. Las migraciones, usuarios de base de datos y administrador inicial se implementarán en la fase 1. No usar `db push`, `migrate reset` ni el SQL heredado sobre datos existentes.

## Regla de avance

Una fase se cierra al cumplir sus criterios de aceptación, pasar CI y comprobarse en la HP. Toda entrega actualiza `docs/ESTADO.md`. Las mejoras se desarrollan en ramas con PR; cada actualización a la HP tendrá un único comando y un procedimiento de reversión apropiado a esa entrega.

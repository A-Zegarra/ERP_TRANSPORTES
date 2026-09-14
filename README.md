# LARAM’S CARGO INTERNACIONAL — ERP

ERP para transporte terrestre desde Tacna, Perú, con operaciones internacionales hacia Chile y otros países. Desarrollo progresivo con Next.js, TypeScript, Tailwind, Node/NestJS y MySQL.

## Estado verificable

**Fase 0 instalada en la HP. Fase 1A.1 implementada en esta rama, pendiente de instalar en la HP.**

- `apps/web`: Next.js App Router, Tailwind y navegación adaptable. Inicio, alcance de módulos, configuración prevista, plan de fases y endpoint de salud.
- `apps/api`: NestJS modular, salud del proceso y comprobación real de MySQL; escucha en loopback.
- `prisma`: cliente y adaptador MySQL, migración inicial de 11 tablas, relaciones por empresa e índices.
- `docs`: alcance, decisiones, criterios de aceptación y preparación del despliegue.
- `.github/workflows`: validación de tipos, compilación y prueba de la aplicación compilada.
- `scripts/hp-diagnostico.sh`: inventario de recursos y puertos, de solo lectura.
- `scripts/hp-instalar.sh`: instalación por commit con releases y PM2 propios; paso Cloudflare con copia previa y validación del túnel efectivo. El usuario confirmó web/API saludables en la HP y la entrada del túnel aplicada. El diagnóstico posterior confirmó HTTPS y el usuario confirmó que la página abre normalmente.
- `scripts/hp-verificar-red.py`: diagnóstico independiente de servicios locales, HTTPS y DNS públicos; no modifica la instalación.

La persistencia de 1A.1 prepara empresa, sucursales y acceso. Todavía no hay login, formularios de registro, cotizaciones, GPS ni emisión SUNAT. Las pantallas muestran el alcance previsto. No se crean cuentas de aplicación ni datos de demostración.

Los directorios `client/`, `server/` y `tablas.sql` son la referencia heredada del commit `c4636ba` (12 de febrero de 2025). No pertenecen al workspace nuevo, no se instalan ni se despliegan mediante los comandos de esta versión. El servidor heredado contiene configuración insegura conocida: las credenciales utilizadas deben rotarse fuera de Git; no ejecutar ese servidor como parte de la nueva base.

## Documentación de trabajo

- [Plan maestro y fases](docs/PLAN-MAESTRO.md)
- [Arquitectura y modelo de dominio](docs/ARQUITECTURA.md)
- [Estado y siguiente entrega](docs/ESTADO.md)
- [Fase 1: empresa, MySQL y acceso](docs/FASE-1-EMPRESA-ACCESO.md)
- [Operación MySQL y respaldos de 1A.1](docs/MYSQL-1A1.md)
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

El diagnóstico aportado el 14 de septiembre de 2026 confirma que 3100/3101 estaban libres en la HP. El instalador vuelve a comprobarlo antes de activar una release identificada por commit.

`pnpm db:validate` valida el esquema sin abrir conexión. `pnpm db:generate` genera el cliente (incluido en check/build). El instalador prepara las cuentas propias y ejecuta `migrate deploy` con respaldo. Ver [MySQL 1A.1](docs/MYSQL-1A1.md). No usar `db push`, `migrate reset` ni el SQL heredado sobre datos existentes.

## Regla de avance

Una fase se cierra al cumplir sus criterios de aceptación, pasar CI y comprobarse en la HP. Toda entrega actualiza `docs/ESTADO.md`. Las mejoras se desarrollan en ramas con PR; cada actualización a la HP tendrá un único comando y un procedimiento de reversión apropiado a esa entrega.

import { cp, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const webRoot = fileURLToPath(new URL("../", import.meta.url));
const standaloneRoot = path.join(webRoot, ".next/standalone");
const nextRoot = path.join(standaloneRoot, "apps/web/.next");
await mkdir(nextRoot, { recursive: true });
await cp(path.join(webRoot, ".next/static"), path.join(nextRoot, "static"), { recursive: true });
// Autocontenido: este lanzador también viaja dentro del artefacto de CI.
await writeFile(path.join(standaloneRoot, "start.cjs"), `
const port = Number(process.env.PORT || '3100');
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('PORT debe ser un entero entre 1024 y 65535.');
}
process.env.PORT = String(port);
process.env.HOSTNAME = '127.0.0.1';
process.env.NODE_ENV = 'production';
require('./apps/web/server.js');
`);

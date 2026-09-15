#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, renameSync, symlinkSync, readlinkSync, realpathSync, lstatSync, unlinkSync } from "node:fs";
import path from "node:path";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const names = ["larams-erp-web", "larams-erp-api"];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cli = (args) => execFileSync("pm2", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000 });

function processes() {
  // PM2 incluye variables de otras aplicaciones: se filtran en memoria y nunca se imprimen.
  const raw = cli(["jlist"]);
  const start = raw.indexOf("[{");
  const list = JSON.parse(start >= 0 ? raw.slice(start) : raw.slice(raw.lastIndexOf("[]")));
  return list.filter((item) => names.includes(item.name)).map((item) => ({
    name: item.name, script: item.pm2_env.pm_exec_path, cwd: item.pm2_env.pm_cwd,
  }));
}

function inside(child, parent) {
  const relative = path.relative(parent, child);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export function assertOwned(items, root) {
  for (const item of items) {
    if (!inside(item.script, path.join(root, "releases")) || !inside(item.cwd, path.join(root, "releases"))) {
      throw new Error("El nombre PM2 " + item.name + " pertenece a otra ruta; no se modifica.");
    }
  }
  if (new Set(items.map((item) => item.name)).size !== items.length) {
    throw new Error("Hay nombres PM2 duplicados para LARAMS; revisar antes de instalar.");
  }
}

async function free(port) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", () => reject(new Error("La dirección interna " + port + " está ocupada; no se modifica su proceso.")));
    server.listen(port, "127.0.0.1", () => server.close(resolve));
  });
}

export async function preflight(root) {
  const items = processes();
  assertOwned(items, root);
  for (const [index, port] of [3100, 3101].entries()) {
    if (!items.some((item) => item.name === names[index])) await free(port);
  }
  return items;
}

function atomicLink(root, name, target) {
  const temp = path.join(root, "." + name + "-" + process.pid);
  try {
    symlinkSync(target, temp);
    renameSync(temp, path.join(root, name));
  } finally {
    if (existsSync(temp)) unlinkSync(temp);
  }
}

function current(root) {
  const link = path.join(root, "current");
  try {
    if (!lstatSync(link).isSymbolicLink()) throw new Error("current debe ser un enlace de LARAMS.");
    const target = path.resolve(root, readlinkSync(link));
    if (!inside(target, path.join(root, "releases")) || !existsSync(path.join(target, ".larams-ready"))) {
      throw new Error("La versión activa no pertenece a una release preparada de LARAMS.");
    }
    return target;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function manifest(release) {
  const filename = path.join(release, "larams.release.json");
  return existsSync(filename) ? JSON.parse(readFileSync(filename, "utf8")) : { milestone: "0", requiresDatabase: false };
}

function config(root, release) {
  const requiresDatabase = manifest(release).requiresDatabase;
  return { apps: [
    { name: names[0], cwd: path.join(release, "apps/web"),
      script: path.join(release, "apps/web/.next/standalone/start.cjs"),
      env: { NODE_ENV: "production", PORT: "3100", HOSTNAME: "127.0.0.1", NEXT_TELEMETRY_DISABLED: "1" } },
    { name: names[1], cwd: path.join(release, "apps/api"),
      script: path.join(release, "apps/api/dist/main.js"),
      env: { NODE_ENV: "production", API_PORT: "3101",
        ...(requiresDatabase ? { LARAMS_ENV_FILE: path.join(root, "shared", "api.env") } : {}) } },
  ].map((app) => ({ ...app, interpreter: process.execPath, instances: 1, exec_mode: "fork",
    autorestart: true, min_uptime: "10s", max_restarts: 5, restart_delay: 2000,
    kill_timeout: 5000, time: true,
    out_file: path.join(root, "shared", app.name + ".out.log"),
    error_file: path.join(root, "shared", app.name + ".error.log"),
  })) };
}

async function health(release) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      for (const [port, route, service] of [[3100, "/api/health", "larams-web"], [3101, "/api/v1/health", "larams-api"]]) {
        const response = await fetch("http://127.0.0.1:" + port + route, { signal: AbortSignal.timeout(1500), redirect: "error" });
        const body = await response.json();
        if (!response.ok || body.status !== "ok" || body.service !== service || body.phase !== 0) throw new Error("Salud incorrecta.");
      }
      if (manifest(release).requiresDatabase) {
        const response = await fetch("http://127.0.0.1:3101/api/v1/ready", { signal: AbortSignal.timeout(6500), redirect: "error" });
        const body = await response.json();
        if (!response.ok || body.status !== "ok" || body.database !== "ok" || body.schemaVersion !== manifest(release).schemaVersion) {
          throw new Error("MySQL no está preparado.");
        }
      }
      return;
    } catch { await delay(500); }
  }
  throw new Error("Web o API no superaron la comprobación de salud.");
}

function removeOwn(items) {
  for (const item of items) cli(["delete", item.name]);
}

function start(root, release) {
  const filename = path.join(root, "shared", "ecosystem.config.json");
  writeFileSync(filename, JSON.stringify(config(root, release), null, 2) + "\n", { mode: 0o600 });
  cli(["start", filename]);
}

export async function activate(root, release) {
  root = realpathSync(root);
  release = realpathSync(release);
  if (readFileSync(path.join(root, ".larams-installation"), "utf8").trim() !== "A-Zegarra/ERP_TRANSPORTES") {
    throw new Error("La carpeta no está identificada como instalación de LARAMS.");
  }
  if (!inside(release, path.join(root, "releases")) || !existsSync(path.join(release, ".larams-ready"))) {
    throw new Error("La release no está preparada dentro de esta instalación.");
  }
  for (const filename of ["apps/web/.next/standalone/start.cjs", "apps/api/dist/main.js"]) {
    if (!existsSync(path.join(release, filename))) throw new Error("Falta un compilado de la release.");
  }
  if (manifest(release).requiresDatabase && !existsSync(path.join(root, "shared", "api.env"))) {
    throw new Error("Falta preparar la conexión MySQL de esta instalación.");
  }
  const old = current(root);
  const items = await preflight(root);
  if (items.length && !old) throw new Error("Hay procesos LARAMS sin una release activa reconocible.");
  try {
    removeOwn(items);
    await free(3100);
    await free(3101);
    start(root, release);
    await health(release);
    if (old && old !== release) atomicLink(root, "previous", old);
    atomicLink(root, "current", release);
  } catch {
    try {
      const started = processes();
      assertOwned(started, root);
      removeOwn(started);
      if (old) {
        start(root, old);
        await health(old);
        atomicLink(root, "current", old);
      }
    } catch {
      throw new Error("Falló la activación y no se pudo recuperar automáticamente LARAMS. Revisar sus logs en shared.");
    }
    throw new Error(old ? "La nueva versión falló; se recuperó la anterior." : "La instalación no arrancó; se retiraron únicamente sus procesos LARAMS.");
  }
  try {
    // Conserva los procesos de la sesión PM2 para el próximo arranque, sin reiniciarlos.
    cli(["save"]);
  } catch {
    console.error("LARAMS está activo, pero pm2 save falló. Falta guardar su arranque.");
  }
  writeFileSync(path.join(root, "shared", "installation.json"), JSON.stringify({
    phase: manifest(release).milestone, release, installedAt: new Date().toISOString(), web: "127.0.0.1:3100", api: "127.0.0.1:3101",
  }, null, 2) + "\n", { mode: 0o600 });
  console.log("LARAMS web y API: salud correcta. Release: " + path.basename(release));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [action, root, target] = process.argv.slice(2);
    if (!root) throw new Error("Uso: hp-activar.mjs check|activate|rollback RUTA [RELEASE]");
    if (action === "check") await preflight(path.resolve(root));
    else if (action === "activate" && target) await activate(root, target);
    else if (action === "rollback") {
      const previous = path.join(root, "previous");
      if (!existsSync(previous)) throw new Error("No hay una versión anterior para recuperar.");
      await activate(root, realpathSync(previous));
    } else throw new Error("Acción no reconocida.");
  } catch (error) {
    // No se imprime stderr del comando PM2 ni objetos que puedan contener variables.
    console.error(error.message?.startsWith("Command failed") ? "PM2 no completó la operación. Revisar únicamente los procesos LARAMS." : error.message);
    process.exitCode = 1;
  }
}

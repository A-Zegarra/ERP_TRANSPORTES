import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function freePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function start(script, args, cwd, env, url, t) {
  const processHandle = spawn(process.execPath, [script, ...args], {
    cwd, env: { ...process.env, NODE_ENV: "production", ...env }, stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  for (const stream of [processHandle.stdout, processHandle.stderr]) stream.on("data", (data) => {
    logs = (logs + data.toString()).slice(-10000);
  });
  t.after(async () => {
    if (processHandle.exitCode !== null || processHandle.signalCode !== null) return;
    const exited = once(processHandle, "exit");
    processHandle.kill("SIGTERM");
    await Promise.race([exited, delay(3000)]);
    if (processHandle.exitCode === null && processHandle.signalCode === null) processHandle.kill("SIGKILL");
  });
  for (let attempt = 0; attempt < 80; attempt++) {
    if (processHandle.exitCode !== null) throw new Error(`El proceso terminó antes de responder. ${logs}`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch { /* El servidor todavía está iniciando. */ }
    await delay(250);
  }
  throw new Error(`El servidor no respondió. ${logs}`);
}

test("el compilado navega, distingue MySQL pendiente y no expone operaciones de negocio", { timeout: 60000 }, async (t) => {
  const apiPort = await freePort();
  await start(path.join(root, "apps/api/dist/main.js"), [], root, { API_PORT: String(apiPort), DATABASE_URL: "", LARAMS_ENV_FILE: "" }, `http://127.0.0.1:${apiPort}/api/v1/health`, t);
  const webPort = await freePort();
  const webDir = path.join(root, "apps/web");
  await start(path.join(webDir, ".next/standalone/start.cjs"), [], webDir, { PORT: String(webPort) }, `http://127.0.0.1:${webPort}/api/health`, t);

  const health = await fetch(`http://127.0.0.1:${apiPort}/api/v1/health`);
  assert.equal(health.headers.get("cache-control"), "no-store");
  assert.equal((await health.json()).status, "ok");
  const ready = await fetch(`http://127.0.0.1:${apiPort}/api/v1/ready`);
  assert.equal(ready.status, 503);
  assert.equal(ready.headers.get("cache-control"), "no-store");
  const unavailable = await ready.text();
  assert.ok(!/mysql:\/\/|password|DATABASE_URL|stack/i.test(unavailable));
  const profile = await fetch(`http://127.0.0.1:${apiPort}/api/v1/auth/me`);
  assert.equal(profile.status, 401);
  const forged = await fetch(`http://127.0.0.1:${apiPort}/api/v1/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://otro.aliproinv.com" }, body: "{}",
  });
  assert.equal(forged.status, 403);
  const business = await fetch(`http://127.0.0.1:${apiPort}/api/v1/clients`, { method: "POST" });
  assert.equal(business.status, 404);

  for (const [route, title] of [["/", "Cada viaje"], ["/login", "Bienvenido de nuevo"], ["/cotizaciones", "Cotizaciones"], ["/implementacion", "Un avance, una fase."]]) {
    const response = await fetch(`http://127.0.0.1:${webPort}${route}`);
    assert.equal(response.status, 200, route);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    const html = await response.text();
    assert.ok(html.includes(title), route);
    if (route === "/") {
      const stylesheet = html.match(/href="([^" ]+\.css[^" ]*)"/);
      assert.ok(stylesheet, "El HTML debe enlazar la hoja de estilos compilada.");
      const css = await fetch(new URL(stylesheet[1], `http://127.0.0.1:${webPort}`));
      assert.equal(css.status, 200, "El artefacto standalone debe servir sus estilos.");
    }
  }
  const missing = await fetch(`http://127.0.0.1:${webPort}/no-existe`);
  assert.equal(missing.status, 404);
  const write = await fetch(`http://127.0.0.1:${webPort}/api/health`, { method: "POST" });
  assert.equal(write.status, 405);
  const account = await fetch(`http://127.0.0.1:${webPort}/mi-cuenta`, { redirect: "manual" });
  assert.equal(account.status, 307);
  assert.equal(account.headers.get("location"), "/login");
  const settings = await fetch("http://127.0.0.1:" + webPort + "/configuracion", { redirect: "manual" });
  assert.equal(settings.status, 307);
  assert.equal(settings.headers.get("location"), "/login");
});

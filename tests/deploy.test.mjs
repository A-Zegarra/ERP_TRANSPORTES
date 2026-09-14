import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync, rmSync, readFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { assertOwned, activate } from "../scripts/hp-activar.mjs";

test("protege nombres de PM2 ajenos y duplicados", () => {
  assert.throws(() => assertOwned([{ name: "larams-erp-web", script: "/other/web.js", cwd: "/other" }], "/erp"), /otra ruta/);
  const own = { name: "larams-erp-web", script: "/erp/releases/one/web.js", cwd: "/erp/releases/one/web" };
  assert.doesNotThrow(() => assertOwned([own], "/erp"));
  assert.throws(() => assertOwned([own, own], "/erp"), /duplicados/);
});

test("activa, conserva otra aplicación y recupera la release anterior si falla la nueva", { timeout: 180000 }, async (t) => {
  const temp = mkdtempSync(path.join(os.tmpdir(), "larams-deploy-"));
  const root = path.join(temp, "larams");
  const formerPm2Home = process.env.PM2_HOME;
  process.env.PM2_HOME = path.join(temp, "pm2");
  const pm2 = (args) => execFileSync("pm2", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000 });
  t.after(() => {
    try { pm2(["kill"]); } catch { /* Solo el daemon temporal de esta prueba. */ }
    if (formerPm2Home === undefined) delete process.env.PM2_HOME;
    else process.env.PM2_HOME = formerPm2Home;
    rmSync(temp, { recursive: true, force: true });
  });
  mkdirSync(path.join(root, "shared"), { recursive: true });
  writeFileSync(path.join(root, ".larams-installation"), "A-Zegarra/ERP_TRANSPORTES\n");

  const sentinel = path.join(temp, "sentinel.cjs");
  writeFileSync(sentinel, "setInterval(() => {}, 1000);\n");
  pm2(["start", sentinel, "--name", "otra-aplicacion"]);
  const snapshot = () => JSON.parse(pm2(["jlist"])).find((item) => item.name === "otra-aplicacion");
  const sentinelPid = snapshot().pid;

  function release(name, valid = true) {
    const directory = path.join(root, "releases", name);
    const web = path.join(directory, "apps/web/.next/standalone");
    const api = path.join(directory, "apps/api/dist");
    mkdirSync(web, { recursive: true });
    mkdirSync(api, { recursive: true });
    writeFileSync(path.join(directory, ".larams-ready"), name);
    const source = (service, variable) => "require('node:http').createServer((req,res)=>{res.setHeader('content-type','application/json');res.end(JSON.stringify({status:'" +
      (valid ? "ok" : "failed") + "',service:'" + service + "',phase:0}));}).listen(Number(process.env." + variable + "),'127.0.0.1');\n";
    writeFileSync(path.join(web, "start.cjs"), source("larams-web", "PORT"));
    writeFileSync(path.join(api, "main.js"), source("larams-api", "API_PORT"));
    return directory;
  }
  const first = release("first");
  const second = release("second");
  const broken = release("broken", false);
  await activate(root, first);
  assert.equal(realpathSync(path.join(root, "current")), first);
  await activate(root, first);
  assert.equal(realpathSync(path.join(root, "current")), first);
  await activate(root, second);
  assert.equal(realpathSync(path.join(root, "previous")), first);
  assert.equal(realpathSync(path.join(root, "current")), second);
  await assert.rejects(() => activate(root, broken), /se recuperó la anterior/);
  assert.equal(realpathSync(path.join(root, "current")), second);
  assert.equal(snapshot().pid, sentinelPid, "La aplicación existente debe conservar su proceso.");
  const record = JSON.parse(readFileSync(path.join(root, "shared/installation.json"), "utf8"));
  assert.equal(record.release, second);
  const response = await fetch("http://127.0.0.1:3100/api/health");
  assert.equal((await response.json()).status, "ok");
});

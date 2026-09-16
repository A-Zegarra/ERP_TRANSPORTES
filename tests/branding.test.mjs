import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createDatabase, databaseConfig } from "../apps/api/dist/database/client.js";
const sharp = createRequire(new URL("../apps/api/package.json", import.meta.url))("sharp");
if (process.env.LARAMS_TEST_DATABASE !== "1" || process.env.LARAMS_DB_PORT !== "33306"
    || new URL(databaseConfig().url).port !== "33306") throw new Error("Solo MySQL desechable de CI en 33306.");
const root = fileURLToPath(new URL("../", import.meta.url));
const origin = "https://larams.aliproinv.com";
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const digest = value => createHash("sha256").update(value).digest("hex");
async function port() {
  const server = createServer().listen(0, "127.0.0.1");
  await once(server, "listening"); const value = server.address().port;
  await new Promise(resolve => server.close(resolve)); return value;
}
async function start(script, env, health, t) {
  const child = spawn(process.execPath, [script], { cwd: root, env: { ...process.env, NODE_ENV: "production", ...env }, stdio: "ignore" });
  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, "exit"); child.kill("SIGTERM");
    await Promise.race([exited, wait(3000)]);
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  };
  t.after(stop);
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(health, { signal: AbortSignal.timeout(1000) })).ok) return stop; } catch {}
    await wait(200);
  }
  throw new Error("No inició el compilado de personalización.");
}
test("1B real: identidad, archivos, permisos, versiones, auditoría y reinicio", { timeout: 120000 }, async t => {
  const db = createDatabase(); t.after(() => db.$disconnect());
  const setup = await db.bootstrap.findUniqueOrThrow({ where: { id: 1 } });
  const foreign = await db.company.findFirstOrThrow({ where: { id: { not: setup.companyId } } });
  const admin = await db.membership.findUniqueOrThrow({ where: { companyId_userId: { companyId: setup.companyId, userId: setup.userId } } });
  const apiPort = await port(), webPort = await port();
  const api = "http://127.0.0.1:" + apiPort, web = "http://127.0.0.1:" + webPort;
  const apiEnv = { API_PORT: String(apiPort), LARAMS_ORIGIN: origin };
  let stop = await start(root + "apps/api/dist/main.js", apiEnv, api + "/api/v1/health", t);
  await start(root + "apps/web/.next/standalone/start.cjs", { PORT: String(webPort), LARAMS_API_PORT: String(apiPort),
    LARAMS_ORIGIN: origin }, web + "/api/health", t);
  // Sesiones desechables para probar el guard real; login ya tiene su ensayo independiente.
  const token = randomBytes(32).toString("base64url");
  await db.session.create({ data: { companyId: setup.companyId, membershipId: admin.id, tokenHash: digest(token),
    expiresAt: new Date(Date.now() + 600000) } });
  const cookie = "__Host-larams_session=" + token;
  const reader = await db.user.create({ data: { email: randomUUID() + "@example.invalid", displayName: "Consulta 1B", active: true } });
  const membership = await db.membership.create({ data: { companyId: setup.companyId, userId: reader.id } });
  const role = await db.role.findUniqueOrThrow({ where: { companyId_code: { companyId: setup.companyId, code: "consulta" } } });
  await db.userRole.create({ data: { companyId: setup.companyId, membershipId: membership.id, roleId: role.id } });
  const readerToken = randomBytes(32).toString("base64url");
  await db.session.create({ data: { companyId: setup.companyId, membershipId: membership.id, tokenHash: digest(readerToken),
    expiresAt: new Date(Date.now() + 600000) } });
  const readerCookie = "__Host-larams_session=" + readerToken;
  const call = (path, method = "GET", data, session = cookie, direct = false, headers = {}) =>
    fetch((direct ? api + "/api/v1/" : web + "/api/") + path, { method, headers: { Cookie: session,
      ...(data === undefined ? {} : { Origin: origin, "Content-Type": "application/json", "X-Larams-Intent": "1" }), ...headers },
      body: data === undefined ? undefined : JSON.stringify(data) });
  const expect = async (promise, status) => {
    const response = await promise; const body = await response.json();
    assert.equal(response.status, status, JSON.stringify(body));
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.doesNotMatch(JSON.stringify(body), /passwordHash|tokenHash|mysql:\/\/|scrypt\$/);
    return body;
  };
  for (const path of ["organization/branding", "organization/audit"]) {
    await expect(call(path, "GET", undefined, ""), 401);
    await expect(call(path, "GET", undefined, "", true), 401);
  }
  const initial = await expect(call("organization/branding"), 200);
  assert.equal(initial.logoHash, null);
  const publicInitial = await expect(call("branding", "GET", undefined, ""), 200);
  assert.deepEqual(Object.keys(publicInitial).sort(), ["displayName", "slogan", "primaryColor", "accentColor", "density", "logoHash"].sort());
  const input = { version: initial.version, displayName: "Transporte CI", slogan: "Tacna y rutas terrestres",
    primaryColor: "#174c72", accentColor: "#763d16", density: "compact" };
  await expect(call("organization/branding", "PATCH", input, readerCookie), 403);
  await expect(call("organization/audit", "GET", undefined, readerCookie), 403);
  await expect(call("organization/branding", "GET", undefined, readerCookie), 200);
  await expect(call("organization/branding", "PATCH", input, cookie, false, { Origin: "https://otro.example" }), 403);
  await expect(call("organization/branding", "PATCH", { ...input, companyId: foreign.id }), 400);
  await expect(call("organization/branding", "PATCH", { ...input, primaryColor: "#ffffff" }), 400);
  let value = await expect(call("organization/branding", "PATCH", input), 200);
  await expect(call("organization/branding", "PATCH", input), 409);
  assert.equal((await expect(call("branding", "GET", undefined, ""), 200)).displayName, input.displayName);
  const png = await sharp(randomBytes(128 * 128 * 3), { raw: { width: 128, height: 128, channels: 3 } }).png().toBuffer();
  assert.ok(png.length > 4096);
  const data = png.toString("base64");
  await expect(call("organization/branding/logo", "POST", { version: value.version, data }, readerCookie), 403);
  await expect(call("organization/branding/logo", "POST", { version: value.version, data: Buffer.from("<svg/>").toString("base64") }), 400);
  await expect(call("organization/branding/logo", "POST", { version: value.version, data: "A".repeat(1500000) }), 413);
  await expect(call("organization/branding/logo", "POST", { version: value.version, data: "A".repeat(1500000) }, cookie, true), 413);
  await expect(call("organization/branding", "PATCH", { ...input, slogan: "x".repeat(6000) }, cookie, true), 413);
  const large = await sharp({ create: { width: 4097, height: 1, channels: 3, background: "#fff" } }).png().toBuffer();
  await expect(call("organization/branding/logo", "POST", { version: value.version, data: large.toString("base64") }), 400);
  const previous = value.version;
  value = await expect(call("organization/branding/logo", "POST", { version: value.version, data }), 201);
  await expect(call("organization/branding/logo", "POST", { version: previous, data }), 409);
  assert.match(value.logoHash, /^[a-f0-9]{64}$/);
  const image = await call("branding/logo", "GET", undefined, "");
  assert.equal(image.headers.get("content-type"), "image/webp");
  assert.equal(image.headers.get("x-content-type-options"), "nosniff");
  const bytes = Buffer.from(await image.arrayBuffer());
  assert.equal(digest(bytes), value.logoHash);
  const meta = await sharp(bytes).metadata();
  assert.equal(meta.format, "webp"); assert.ok(meta.width <= 512 && meta.height <= 512); assert.equal(meta.exif, undefined);
  const path = join(dirname(process.env.LARAMS_ENV_FILE), "logos", setup.companyId, value.logoHash + ".webp");
  assert.equal((await stat(path)).mode & 0o077, 0); assert.deepEqual(await readFile(path), bytes);
  value = await expect(call("organization/branding/remove-logo", "POST", { version: value.version }), 201);
  await expect(call("branding/logo", "GET", undefined, ""), 404);
  assert.deepEqual(await readFile(path), bytes, "Conservar objetos para los respaldos anteriores");
  value = await expect(call("organization/branding/logo", "POST", { version: value.version, data }), 201);
  await stop(); stop = await start(root + "apps/api/dist/main.js", apiEnv, api + "/api/v1/health", t);
  assert.equal((await expect(call("organization/branding"), 200)).logoHash, value.logoHash);
  assert.deepEqual(Buffer.from(await (await call("branding/logo", "GET", undefined, "")).arrayBuffer()), bytes);

  const foreignEvent = await db.auditEvent.create({ data: { companyId: foreign.id, action: "branding.updated", entityType: "branding" } });
  await expect(call("organization/audit/" + foreignEvent.id), 404);
  await expect(call("organization/audit/9223372036854775808"), 400);
  await expect(call("organization/audit?after=invalid"), 400);
  await expect(call("organization/audit?from=2025-01-01T00%3A00%3A00.000Z&to=2026-01-01T00%3A00%3A00.000Z"), 400);
  const recent = await expect(call("organization/audit?action=branding.updated"), 200);
  const change = await expect(call("organization/audit/" + recent.items[0].id), 200);
  assert.equal(change.beforeJson.displayName, initial.displayName);
  assert.equal(change.afterJson.displayName, input.displayName);
  assert.ok(change.actorName);
  const createdAt = new Date(Date.now() - 1000);
  await db.auditEvent.createMany({ data: Array.from({ length: 23 }, () => ({ companyId: setup.companyId,
    action: "test.pagination", entityType: "test", createdAt })) });
  const page1 = await expect(call("organization/audit?action=test.pagination"), 200);
  assert.equal(page1.items.length, 20); assert.ok(page1.next);
  const page2 = await expect(call("organization/audit?action=test.pagination&after=" + page1.next), 200);
  assert.equal(page2.items.length, 3); assert.equal(page2.next, null);
  assert.equal(new Set([...page1.items, ...page2.items].map(e => e.id)).size, 23);
  assert.ok(page1.items.every(e => !("beforeJson" in e) && !("afterJson" in e)));
  const userEvents = await db.auditEvent.findMany({ where: { companyId: setup.companyId, action: "user.created" },
    select: { beforeJson: true, afterJson: true } });
  assert.ok(userEvents.some(e => e.afterJson));
  assert.doesNotMatch(JSON.stringify(userEvents), /passwordHash|tokenHash|password|confirmation/);
  await db.auditEvent.deleteMany({ where: { OR: [{ id: foreignEvent.id }, { companyId: setup.companyId, action: "test.pagination" }] } });
});

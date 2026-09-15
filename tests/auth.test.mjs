import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createDatabase, databaseConfig } from "../apps/api/dist/database/client.js";
import { createInitialAdmin } from "../apps/api/dist/auth/bootstrap.js";
import { hashPassword, verifyPassword } from "../apps/api/dist/auth/password.js";
import { sessionCookie } from "../apps/api/dist/auth/policy.js";

if (process.env.LARAMS_TEST_DATABASE !== "1" || process.env.LARAMS_DB_PORT !== "33306"
    || new URL(databaseConfig().url).port !== "33306") throw new Error("Solo MySQL desechable de CI en 33306.");
const root = fileURLToPath(new URL("../", import.meta.url));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const password = "Larams ensayo 2026 correcto!";
const email = "admin-ci@example.invalid";
const origin = "https://larams.aliproinv.com";
const digest = value => createHash("sha256").update(value).digest("hex");

async function freePort() {
  const server = createServer().listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function start(script, env, url, t) {
  const child = spawn(process.execPath, [script], { cwd: root, env: { ...process.env, NODE_ENV: "production", ...env }, stdio: "ignore" });
  const stop = async () => {
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    await Promise.race([exited, wait(3000)]);
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  };
  t.after(stop);
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return stop; } catch {}
    await wait(200);
  }
  throw new Error("No inició el compilado de autenticación.");
}

test("acceso real: bootstrap, contraseñas, cookies, CSRF, permisos, aislamiento y revocación", { timeout: 120000 }, async t => {
  const db = createDatabase();
  t.after(() => db.$disconnect());
  const setup = await db.bootstrap.findUniqueOrThrow({ where: { id: 1 } });
  const user = await db.user.findUniqueOrThrow({ where: { email } });
  const member = await db.membership.findUniqueOrThrow({ where: { companyId_userId: { companyId: setup.companyId, userId: user.id } } });
  const role = await db.role.findUniqueOrThrow({ where: { companyId_code: { companyId: setup.companyId, code: "administrador" } } });
  const before = user.passwordHash;
  assert.equal(await verifyPassword(password, before), true);
  assert.equal(await verifyPassword("una contraseña diferente", before), false);
  assert.equal(await verifyPassword(password, null), false);
  assert.notEqual(await hashPassword(password), before, "Cada contraseña recibe una sal aleatoria");
  assert.ok(!before.includes(password));
  const repeated = await createInitialAdmin(db, { email, password: "Otra clave que no reemplaza", companyName: "No reemplazar", displayName: "No reemplazar" });
  assert.equal(repeated.status, "already-configured");
  assert.equal((await db.user.findUniqueOrThrow({ where: { email } })).passwordHash, before);
  await assert.rejects(createInitialAdmin(db, { email: "otro@example.invalid", password, companyName: "Otra", displayName: "Otro" }));
  assert.equal(await db.user.count(), 1);

  const foreign = await db.company.create({ data: { legalName: "Empresa ajena CI", countryCode: "CL", currencyCode: "CLP", timeZone: "America/Santiago" } });
  const apiPort = await freePort();
  const base = "http://127.0.0.1:" + apiPort;
  const apiEnv = { API_PORT: String(apiPort), LARAMS_ORIGIN: origin };
  let stopApi = await start(root + "apps/api/dist/main.js", apiEnv, base + "/api/v1/health", t);
  const webPort = await freePort();
  const web = "http://127.0.0.1:" + webPort;
  await start(root + "apps/web/.next/standalone/start.cjs", { PORT: String(webPort), LARAMS_API_PORT: String(apiPort), LARAMS_ORIGIN: origin }, web + "/api/health", t);
  const post = (url, body, cookie = "", extra = {}) => fetch(url, {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "X-Larams-Intent": "1", Cookie: cookie, ...extra },
    body: JSON.stringify(body),
  });
  const login = async () => {
    await db.authThrottle.deleteMany({ where: { key: digest(email) } });
    const response = await post(web + "/api/auth/login", { email, password });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
    const header = response.headers.get("set-cookie");
    assert.match(header, /^__Host-larams_session=[A-Za-z0-9_-]{43};/);
    for (const attribute of ["HttpOnly", "Secure", "Path=/", "SameSite=Lax", "Max-Age=28800"]) assert.ok(header.includes(attribute));
    assert.ok(!header.includes("Domain="));
    return header.split(";")[0];
  };

  assert.match(sessionCookie("x".repeat(43)), /HttpOnly/);
  assert.equal((await fetch(base + "/api/v1/auth/me")).status, 401);
  assert.equal((await fetch(base + "/api/v1/organization/company")).status, 401);
  assert.equal((await post(web + "/api/auth/login", { email, password }, "", { Origin: "https://go.aliproinv.com" })).status, 403);
  assert.equal((await post(base + "/api/v1/auth/login", { email, password }, "", { "X-Larams-Intent": "" })).status, 403);
  assert.equal((await post(web + "/api/auth/setup", {})).status, 404);
  assert.equal((await post(base + "/api/v1/auth/setup", {})).status, 404);
  assert.equal((await fetch(web + "/api/auth/logout")).status, 405);
  assert.equal((await post(web + "/api/auth/login", { email, password, role: "administrador" })).status, 400);
  assert.equal((await post(web + "/api/auth/login", { email, password: "x".repeat(5000) })).status, 413);
  assert.equal((await post(base + "/api/v1/auth/login", { email, password: "x".repeat(5000) })).status, 413);

  const wrong = await post(web + "/api/auth/login", { email, password: "contraseña incorrecta" });
  const unknown = await post(web + "/api/auth/login", { email: "desconocido@example.invalid", password });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.deepEqual(await wrong.json(), await unknown.json());
  let cookie = await login();
  const token = cookie.split("=")[1];
  let stored = await db.session.findUniqueOrThrow({ where: { tokenHash: digest(token) } });
  assert.notEqual(stored.tokenHash, token);
  const profile = await fetch(web + "/api/auth/me", { headers: { Cookie: cookie } });
  assert.equal(profile.status, 200);
  assert.equal(profile.headers.get("cache-control"), "no-store");
  const view = await profile.json();
  assert.equal(view.company.id, setup.companyId);
  assert.equal(view.user.email, email);
  assert.ok(!JSON.stringify(view).match(/passwordHash|tokenHash|mysql:\/\//));
  const account = await fetch(web + "/mi-cuenta", { headers: { Cookie: cookie } });
  assert.equal(account.status, 200);
  assert.ok((await account.text()).includes("Administrador CI"));
  const anonymous = await fetch(web + "/mi-cuenta", { redirect: "manual" });
  assert.equal(anonymous.status, 307);
  assert.equal(anonymous.headers.get("location"), "/login");
  const own = await fetch(base + "/api/v1/organization/company?companyId=" + foreign.id, { headers: { Cookie: cookie } });
  assert.equal((await own.json()).id, setup.companyId);

  await db.rolePermission.deleteMany({ where: { roleId: role.id, permissionCode: "company.read" } });
  assert.equal((await fetch(base + "/api/v1/organization/company", { headers: { Cookie: cookie } })).status, 403);
  await db.rolePermission.create({ data: { companyId: setup.companyId, roleId: role.id, permissionCode: "company.read" } });
  for (const [model, id] of [["membership", member.id], ["user", user.id], ["company", setup.companyId]]) {
    await db[model].update({ where: { id }, data: { active: false } });
    assert.equal((await fetch(web + "/api/auth/me", { headers: { Cookie: cookie } })).status, 401);
    await db[model].update({ where: { id }, data: { active: true } });
  }
  await db.session.update({ where: { id: stored.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await fetch(web + "/api/auth/me", { headers: { Cookie: cookie } })).status, 401);
  cookie = await login();
  stored = await db.session.findUniqueOrThrow({ where: { tokenHash: digest(cookie.split("=")[1]) } });
  assert.equal((await post(web + "/api/auth/logout", {}, cookie, { Origin: "https://otro.example" })).status, 403);
  assert.equal((await fetch(web + "/api/auth/me", { headers: { Cookie: cookie } })).status, 200);
  const logout = await post(web + "/api/auth/logout", {}, cookie);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
  assert.ok((await db.session.findUniqueOrThrow({ where: { id: stored.id } })).revokedAt);
  assert.equal((await fetch(web + "/api/auth/me", { headers: { Cookie: cookie } })).status, 401);
  cookie = await login();
  stored = await db.session.findUniqueOrThrow({ where: { tokenHash: digest(cookie.split("=")[1]) } });
  await db.session.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  assert.equal((await fetch(base + "/api/v1/auth/me", { headers: { Cookie: cookie } })).status, 401);

  await db.authThrottle.deleteMany({ where: { key: digest(email) } });
  for (let attempt = 0; attempt < 8; attempt++) assert.equal((await post(web + "/api/auth/login", { email, password: "incorrecta" })).status, 401);
  assert.equal((await post(web + "/api/auth/login", { email, password })).status, 429);
  await stopApi();
  stopApi = await start(root + "apps/api/dist/main.js", apiEnv, base + "/api/v1/health", t);
  assert.equal((await post(web + "/api/auth/login", { email, password })).status, 429, "El límite sobrevive al reinicio de la API");
  const audit = await db.auditEvent.findMany({ where: { companyId: setup.companyId } });
  for (const action of ["system.bootstrap", "auth.login", "auth.login_failed", "auth.logout"]) assert.ok(audit.some(row => row.action === action));
  assert.ok(!JSON.stringify(audit, (_, value) => typeof value === "bigint" ? value.toString() : value).includes(password));
  await db.company.delete({ where: { id: foreign.id } });
});

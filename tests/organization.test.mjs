import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createDatabase, databaseConfig } from "../apps/api/dist/database/client.js";

if (process.env.LARAMS_TEST_DATABASE !== "1" || process.env.LARAMS_DB_PORT !== "33306"
    || new URL(databaseConfig().url).port !== "33306") throw new Error("Solo MySQL desechable de CI en 33306.");
const root = fileURLToPath(new URL("../", import.meta.url));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const password = "Larams ensayo 2026 correcto!";
const personalPassword = "Nueva contraseña personal CI!";
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
  throw new Error("No inició el compilado de administración.");
}

test("administración real: persistencia, paginación, aislamiento, concurrencia y acceso mínimo", { timeout: 120000 }, async t => {
  const db = createDatabase();
  t.after(() => db.$disconnect());
  const setup = await db.bootstrap.findUniqueOrThrow({ where: { id: 1 } });
  const adminUser = await db.user.findUniqueOrThrow({ where: { email: "admin-ci@example.invalid" } });
  const admin = await db.membership.findUniqueOrThrow({ where: { companyId_userId: { companyId: setup.companyId, userId: adminUser.id } } });
  const originalBranch = await db.branch.findFirstOrThrow({ where: { companyId: setup.companyId } });
  const foreign = await db.company.create({ data: { legalName: "Ajena CI", countryCode: "CL", currencyCode: "CLP", timeZone: "America/Santiago" } });
  const foreignBranch = await db.branch.create({ data: { companyId: foreign.id, code: "OTRA", name: "Otra sede", countryCode: "CL", timeZone: "America/Santiago" } });
  const apiPort = await freePort(), webPort = await freePort();
  const api = "http://127.0.0.1:" + apiPort, web = "http://127.0.0.1:" + webPort;
  const apiEnv = { API_PORT: String(apiPort), LARAMS_ORIGIN: origin };
  let stop = await start(root + "apps/api/dist/main.js", apiEnv, api + "/api/v1/health", t);
  await start(root + "apps/web/.next/standalone/start.cjs", { PORT: String(webPort), LARAMS_API_PORT: String(apiPort), LARAMS_ORIGIN: origin }, web + "/api/health", t);
  const call = (path, method = "GET", data, cookie = "", direct = false, headers = {}) =>
    fetch((direct ? api + "/api/v1/" : web + "/api/") + path, { method,
      headers: { Cookie: cookie, ...(data === undefined ? {} : { Origin: origin, "Content-Type": "application/json", "X-Larams-Intent": "1" }), ...headers },
      body: data === undefined ? undefined : JSON.stringify(data) });
  const expect = async (response, status) => {
    const r = await response; const body = await r.json();
    assert.equal(r.status, status, JSON.stringify(body));
    assert.equal(r.headers.get("cache-control"), "no-store");
    assert.ok(!JSON.stringify(body).match(/passwordHash|tokenHash|mysql:\/\//));
    return body;
  };
  const login = async (email = adminUser.email, secret = password) => {
    await db.authThrottle.deleteMany({ where: { key: digest(email) } });
    const r = await call("auth/login", "POST", { email, password: secret });
    assert.equal(r.status, 200, await r.text());
    return r.headers.get("set-cookie").split(";")[0];
  };
  const companyBody = value => { const { id, ...data } = value; return data; };
  const branchBody = value => ({ version: value.version, code: value.code, name: value.name,
    countryCode: value.countryCode, timeZone: value.timeZone, address: value.address, active: value.active });
  const memberBody = (member, enabled = true, role = "consulta") =>
    ({ version: member.version, active: enabled, role, branchIds: [originalBranch.id] });
  const newUser = (email, role = "consulta") =>
    ({ email, displayName: "Usuario de ensayo", role, branchIds: [originalBranch.id], password, confirmation: password });
  let cookie = await login();
  for (const path of ["organization/company", "organization/branches", "organization/users"]) {
    await expect(call(path), 401);
    await expect(call(path, "GET", undefined, "", true), 401);
  }
  await expect(call("organization/ready", "GET", undefined, cookie), 404);
  assert.equal((await call("organization/users", "DELETE", undefined, cookie)).status, 405);
  let company = await expect(call("organization/company", "GET", undefined, cookie), 200);
  await expect(call("organization/company", "PATCH", companyBody(company), cookie, false, { Origin: "https://go.aliproinv.com" }), 403);
  await expect(call("organization/company", "PATCH", { ...companyBody(company), companyId: foreign.id }, cookie), 400);
  await expect(call("organization/company", "PATCH", { ...companyBody(company), documentType: "RUC", taxId: "123" }, cookie), 400);
  await expect(call("organization/company", "PATCH", { ...companyBody(company), timeZone: "America/NoExiste" }, cookie), 400);
  const oldCompany = company;
  company = await expect(call("organization/company", "PATCH", { ...companyBody(company), tradeName: "Transporte CI actualizado" }, cookie), 200);
  assert.equal(company.version, oldCompany.version + 1);
  await expect(call("organization/company", "PATCH", companyBody(oldCompany), cookie), 409);
  assert.equal((await db.company.findUniqueOrThrow({ where: { id: foreign.id } })).legalName, "Ajena CI");
  await expect(call("organization/branches/" + originalBranch.id, "PATCH", { ...branchBody(originalBranch), active: false }, cookie), 409);
  const branchInput = { code: "ARICA", name: "Arica", countryCode: "CL", timeZone: "America/Santiago", address: "Dirección de ensayo", active: true };
  let branch = await expect(call("organization/branches", "POST", branchInput, cookie), 201);
  await expect(call("organization/branches", "POST", branchInput, cookie), 409);
  await expect(call("organization/branches/" + foreignBranch.id, "PATCH", { ...branchInput, version: 1 }, cookie, true), 404);
  branch = await expect(call("organization/branches/" + branch.id, "PATCH", { ...branchBody(branch), name: "Arica internacional" }, cookie), 200);
  await expect(call("organization/branches/" + branch.id, "PATCH", { ...branchBody(branch), version: 1 }, cookie), 409);

  await expect(call("organization/users", "POST", { ...newUser("reader-ci@example.invalid"), password: "corta", confirmation: "corta" }, cookie), 400);
  await expect(call("organization/users", "POST", { ...newUser("reader-ci@example.invalid"), branchIds: [foreignBranch.id] }, cookie), 400);
  await expect(call("organization/users", "POST", { ...newUser("reader-ci@example.invalid"), companyId: foreign.id }, cookie, true), 400);
  let reader = await expect(call("organization/users", "POST", newUser("reader-ci@example.invalid"), cookie), 201);
  await expect(call("organization/users", "POST", newUser("reader-ci@example.invalid"), cookie), 409);
  let readerCookie = await login(reader.user.email);
  let me = await expect(call("auth/me", "GET", undefined, readerCookie), 200);
  assert.equal(me.user.mustChangePassword, true);
  await expect(call("organization/company", "GET", undefined, readerCookie), 403);
  assert.equal((await fetch(web + "/configuracion", { headers: { Cookie: readerCookie }, redirect: "manual" })).headers.get("location"), "/mi-cuenta");
  await expect(call("auth/password", "POST", { currentPassword: "contraseña equivocada", password: personalPassword, confirmation: personalPassword }, readerCookie), 400);
  await expect(call("auth/password", "POST", { currentPassword: password, password: personalPassword, confirmation: personalPassword }, readerCookie), 200);
  await expect(call("auth/me", "GET", undefined, readerCookie), 401);
  readerCookie = await login(reader.user.email, personalPassword);
  me = await expect(call("auth/me", "GET", undefined, readerCookie), 200);
  assert.equal(me.user.mustChangePassword, false);
  await expect(call("organization/company", "GET", undefined, readerCookie), 200);
  const visible = await expect(call("organization/branches", "GET", undefined, readerCookie), 200);
  assert.deepEqual(visible.items.map(b => b.id), [originalBranch.id]);
  for (const direct of [false, true]) {
    await expect(call("organization/company", "PATCH", companyBody(company), readerCookie, direct), 403);
    await expect(call("organization/branches", "POST", branchInput, readerCookie, direct), 403);
    await expect(call("organization/users", "GET", undefined, readerCookie, direct), 403);
    await expect(call("organization/users", "POST", newUser("forbidden-ci@example.invalid", "administrador"), readerCookie, direct), 403);
  }
  reader = await expect(call("organization/users/" + reader.id, "PATCH", memberBody(reader, false), cookie), 200);
  await expect(call("auth/me", "GET", undefined, readerCookie), 401);
  reader = await expect(call("organization/users/" + reader.id, "PATCH", memberBody(reader, true), cookie), 200);
  await expect(call("auth/me", "GET", undefined, readerCookie), 401, "Reactivar no revive sesiones");
  const stale = reader;
  reader = await expect(call("organization/users/" + reader.id, "PATCH", memberBody(reader), cookie), 200);
  await expect(call("organization/users/" + reader.id, "PATCH", memberBody(stale), cookie), 409);
  await expect(call("organization/users/" + reader.id, "PATCH", { ...memberBody(reader), branchIds: [foreignBranch.id] }, cookie, true), 400);
  await expect(call("organization/users/" + reader.id, "PATCH", { ...memberBody(reader), password: "No se permite" }, cookie, true), 400);
  const foreignMember = await db.membership.create({ data: { companyId: foreign.id, userId: reader.user.id } });
  await expect(call("organization/users/" + foreignMember.id, "PATCH", memberBody(foreignMember), cookie, true), 404);
  await db.membership.delete({ where: { id: foreignMember.id } });

  // Dos administradores intentan darse de baja al mismo tiempo. Solo uno puede conseguirlo.
  const second = await expect(call("organization/users", "POST", newUser("second-admin-ci@example.invalid", "administrador"), cookie), 201);
  const initialSecondCookie = await login(second.user.email);
  await expect(call("organization/users/" + admin.id, "PATCH", memberBody(await db.membership.findUniqueOrThrow({ where: { id: admin.id } }), false, "administrador"), cookie), 409);
  await expect(call("auth/password", "POST", { currentPassword: password, password: personalPassword, confirmation: personalPassword }, initialSecondCookie), 200);
  const secondCookie = await login(second.user.email, personalPassword);
  const currentAdmin = await db.membership.findUniqueOrThrow({ where: { id: admin.id } });
  const concurrent = await Promise.all([
    call("organization/users/" + admin.id, "PATCH", memberBody(currentAdmin, false, "administrador"), cookie),
    call("organization/users/" + second.id, "PATCH", memberBody(second, false, "administrador"), secondCookie),
  ]);
  assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 409]);
  const rootActive = (await db.membership.findUniqueOrThrow({ where: { id: admin.id } })).active;
  if (!rootActive) {
    const disabled = await db.membership.findUniqueOrThrow({ where: { id: admin.id } });
    await expect(call("organization/users/" + admin.id, "PATCH", memberBody(disabled, true, "administrador"), secondCookie), 200);
    cookie = await login();
  }
  await expect(call("organization/users/" + admin.id, "PATCH", { ...memberBody(await db.membership.findUniqueOrThrow({ where: { id: admin.id } })), role: "propietario-global" }, cookie), 400);

  // Sin OFFSET ni conteo total: recorrer un conjunto mayor que una página sin duplicados.
  for (let i = 0; i < 22; i++) await db.branch.create({ data: { companyId: setup.companyId, code: "PAGE" + i, name: "Paginada " + i, countryCode: "PE", timeZone: "America/Lima" } });
  const first = await expect(call("organization/branches?q=Paginada", "GET", undefined, cookie), 200);
  assert.equal(first.items.length, 20); assert.ok(first.next);
  const next = await expect(call("organization/branches?q=Paginada&after=" + first.next, "GET", undefined, cookie), 200);
  assert.equal(next.items.length, 2); assert.equal(next.next, null);
  assert.equal(new Set([...first.items, ...next.items].map(b => b.id)).size, 22);
  for (let i = 0; i < 22; i++) {
    const fixture = await db.user.create({ data: { email: "page" + i + "@example.invalid", displayName: "ListadoCI " + i } });
    await db.membership.create({ data: { companyId: setup.companyId, userId: fixture.id } });
  }
  const usersFirst = await expect(call("organization/users?q=ListadoCI", "GET", undefined, cookie), 200);
  const usersNext = await expect(call("organization/users?q=ListadoCI&after=" + usersFirst.next, "GET", undefined, cookie), 200);
  assert.equal(usersFirst.items.length, 20); assert.equal(usersNext.items.length, 2);
  assert.equal(new Set([...usersFirst.items, ...usersNext.items].map(m => m.id)).size, 22);
  await expect(call("organization/branches?after=invalid", "GET", undefined, cookie), 400);
  await expect(call("organization/branches?take=10000", "GET", undefined, cookie), 400);
  await expect(call("organization/branches?q=%25", "GET", undefined, cookie), 400);
  const settings = await fetch(web + "/configuracion", { headers: { Cookie: cookie } });
  assert.equal(settings.status, 200);
  assert.ok((await settings.text()).includes("Tu empresa"));
  await stop();
  stop = await start(root + "apps/api/dist/main.js", apiEnv, api + "/api/v1/health", t);
  assert.equal((await expect(call("organization/company", "GET", undefined, cookie), 200)).tradeName, "Transporte CI actualizado");
  const audits = await db.auditEvent.findMany({ where: { companyId: setup.companyId } });
  for (const action of ["company.updated", "branch.created", "branch.updated", "user.created", "user.password_changed", "user.access_updated", "user.deactivated"]) {
    assert.ok(audits.some(row => row.action === action), action);
  }
  assert.ok(!JSON.stringify(audits, (_, v) => typeof v === "bigint" ? v.toString() : v).includes(personalPassword));
  assert.equal((await db.user.findUniqueOrThrow({ where: { id: adminUser.id } })).passwordHash, adminUser.passwordHash);
  await db.branch.delete({ where: { id: foreignBranch.id } });
  await db.company.delete({ where: { id: foreign.id } });
});

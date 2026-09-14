import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { createDatabase, databaseConfig } from "../apps/api/dist/database/client.js";

// Estos ensayos escriben exclusivamente en el MySQL desechable de CI.
if (process.env.LARAMS_TEST_DATABASE !== "1" || process.env.LARAMS_DB_PORT !== "33306") {
  throw new Error("test:db requiere LARAMS_TEST_DATABASE=1 y el servidor de prueba en 33306.");
}
assert.equal(new URL(databaseConfig().url).port, "33306");

test("MySQL real: relaciones, unicidad, transacciones y permisos", { timeout: 45000 }, async (t) => {
  const db = createDatabase();
  t.after(() => db.$disconnect());
  const rollback = new Error("Revertir únicamente los datos del ensayo");
  const ids = [];
  await assert.rejects(db.$transaction(async (tx) => {
    const company = () => tx.company.create({ data: {
      legalName: "Ensayo CI " + randomUUID(), countryCode: "PE",
      currencyCode: "PEN", timeZone: "America/Lima",
    } });
    const [a, b] = await Promise.all([company(), company()]);
    ids.push(a.id, b.id);
    const user = await tx.user.create({ data: { email: randomUUID() + "@example.invalid", displayName: "Ensayo" } });
    assert.equal(user.active, false, "No habilitar cuentas sin alta explícita");
    assert.equal(user.passwordHash, null);
    const membership = await tx.membership.create({ data: { companyId: a.id, userId: user.id } });
    const branchData = { code: "TACNA", name: "Ensayo", countryCode: "PE", timeZone: "America/Lima" };
    const local = await tx.branch.create({ data: { ...branchData, companyId: a.id } });
    const foreign = await tx.branch.create({ data: { ...branchData, companyId: b.id } });
    const ownRole = await tx.role.create({ data: { companyId: a.id, code: "operador", name: "Operador" } });
    const otherRole = await tx.role.create({ data: { companyId: b.id, code: "operador", name: "Operador" } });

    await tx.branchAccess.create({ data: { companyId: a.id, membershipId: membership.id, branchId: local.id } });
    await tx.userRole.create({ data: { companyId: a.id, membershipId: membership.id, roleId: ownRole.id } });
    await assert.rejects(tx.branchAccess.create({ data: { companyId: a.id, membershipId: membership.id, branchId: foreign.id } }), { code: "P2003" });
    await assert.rejects(tx.userRole.create({ data: { companyId: a.id, membershipId: membership.id, roleId: otherRole.id } }), { code: "P2003" });
    await assert.rejects(tx.session.create({ data: {
      companyId: b.id, membershipId: membership.id, tokenHash: randomBytes(32).toString("hex"), expiresAt: new Date(Date.now() + 60000),
    } }), { code: "P2003" });
    await assert.rejects(tx.auditEvent.create({ data: {
      companyId: b.id, actorMembershipId: membership.id, action: "test", entityType: "test",
    } }), { code: "P2003" });
    await assert.rejects(tx.branch.create({ data: { ...branchData, companyId: a.id } }), { code: "P2002" });
    await assert.rejects(tx.company.delete({ where: { id: a.id } }), { code: "P2003" });
    await tx.auditEvent.create({ data: {
      companyId: a.id, actorMembershipId: membership.id, action: "test", entityType: "company", entityId: a.id,
    } });
    assert.equal(await tx.branch.count({ where: { companyId: a.id } }), 1);
    throw rollback;
  }, { timeout: 20000 }), (error) => error === rollback);
  assert.equal(await db.company.count({ where: { id: { in: ids } } }), 0, "La transacción no deja datos de ensayo");

  const denied = (error) => /denied|1142|1044/i.test(error.message);
  await assert.rejects(db.$executeRawUnsafe("CREATE TABLE larams_erp.forbidden_ddl (id INT)"), denied);
  await assert.rejects(db.$queryRawUnsafe("SELECT value FROM larams_sentinel_ci.marker"), denied);
  // El guion bajo del GRANT no debe autorizar accidentalmente laramsXerp.
  await assert.rejects(db.$queryRawUnsafe("SELECT value FROM laramsXerp.marker"), denied);
  const result = await db.$queryRawUnsafe("SELECT 1 AS healthy");
  assert.equal(Number(result[0].healthy), 1);
});

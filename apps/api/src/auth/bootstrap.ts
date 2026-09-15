import { PrismaClient } from "../generated/prisma/client";
import { emailAddress, permissions } from "./policy";
import { hashPassword } from "./password";

type InitialAdmin = { email: string; password: string; displayName: string; companyName: string };

export async function bootstrapStatus(db: PrismaClient) {
  const record = await db.bootstrap.findUnique({ where: { id: 1 }, include: { user: { select: { email: true } } } });
  return record ? { configured: true, email: record.user.email } : { configured: false };
}

export async function createInitialAdmin(db: PrismaClient, input: InitialAdmin) {
  const email = emailAddress(input.email);
  if (!email || typeof input.displayName !== "string" || typeof input.companyName !== "string"
      || !input.displayName.trim() || input.displayName.trim().length > 160
      || !input.companyName.trim() || input.companyName.trim().length > 200) {
    throw new Error("Revisa el correo, nombre y empresa.");
  }
  const existing = await bootstrapStatus(db);
  if (existing.configured) {
    if (existing.email !== email) throw new Error("Ya existe otro administrador inicial. No se modifica.");
    return { status: "already-configured" };
  }
  const passwordHash = await hashPassword(input.password);
  try {
    return await db.$transaction(async tx => {
      if (await tx.user.count() || await tx.company.count()) {
        throw new Error("La instalación contiene datos previos sin un alta inicial identificada. No se adoptan.");
      }
      const company = await tx.company.create({ data: { legalName: input.companyName.trim(),
        countryCode: "PE", currencyCode: "PEN", timeZone: "America/Lima" } });
      const branch = await tx.branch.create({ data: { companyId: company.id, code: "TACNA",
        name: "Tacna", countryCode: "PE", timeZone: "America/Lima" } });
      const user = await tx.user.create({ data: { email, displayName: input.displayName.trim(), passwordHash, active: true } });
      // La clave única evita dos altas iniciales aun con comandos concurrentes.
      await tx.bootstrap.create({ data: { id: 1, companyId: company.id, userId: user.id } });
      const member = await tx.membership.create({ data: { companyId: company.id, userId: user.id } });
      const role = await tx.role.create({ data: { companyId: company.id, code: "administrador", name: "Administrador" } });
      for (const [code, description] of Object.entries(permissions)) {
        await tx.permission.upsert({ where: { code }, create: { code, description }, update: {} });
        await tx.rolePermission.create({ data: { companyId: company.id, roleId: role.id, permissionCode: code } });
      }
      await tx.userRole.create({ data: { companyId: company.id, membershipId: member.id, roleId: role.id } });
      const reader = await tx.role.create({ data: { companyId: company.id, code: "consulta", name: "Consulta" } });
      await tx.rolePermission.createMany({ data: ["company.read", "branches.read"].map(permissionCode =>
        ({ companyId: company.id, roleId: reader.id, permissionCode })) });
      await tx.branchAccess.create({ data: { companyId: company.id, membershipId: member.id, branchId: branch.id } });
      await tx.auditEvent.create({ data: { companyId: company.id, actorMembershipId: member.id,
        action: "system.bootstrap", entityType: "user", entityId: user.id } });
      return { status: "created" };
    }, { timeout: 15000 });
  } catch (error) {
    const current = await bootstrapStatus(db);
    if (current.configured && current.email === email) return { status: "already-configured" };
    throw error;
  }
}

import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { AuthContext, emailAddress } from "../auth/policy";
import { hashPassword, validPassword } from "../auth/password";
import { accessData, active, branchData, companyData, fields, id, page, pageQuery, text, version } from "./validation";
import { audit, organizationWrite, sameVersion, Tx } from "./transaction";

const companySelect = { id: true, version: true, legalName: true, tradeName: true, countryCode: true,
  documentType: true, taxId: true, currencyCode: true, timeZone: true } as const;
const branchSelect = { id: true, version: true, code: true, name: true, countryCode: true, timeZone: true,
  address: true, active: true } as const;
const memberSelect = { id: true, version: true, active: true,
  user: { select: { id: true, email: true, displayName: true, active: true, mustChangePassword: true } },
  roles: { select: { role: { select: { code: true, name: true } } } },
  branches: { select: { branch: { select: branchSelect } } } } as const;

@Injectable()
export class OrganizationService {
  private hashing = 0;
  constructor(private readonly database: DatabaseService) {}

  company(auth: AuthContext) {
    return this.database.client.company.findUniqueOrThrow({ where: { id: auth.companyId }, select: companySelect });
  }
  updateCompany(auth: AuthContext, input: unknown) {
    const { version: expected, ...data } = companyData(input);
    return organizationWrite(this.database.client, auth, "company.write", async tx => {
      const before = await tx.company.findUniqueOrThrow({ where: { id: auth.companyId }, select: companySelect });
      sameVersion(before.version, expected);
      const result = await tx.company.update({ where: { id: auth.companyId }, data: { ...data, version: { increment: 1 } }, select: companySelect });
      await audit(tx, auth, "company.updated", "company", auth.companyId, before, result);
      return result;
    });
  }
  async branches(auth: AuthContext, query: unknown) {
    const { after, q } = pageQuery(query);
    const canManage = auth.permissions.includes("branches.write");
    return page(await this.database.client.branch.findMany({
      where: { companyId: auth.companyId, ...(after ? { id: { gt: after } } : {}),
        ...(canManage ? {} : { active: true, accesses: { some: { membershipId: auth.membershipId } } }),
        ...(q ? { OR: [{ name: { startsWith: q } }, { code: { startsWith: q } }] } : {}) },
      orderBy: { id: "asc" }, take: 21, select: branchSelect,
    }));
  }
  createBranch(auth: AuthContext, input: unknown) {
    const { version: unused, ...data } = branchData(input);
    return organizationWrite(this.database.client, auth, "branches.write", async tx => {
      const result = await tx.branch.create({ data: { ...data, companyId: auth.companyId }, select: branchSelect });
      if (await tx.branchAccess.count({ where: { membershipId: auth.membershipId } }) < 50) {
        await tx.branchAccess.create({ data: { companyId: auth.companyId, branchId: result.id, membershipId: auth.membershipId } });
        // La asignación automática también invalida un editor de accesos abierto anteriormente.
        await tx.membership.update({ where: { id: auth.membershipId }, data: { version: { increment: 1 } } });
      }
      await audit(tx, auth, "branch.created", "branch", result.id, undefined, result);
      return result;
    });
  }
  updateBranch(auth: AuthContext, branchId: string, input: unknown) {
    id(branchId);
    const { version: expected, ...data } = branchData(input, true);
    return organizationWrite(this.database.client, auth, "branches.write", async tx => {
      const before = await tx.branch.findFirst({ where: { id: branchId, companyId: auth.companyId }, select: branchSelect });
      if (!before) throw new NotFoundException("Sucursal no encontrada.");
      sameVersion(before.version, expected!);
      if (before.active && !data.active && !await tx.branch.findFirst({
        where: { companyId: auth.companyId, active: true, id: { not: branchId } }, select: { id: true },
      })) throw new ConflictException("Debe conservarse al menos una sucursal activa.");
      const result = await tx.branch.update({ where: { id: branchId }, data: { ...data, version: { increment: 1 } }, select: branchSelect });
      await audit(tx, auth, data.active ? "branch.updated" : "branch.deactivated", "branch", branchId, before, result);
      return result;
    });
  }
  async users(auth: AuthContext, query: unknown) {
    const { after, q } = pageQuery(query);
    return page(await this.database.client.membership.findMany({
      where: { companyId: auth.companyId, ...(after ? { id: { gt: after } } : {}),
        ...(q ? { user: { OR: [{ email: { startsWith: q } }, { displayName: { startsWith: q } }] } } : {}) },
      orderBy: { id: "asc" }, take: 21, select: memberSelect,
    }));
  }
  private async branchesAllowed(tx: Tx, auth: AuthContext, branchIds: string[], enabled: boolean) {
    const found = await tx.branch.findMany({ where: { companyId: auth.companyId, id: { in: branchIds } }, select: { active: true } });
    if (found.length !== branchIds.length) throw new BadRequestException("Las sucursales deben pertenecer a tu empresa.");
    if (enabled && !found.some(b => b.active)) throw new BadRequestException("Asigna al menos una sucursal activa.");
  }
  private async assign(tx: Tx, auth: AuthContext, membershipId: string, roleCode: string, branchIds: string[]) {
    const role = await tx.role.findUnique({ where: { companyId_code: { companyId: auth.companyId, code: roleCode } } });
    if (!role) throw new ConflictException("El perfil todavía no está configurado.");
    await tx.userRole.deleteMany({ where: { companyId: auth.companyId, membershipId } });
    await tx.userRole.create({ data: { companyId: auth.companyId, membershipId, roleId: role.id } });
    await tx.branchAccess.deleteMany({ where: { companyId: auth.companyId, membershipId } });
    await tx.branchAccess.createMany({ data: branchIds.map(branchId => ({ companyId: auth.companyId, membershipId, branchId })) });
  }
  async createUser(auth: AuthContext, input: unknown) {
    const row = fields(input, ["email", "displayName", "password", "confirmation", "role", "branchIds"]);
    const email = emailAddress(row.email);
    const displayName = text(row.displayName, "el nombre", 160);
    const access = accessData(row);
    if (!email) throw new BadRequestException("Correo inválido.");
    if (!validPassword(row.password) || row.password !== row.confirmation) {
      throw new BadRequestException("Las contraseñas deben coincidir y tener de 15 a 128 caracteres.");
    }
    if (this.hashing >= 2) throw new HttpException("Espera un momento antes de crear otro usuario.", 429);
    this.hashing++;
    try {
      const passwordHash = await hashPassword(row.password);
      return await organizationWrite(this.database.client, auth, "users.write", async tx => {
        await this.branchesAllowed(tx, auth, access.branchIds, true);
        // No adoptar por correo una identidad que pueda pertenecer a otra empresa.
        const user = await tx.user.create({ data: { email, displayName, passwordHash, active: true, mustChangePassword: true } });
        const member = await tx.membership.create({ data: { companyId: auth.companyId, userId: user.id } });
        await this.assign(tx, auth, member.id, access.role, access.branchIds);
        const result = await tx.membership.findUniqueOrThrow({ where: { id: member.id }, select: memberSelect });
        await audit(tx, auth, "user.created", "membership", member.id, undefined, result);
        return result;
      });
    } finally { this.hashing--; }
  }
  updateUser(auth: AuthContext, membershipId: string, input: unknown) {
    id(membershipId);
    const row = fields(input, ["version", "active", "role", "branchIds"]);
    const expected = version(row.version);
    const enabled = active(row.active);
    const access = accessData(row);
    return organizationWrite(this.database.client, auth, "users.write", async tx => {
      const before = await tx.membership.findFirst({ where: { id: membershipId, companyId: auth.companyId }, select: memberSelect });
      if (!before) throw new NotFoundException("Usuario no encontrado.");
      sameVersion(before.version, expected);
      await this.branchesAllowed(tx, auth, access.branchIds, enabled);
      if (!enabled || access.role !== "administrador") {
        const remaining = await tx.membership.findFirst({ where: {
          companyId: auth.companyId, id: { not: membershipId }, active: true,
          user: { active: true, mustChangePassword: false, passwordHash: { not: null } },
          roles: { some: { role: { permissions: { some: { permissionCode: "users.write" } } } } },
        }, select: { id: true } });
        if (!remaining) throw new ConflictException("Debe quedar un administrador activo que ya haya cambiado su contraseña inicial.");
      }
      await this.assign(tx, auth, membershipId, access.role, access.branchIds);
      const result = await tx.membership.update({ where: { id: membershipId },
        data: { active: enabled, version: { increment: 1 } }, select: memberSelect });
      // Incluso si se vuelve a activar, una sesión anterior no recupera su acceso.
      await tx.session.updateMany({ where: { companyId: auth.companyId, membershipId, revokedAt: null }, data: { revokedAt: new Date() } });
      await audit(tx, auth, enabled ? "user.access_updated" : "user.deactivated", "membership", membershipId, before, result);
      return result;
    });
  }
}

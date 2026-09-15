import { ConflictException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { Prisma, PrismaClient } from "../generated/prisma/client";
import type { AuthContext } from "../auth/policy";

export type Tx = Prisma.TransactionClient;
export async function organizationWrite<T>(db: PrismaClient, auth: AuthContext, permission: string | null,
  action: (tx: Tx) => Promise<T>): Promise<T> {
  try {
    return await db.$transaction(async tx => {
      // Una fila por empresa serializa las escrituras administrativas, incluida la baja del último administrador.
      // ReadCommitted y revalidación tras obtener el bloqueo evitan usar permisos anteriores a otra transacción.
      await tx.$queryRawUnsafe("SELECT id FROM companies WHERE id=? FOR UPDATE", auth.companyId);
      const current = await tx.session.findFirst({ where: { id: auth.sessionId, companyId: auth.companyId,
        revokedAt: null, expiresAt: { gt: new Date() }, membership: { id: auth.membershipId, active: true,
          company: { active: true }, user: { id: auth.userId, active: true } } },
        include: { membership: { include: { user: true, roles: { include: { role: { include: { permissions: true } } } } } } } });
      if (!current) throw new UnauthorizedException("La sesión terminó. Vuelve a ingresar.");
      if (permission && (current.membership.user.mustChangePassword ||
          !current.membership.roles.some(r => r.role.permissions.some(p => p.permissionCode === permission)))) {
        throw new ForbiddenException("No tienes permiso para esta operación.");
      }
      return action(tx);
    }, { isolationLevel: "ReadCommitted", maxWait: 5000, timeout: 10000 });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "P2002") throw new ConflictException("Ya existe un registro con ese correo, documento o código.");
    if (code === "P2034") throw new ConflictException("Otra operación está modificando estos datos. Vuelve a intentar.");
    throw error;
  }
}
export function audit(tx: Tx, auth: AuthContext, action: string, entityType: string, entityId: string) {
  return tx.auditEvent.create({ data: { companyId: auth.companyId, actorMembershipId: auth.membershipId,
    action, entityType, entityId } });
}
export function sameVersion(actual: number, expected: number) {
  if (actual !== expected) throw new ConflictException("Otra persona modificó este registro. Vuelve a cargarlo antes de guardar.");
}

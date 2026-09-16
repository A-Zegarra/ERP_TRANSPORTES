import { BadRequestException, ConflictException, HttpException, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { DatabaseService } from "../database/database.service";
import { AuthContext, emailAddress, sessionSeconds, sessionToken } from "./policy";
import { hashPassword, validPassword, verifyPassword } from "./password";
import { fields } from "../organization/validation";
import { audit, organizationWrite } from "../organization/transaction";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const blocked = () => new HttpException("Demasiados intentos. Espera unos minutos y vuelve a intentar.", 429);

@Injectable()
export class AuthService {
  private inFlight = 0;
  private window = { ends: 0, attempts: 0 };
  constructor(private readonly database: DatabaseService) {}

  private async throttle(email: string) {
    const db = this.database.client;
    const key = digest(email);
    const row = await db.$transaction(async tx => {
      // SQL constante con parámetro enlazado; el incremento es atómico entre procesos.
      await tx.$executeRawUnsafe(
        "INSERT INTO auth_throttles (`key`,attempts,resetAt) VALUES (?,1,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE)) "
        + "ON DUPLICATE KEY UPDATE attempts=IF(resetAt<=UTC_TIMESTAMP(3),1,attempts+1), "
        + "resetAt=IF(resetAt<=UTC_TIMESTAMP(3),DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 15 MINUTE),resetAt)", key);
      return tx.authThrottle.findUniqueOrThrow({ where: { key } });
    });
    await db.$executeRawUnsafe("DELETE FROM auth_throttles WHERE resetAt < DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 DAY) LIMIT 100");
    if (row.attempts > 8) throw blocked();
  }

  async login(input: unknown): Promise<string> {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new BadRequestException("Datos de ingreso inválidos.");
    const values = input as Record<string, unknown>;
    const email = emailAddress(values.email);
    if (!email || typeof values.password !== "string" || values.password.length === 0
        || Array.from(values.password).length > 128 || Buffer.byteLength(values.password) > 512
        || Object.keys(values).some(key => !["email", "password"].includes(key))) {
      throw new BadRequestException("Revisa el correo y la contraseña.");
    }
    const now = Date.now();
    if (this.window.ends <= now) this.window = { ends: now + 60000, attempts: 0 };
    if (this.inFlight >= 2 || this.window.attempts >= 60) throw blocked();
    this.window.attempts++;
    this.inFlight++;
    try {
      await this.throttle(email);
      const db = this.database.client;
      const user = await db.user.findUnique({
        where: { email }, include: { memberships: { where: { active: true, company: { active: true } },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }], take: 1 } },
      });
      const matches = await verifyPassword(values.password, user?.passwordHash ?? null);
      const membership = user?.memberships[0];
      if (!matches || !user?.active || !membership) {
        if (membership) await db.auditEvent.create({ data: {
          companyId: membership.companyId, actorMembershipId: membership.id,
          action: "auth.login_failed", entityType: "user", entityId: user!.id,
          actorName: user!.displayName,
        } });
        throw new UnauthorizedException("Correo o contraseña incorrectos.");
      }
      const token = randomBytes(32).toString("base64url");
      await db.$transaction(async tx => {
        await tx.$queryRawUnsafe("SELECT id FROM companies WHERE id=? FOR UPDATE", membership.companyId);
        await tx.$queryRawUnsafe("SELECT id FROM users WHERE id=? FOR UPDATE", user.id);
        // Revalidar el estado después del cálculo de contraseña.
        const eligible = await tx.membership.findFirst({ where: {
          id: membership.id, active: true, company: { active: true },
          user: { active: true, passwordHash: user.passwordHash },
        } });
        if (!eligible) throw new UnauthorizedException("Correo o contraseña incorrectos.");
        const session = await tx.session.create({ data: {
          companyId: membership.companyId, membershipId: membership.id,
          tokenHash: digest(token), expiresAt: new Date(Date.now() + sessionSeconds * 1000),
        } });
        await tx.auditEvent.create({ data: {
          companyId: membership.companyId, actorMembershipId: membership.id,
          action: "auth.login", entityType: "session", entityId: session.id,
          actorName: user.displayName,
        } });
      }, { isolationLevel: "ReadCommitted" });
      return token;
    } finally { this.inFlight--; }
  }

  async authenticate(cookie: string | undefined): Promise<AuthContext> {
    const token = sessionToken(cookie);
    if (!token) throw new UnauthorizedException("Inicia sesión para continuar.");
    const session = await this.database.client.session.findUnique({
      where: { tokenHash: digest(token) }, include: { membership: { include: {
        user: true, company: true, branches: { where: { branch: { active: true } }, include: { branch: true } },
        roles: { include: { role: { include: { permissions: true } } } },
      } } },
    });
    const member = session?.membership;
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()
        || !member?.active || !member.user.active || !member.company.active) {
      throw new UnauthorizedException("La sesión terminó. Vuelve a ingresar.");
    }
    return {
      sessionId: session.id, membershipId: member.id, companyId: member.companyId, userId: member.userId,
      expiresAt: session.expiresAt, email: member.user.email, displayName: member.user.displayName,
      companyName: member.company.legalName,
      mustChangePassword: member.user.mustChangePassword,
      permissions: [...new Set(member.roles.flatMap(item => item.role.permissions.map(p => p.permissionCode)))].sort(),
      branches: member.branches.map(item => ({ id: item.branch.id, name: item.branch.name })),
    };
  }

  async logout(auth: AuthContext) {
    await this.database.client.$transaction(async tx => {
      await tx.session.updateMany({ where: { id: auth.sessionId, companyId: auth.companyId, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.auditEvent.create({ data: {
        companyId: auth.companyId, actorMembershipId: auth.membershipId,
        action: "auth.logout", entityType: "session", entityId: auth.sessionId,
        actorName: auth.displayName,
      } });
    });
  }

  async changePassword(auth: AuthContext, input: unknown) {
    const row = fields(input, ["currentPassword", "password", "confirmation"]);
    if (typeof row.currentPassword !== "string" || Buffer.byteLength(row.currentPassword) > 512
        || !validPassword(row.password) || row.password !== row.confirmation || row.password === row.currentPassword) {
      throw new BadRequestException("Revisa la contraseña actual y repite una nueva de 15 a 128 caracteres.");
    }
    if (this.inFlight >= 2) throw blocked();
    this.inFlight++;
    try {
      await this.throttle(auth.email);
      const user = await this.database.client.user.findUniqueOrThrow({ where: { id: auth.userId } });
      if (!await verifyPassword(row.currentPassword, user.passwordHash)) {
        throw new BadRequestException("La contraseña actual no es correcta.");
      }
      const passwordHash = await hashPassword(row.password);
      await organizationWrite(this.database.client, auth, null, async tx => {
        const changed = await tx.user.updateMany({ where: { id: auth.userId, passwordHash: user.passwordHash },
          data: { passwordHash, mustChangePassword: false } });
        if (changed.count !== 1) throw new ConflictException("La contraseña cambió durante la operación. Vuelve a ingresar.");
        await tx.session.updateMany({ where: { membership: { userId: auth.userId }, revokedAt: null }, data: { revokedAt: new Date() } });
        await audit(tx, auth, "user.password_changed", "user", auth.userId);
      });
    } finally { this.inFlight--; }
  }
}

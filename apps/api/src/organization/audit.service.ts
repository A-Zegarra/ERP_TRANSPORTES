import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { AuthContext } from "../auth/policy";
import { fields } from "./validation";
import type { Prisma } from "../generated/prisma/client";

const invalid = (): never => { throw new BadRequestException("Revisa las fechas, la acción y la página solicitada."); };
function date(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)) return invalid();
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) return invalid();
  return parsed;
}
function eventId(value: unknown) {
  if (typeof value !== "string" || !/^[1-9]\d{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) return invalid();
  return BigInt(value);
}
const select = { id: true, action: true, entityType: true, entityId: true, actorName: true, createdAt: true,
  actor: { select: { user: { select: { displayName: true } } } } } as const;
function view<T extends { id: bigint; action: string; actorName: string | null; actor: { user: { displayName: string } } | null }>(row: T) {
  const { actor, ...data } = row;
  const name = row.actorName ?? actor?.user.displayName ?? "Sistema / sin actor";
  return { ...data, id: row.id.toString(), actorName: row.action === "auth.login_failed" ? "Cuenta del intento: " + name : name };
}
@Injectable()
export class AuditService {
  constructor(private readonly database: DatabaseService) {}
  async list(auth: AuthContext, query: unknown) {
    const row = fields(query, ["after", "from", "to", "action"]);
    const to = row.to === undefined ? new Date() : date(row.to);
    const from = row.from === undefined ? new Date(to.getTime() - 30 * 86400000) : date(row.from);
    if (from >= to || to.getTime() - from.getTime() > 90 * 86400000) return invalid();
    if (row.action !== undefined && (typeof row.action !== "string" || !/^[a-z][a-z._]{0,79}$/.test(row.action))) return invalid();
    let cursor: Prisma.AuditEventWhereInput = {};
    if (row.after !== undefined) {
      if (typeof row.after !== "string" || row.after.length > 200 || !/^[A-Za-z0-9_-]+$/.test(row.after)) return invalid();
      try {
        const parsed = JSON.parse(Buffer.from(row.after, "base64url").toString("utf8"));
        const createdAt = date(parsed.at), id = eventId(parsed.id);
        cursor = { OR: [{ createdAt: { lt: createdAt } }, { createdAt, id: { lt: id } }] };
      } catch { return invalid(); }
    }
    const rows = await this.database.client.auditEvent.findMany({
      where: { companyId: auth.companyId, createdAt: { gte: from, lt: to },
        ...(row.action ? { action: row.action as string } : {}), ...cursor },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 21, select,
    });
    const last = rows[19];
    return { items: rows.slice(0, 20).map(view), next: rows.length > 20 && last
      ? Buffer.from(JSON.stringify({ at: last.createdAt.toISOString(), id: last.id.toString() })).toString("base64url") : null };
  }
  async detail(auth: AuthContext, id: string) {
    const row = await this.database.client.auditEvent.findFirst({ where: { id: eventId(id), companyId: auth.companyId },
      select: { ...select, beforeJson: true, afterJson: true } });
    if (!row) throw new NotFoundException("Registro no encontrado.");
    return view(row);
  }
}

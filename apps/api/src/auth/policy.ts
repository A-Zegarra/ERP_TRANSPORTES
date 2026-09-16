import { SetMetadata } from "@nestjs/common";
import type { IncomingMessage } from "node:http";

export const policyKey = "larams:access";
export const Public = () => SetMetadata(policyKey, "public");
export const Authenticated = () => SetMetadata(policyKey, "authenticated");
export const Requires = (permission: string) => SetMetadata(policyKey, permission);
export const permissions = {
  "company.read": "Consultar datos de empresa",
  "company.write": "Editar datos de empresa",
  "branches.read": "Consultar sucursales asignadas",
  "branches.write": "Administrar sucursales",
  "users.read": "Consultar usuarios de la empresa",
  "users.write": "Administrar accesos de usuarios",
  "branding.write": "Personalizar identidad visual",
  "audit.read": "Consultar auditoría de la empresa",
} as const;

export type AuthContext = {
  sessionId: string; membershipId: string; companyId: string; userId: string;
  expiresAt: Date; email: string; displayName: string; companyName: string;
  permissions: string[]; branches: { id: string; name: string }[];
  mustChangePassword: boolean;
};
export type AuthRequest = IncomingMessage & { body: unknown; auth?: AuthContext };
export type AuthResponse = { setHeader(name: string, value: string): unknown; status(code: number): AuthResponse; json(body: unknown): unknown };

export function appOrigin(): string {
  const value = process.env.LARAMS_ORIGIN ?? (process.env.NODE_ENV === "production"
    ? "https://larams.aliproinv.com" : "http://127.0.0.1:3100");
  const url = new URL(value);
  if (url.origin !== value || (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "127.0.0.1"))) {
    throw new Error("Origen de LARAMS inválido.");
  }
  return value;
}

export const sessionCookieName = () => appOrigin().startsWith("https:") ? "__Host-larams_session" : "larams_dev_session";
export const sessionSeconds = 8 * 60 * 60;
export function sessionCookie(token: string, expires = false): string {
  return sessionCookieName() + "=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age="
    + (expires ? 0 : sessionSeconds) + (appOrigin().startsWith("https:") ? "; Secure" : "");
}
export function sessionToken(header: string | undefined): string | null {
  const values = (header ?? "").split(";").map(part => part.trim())
    .filter(part => part.startsWith(sessionCookieName() + "="));
  if (values.length !== 1) return null;
  const token = values[0]!.slice(sessionCookieName().length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}
export function emailAddress(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  return email.length <= 254 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/.test(email)
    ? email : null;
}

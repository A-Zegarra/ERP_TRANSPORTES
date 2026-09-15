export type Company = { id: string; version: number; legalName: string; tradeName: string | null; countryCode: string;
  documentType: string | null; taxId: string | null; currencyCode: string; timeZone: string };
export type Branch = { id: string; version: number; code: string; name: string; countryCode: string;
  timeZone: string; address: string | null; active: boolean };
export type Member = { id: string; version: number; active: boolean;
  user: { id: string; email: string; displayName: string; active: boolean; mustChangePassword: boolean };
  roles: { role: { code: string; name: string } }[]; branches: { branch: Branch }[] };
export type Page<T> = { items: T[]; next: string | null };
export const countries = { PE: "Perú", CL: "Chile", BO: "Bolivia", EC: "Ecuador", AR: "Argentina",
  BR: "Brasil", PY: "Paraguay", UY: "Uruguay", CO: "Colombia" };
export const currencies = ["PEN", "USD", "CLP", "BOB", "ARS", "BRL", "PYG", "UYU", "COP"];
export const timeZones = ["America/Lima", "America/Santiago", "America/La_Paz", "America/Guayaquil",
  "America/Argentina/Buenos_Aires", "America/Sao_Paulo", "America/Asuncion", "America/Montevideo", "America/Bogota"];
export async function request<T>(path: string, method = "GET", data?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/api/" + path, { method, credentials: "same-origin", cache: "no-store",
    headers: data === undefined ? {} : { "Content-Type": "application/json", "X-Larams-Intent": "1" },
    body: data === undefined ? undefined : JSON.stringify(data), signal: signal ?? AbortSignal.timeout(15000) });
  if (response.status === 401) {
    throw new Error("La sesión terminó. Vuelve a ingresar.");
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? "No se pudo completar la operación.");
  return result;
}
export const errorMessage = (error: unknown) => error instanceof Error ? error.message : "No se pudo conectar. Vuelve a intentar.";
export function searchPath(resource: string, after: string | null, q: string) {
  const query = new URLSearchParams();
  if (after) query.set("after", after);
  if (q) query.set("q", q);
  return "organization/" + resource + (query.size ? "?" + query.toString() : "");
}

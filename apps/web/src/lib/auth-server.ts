import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export function origin() {
  const value = process.env.LARAMS_ORIGIN ?? (process.env.NODE_ENV === "production"
    ? "https://larams.aliproinv.com" : "http://127.0.0.1:3100");
  const url = new URL(value);
  if (url.origin !== value || (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "127.0.0.1"))) {
    throw new Error("Origen de LARAMS inválido.");
  }
  return value;
}
const cookieName = () => origin().startsWith("https:") ? "__Host-larams_session" : "larams_dev_session";
function apiUrl(path: string) {
  const port = Number(process.env.LARAMS_API_PORT ?? "3101");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("API local no configurada.");
  return "http://127.0.0.1:" + port + "/api/v1/" + path;
}
function ownCookie(header: string | null) {
  const values = (header ?? "").split(";").map(part => part.trim()).filter(part => part.startsWith(cookieName() + "="));
  return values.length === 1 && /^[A-Za-z0-9_-]{43}$/.test(values[0]!.slice(cookieName().length + 1)) ? values[0]! : "";
}
const json = (message: string, status: number) => NextResponse.json({ message }, { status, headers: { "Cache-Control": "no-store" } });

export async function forwardAuth(request: NextRequest, action: string) {
  const methods: Record<string, string> = { login: "POST", logout: "POST", me: "GET", password: "POST" };
  // Allowlist explícita; no publicar un proxy abierto hacia la API local.
  if (!Object.hasOwn(methods, action)) return json("Ruta no disponible.", 404);
  if (request.method !== methods[action]) return json("Método no permitido.", 405);
  return forward(request, "auth/" + action, action !== "me");
}

export async function forwardOrganization(request: NextRequest, parts: string[]) {
  const [resource, id] = parts;
  const methods = resource === "company" && parts.length === 1 ? ["GET", "PATCH"]
    : resource === "branding" && parts.length === 1 ? ["GET", "PATCH"]
    : resource === "branding" && parts.length === 2 && ["logo", "remove-logo"].includes(id ?? "") ? ["POST"]
    : resource === "audit" && (parts.length === 1 || (parts.length === 2 && /^[1-9]\d{0,18}$/.test(id ?? ""))) ? ["GET"]
    : (resource === "branches" || resource === "users") && parts.length === 1 ? ["GET", "POST"]
    : (resource === "branches" || resource === "users") && parts.length === 2
      && /^[0-9a-f-]{36}$/i.test(id ?? "") ? ["PATCH"] : [];
  if (!methods.length) return json("Ruta no disponible.", 404);
  if (!methods.includes(request.method)) return json("Método no permitido.", 405);
  const query = request.nextUrl.searchParams;
  const allowed = resource === "audit" ? ["after", "from", "to", "action"] : ["after", "q"];
  if ([...query.keys()].some(key => !allowed.includes(key) || query.getAll(key).length !== 1)
      || query.toString().length > 600) return json("Búsqueda inválida.", 400);
  return forward(request, "organization/" + parts.join("/") + (query.size ? "?" + query.toString() : ""), false,
    resource === "branding" && id === "logo" ? 1400 * 1024 : 4096);
}

export async function forwardBranding(request: NextRequest, logo = false) {
  if (request.method !== "GET") return json("Método no permitido.", 405);
  if (!logo) return forward(request, "branding", false);
  try {
    const response = await fetch(apiUrl("branding/logo"), { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(7000) });
    if (!response.ok) return json("Logo no disponible.", response.status);
    if (response.headers.get("content-type") !== "image/webp") return json("Logo no disponible.", 503);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 256 * 1024) return json("Logo no disponible.", 503);
    return new NextResponse(bytes, { headers: { "Content-Type": "image/webp", "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff" } });
  } catch { return json("Logo no disponible.", 503); }
}

async function forward(request: NextRequest, path: string, setsCookie: boolean, maxBody = 4096) {
  try {
    let body: string | undefined;
    if (request.method !== "GET") {
      if (request.headers.get("origin") !== origin() || request.headers.get("x-larams-intent") !== "1"
          || request.headers.get("sec-fetch-site") === "cross-site"
          || request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json") {
        return json("Solicitud no permitida.", 403);
      }
      const reader = request.body?.getReader();
      if (!reader) return json("Solicitud inválida.", 400);
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (true) {
        const item = await reader.read();
        if (item.done) break;
        length += item.value.byteLength;
        if (length > maxBody) { await reader.cancel(); return json("Solicitud demasiado grande.", 413); }
        chunks.push(item.value);
      }
      body = Buffer.concat(chunks).toString("utf8");
    }
    const headers: Record<string, string> = { cookie: ownCookie(request.headers.get("cookie")) };
    if (body !== undefined) Object.assign(headers, { "Content-Type": "application/json", Origin: origin(), "X-Larams-Intent": "1" });
    const response = await fetch(apiUrl(path), {
      method: request.method, headers, body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    });
    const outgoing = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store", Vary: "Cookie" });
    const cookie = response.headers.get("set-cookie");
    if (cookie && setsCookie) outgoing.set("Set-Cookie", cookie);
    if (response.status === 429) outgoing.set("Retry-After", "900");
    return new NextResponse(await response.text(), { status: response.status, headers: outgoing });
  } catch {
    return json("Servicio temporalmente no disponible. Vuelve a intentar.", 503);
  }
}

export type SessionView = {
  user: { id: string; email: string; displayName: string; mustChangePassword: boolean };
  company: { id: string; name: string }; permissions: string[];
  branches: { id: string; name: string }[]; session: { expiresAt: string };
};
export async function currentSession(): Promise<SessionView | null> {
  const jar = await cookies();
  const matching = jar.getAll(cookieName());
  if (matching.length !== 1 || !/^[A-Za-z0-9_-]{43}$/.test(matching[0]!.value)) return null;
  const response = await fetch(apiUrl("auth/me"), {
    headers: { cookie: cookieName() + "=" + matching[0]!.value },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(7000),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("No se pudo comprobar la sesión.");
  return response.json();
}

import { BadRequestException } from "@nestjs/common";

const invalid = (message: string): never => { throw new BadRequestException(message); };
export function fields(input: unknown, names: string[]) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return invalid("Datos inválidos.");
  const row = input as Record<string, unknown>;
  if (Object.keys(row).some(key => !names.includes(key))) return invalid("La solicitud contiene campos no permitidos.");
  return row;
}
export function text(value: unknown, label: string, max: number): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    return invalid("Revisa " + label + ".");
  }
  return value.trim();
}
export function optional(value: unknown, label: string, max: number) {
  return value === "" || value === null ? null : text(value, label, max);
}
export function id(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    return invalid("Identificador inválido.");
  }
  return value;
}
export function version(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) return invalid("Vuelve a cargar el registro.");
  return value;
}
export function active(value: unknown): boolean {
  if (typeof value !== "boolean") return invalid("Estado inválido.");
  return value;
}
export function country(value: unknown) {
  const code = text(value, "el país", 2);
  if (!["PE", "CL", "BO", "EC", "AR", "BR", "PY", "UY", "CO"].includes(code)) return invalid("País no disponible.");
  return code;
}
export function zone(value: unknown) {
  const name = text(value, "la zona horaria", 64);
  if (!name.startsWith("America/")) return invalid("Selecciona una zona horaria de América.");
  try { new Intl.DateTimeFormat("es", { timeZone: name }); } catch { return invalid("Zona horaria inválida."); }
  return name;
}
export function companyData(input: unknown) {
  const row = fields(input, ["version", "legalName", "tradeName", "countryCode", "documentType", "taxId", "currencyCode", "timeZone"]);
  const countryCode = country(row.countryCode);
  const documentType = optional(row.documentType, "el tipo de documento", 20);
  const taxId = optional(row.taxId, "el número de documento", 32);
  if (Boolean(documentType) !== Boolean(taxId)) return invalid("Completa el tipo y número de documento, o deja ambos vacíos.");
  if (countryCode === "PE" && documentType && (documentType !== "RUC" || !/^\d{11}$/.test(taxId!))) {
    return invalid("Para Perú, selecciona RUC e ingresa sus 11 dígitos.");
  }
  const currencyCode = text(row.currencyCode, "la moneda", 3);
  if (!["PEN", "USD", "CLP", "BOB", "ARS", "BRL", "PYG", "UYU", "COP"].includes(currencyCode)) return invalid("Moneda no disponible.");
  return { version: version(row.version), legalName: text(row.legalName, "la razón social", 200),
    tradeName: optional(row.tradeName, "el nombre comercial", 200), countryCode, documentType, taxId,
    currencyCode, timeZone: zone(row.timeZone) };
}
export function branchData(input: unknown, updating = false) {
  const row = fields(input, ["code", "name", "countryCode", "timeZone", "address", "active", ...(updating ? ["version"] : [])]);
  const code = text(row.code, "el código", 20).toUpperCase();
  if (!/^[A-Z0-9_-]+$/.test(code)) return invalid("El código admite letras, números, guion y guion bajo.");
  return { code, name: text(row.name, "el nombre", 160), countryCode: country(row.countryCode),
    timeZone: zone(row.timeZone), address: optional(row.address, "la dirección", 250), active: active(row.active),
    ...(updating ? { version: version(row.version) } : {}) };
}
export function accessData(row: Record<string, unknown>) {
  if (row.role !== "administrador" && row.role !== "consulta") return invalid("Perfil no disponible.");
  if (!Array.isArray(row.branchIds) || row.branchIds.length < 1 || row.branchIds.length > 50) {
    return invalid("Asigna entre 1 y 50 sucursales.");
  }
  const branchIds = row.branchIds.map(id);
  if (new Set(branchIds).size !== branchIds.length) return invalid("Hay sucursales repetidas.");
  return { role: row.role, branchIds };
}
export function pageQuery(input: unknown) {
  const row = fields(input, ["after", "q"]);
  // Búsqueda literal por prefijo; impedir comodines SQL enviados como texto.
  const q = row.q === undefined || row.q === "" ? "" : text(row.q, "la búsqueda", 80);
  if (/[%_\\]/.test(q)) return invalid("La búsqueda no admite %, _ ni barra invertida.");
  return { after: row.after === undefined ? undefined : id(row.after), q };
}
export function page<T extends { id: string }>(rows: T[]) {
  return { items: rows.slice(0, 20), next: rows.length > 20 ? rows[19]!.id : null };
}

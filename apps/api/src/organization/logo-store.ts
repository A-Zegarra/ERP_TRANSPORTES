import { BadRequestException, ConflictException, ServiceUnavailableException } from "@nestjs/common";
import { constants } from "node:fs";
import { lstat, mkdir, open, readdir, link, unlink } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";

const maxInput = 1024 * 1024;
export const maxLogo = 256 * 1024;
const sha = (data: Buffer) => createHash("sha256").update(data).digest("hex");
let processing = false;

export async function normalizeLogo(value: unknown): Promise<Buffer> {
  if (typeof value !== "string" || value.length > Math.ceil(maxInput / 3) * 4 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new BadRequestException("Selecciona un PNG, JPEG o WebP de hasta 1 MiB.");
  }
  const input = Buffer.from(value, "base64");
  const png = input.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = input[0] === 255 && input[1] === 216 && input[2] === 255;
  const webp = input.toString("ascii", 0, 4) === "RIFF" && input.toString("ascii", 8, 12) === "WEBP";
  if (input.length > maxInput || !(png || jpeg || webp)) throw new BadRequestException("Formato de imagen no permitido.");
  if (processing) throw new ServiceUnavailableException("Se está procesando otro logo. Vuelve a intentar.");
  processing = true;
  try {
    const image = sharp(input, { limitInputPixels: 16_777_216, failOn: "warning", sequentialRead: true });
    const meta = await image.metadata();
    if (!meta.width || !meta.height || meta.width > 4096 || meta.height > 4096 || (meta.pages ?? 1) !== 1 ||
        !["png", "jpeg", "webp"].includes(meta.format ?? "")) throw new Error("Formato inválido");
    const result = await image.rotate().resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 }).toBuffer();
    if (result.length > maxLogo) throw new Error("Imagen demasiado compleja");
    return result;
  } catch {
    throw new BadRequestException("La imagen debe ser estática, válida y de hasta 4096 × 4096 píxeles.");
  } finally { processing = false; }
}

async function privateDirectory(path: string, create: boolean) {
  if (create) await mkdir(path, { mode: 0o700 }).catch(error => { if (error.code !== "EEXIST") throw error; });
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid?.() || (stat.mode & 0o077)) {
    throw new ServiceUnavailableException("El directorio de logos requiere permisos privados.");
  }
}
async function directory(companyId: string, create: boolean) {
  if (!/^[0-9a-f-]{36}$/i.test(companyId)) throw new Error("Empresa inválida");
  const env = process.env.LARAMS_ENV_FILE;
  if (!env || !isAbsolute(env)) throw new ServiceUnavailableException("El almacenamiento de logos no está configurado.");
  const shared = dirname(env);
  await privateDirectory(shared, false);
  const root = join(shared, "logos");
  await privateDirectory(root, create);
  const target = join(root, companyId);
  await privateDirectory(target, create);
  return target;
}
export async function saveLogo(companyId: string, bytes: Buffer): Promise<string> {
  const folder = await directory(companyId, true);
  const hash = sha(bytes);
  // Objetos inmutables: conservar los anteriores permite restaurar respaldos SQL y revertir código.
  const names = await readdir(folder);
  if (!names.includes(hash + ".webp") && names.length >= 512) {
    throw new ConflictException("Se alcanzó el límite de versiones del logo. Solicita el mantenimiento de respaldos.");
  }
  const temporary = join(folder, ".pending-" + randomUUID());
  let file;
  try {
    file = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
    await file.writeFile(bytes);
    await file.sync();
    await file.close(); file = undefined;
    // Publicación atómica sin sobreescribir objetos existentes.
    await link(temporary, join(folder, hash + ".webp"));
    const directoryHandle = await open(folder, constants.O_RDONLY | constants.O_DIRECTORY);
    try { await directoryHandle.sync(); } finally { await directoryHandle.close(); }
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "EEXIST")) throw error;
    const existing = await readLogo(companyId, hash);
    if (!existing.equals(bytes)) throw new ServiceUnavailableException("No se pudo verificar el logo existente.");
  } finally { await file?.close(); await unlink(temporary).catch(() => {}); }
  return hash;
}
export async function readLogo(companyId: string, hash: string): Promise<Buffer> {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("Logo inválido");
  const folder = await directory(companyId, false);
  const file = await open(join(folder, hash + ".webp"), constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.uid !== process.getuid?.() || (stat.mode & 0o077) || stat.size > maxLogo) throw new Error("Logo inválido");
    const bytes = await file.readFile();
    if (sha(bytes) !== hash) throw new Error("Logo dañado");
    return bytes;
  } finally { await file.close(); }
}

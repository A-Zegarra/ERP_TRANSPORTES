import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const parameters = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const prefix = "scrypt$32768$8$3";

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, parameters, (error, key) => error ? reject(error) : resolve(key));
  });
}

export function validPassword(value: unknown): value is string {
  return typeof value === "string" && Array.from(value).length >= 15
    && Array.from(value).length <= 128 && Buffer.byteLength(value, "utf8") <= 512;
}

export async function hashPassword(password: string): Promise<string> {
  if (!validPassword(password)) throw new Error("La contraseña debe tener entre 15 y 128 caracteres.");
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return [prefix, salt.toString("hex"), key.toString("hex")].join("$");
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  const matches = stored?.match(/^scrypt\$32768\$8\$3\$([a-f0-9]{32})\$([a-f0-9]{128})$/);
  // También se ejecuta scrypt para correos inexistentes o hashes no reconocidos.
  const salt = Buffer.from(matches?.[1] ?? "c8df340e349b5dfb930c2ad44334af01", "hex");
  const expected = Buffer.from(matches?.[2] ?? "00".repeat(64), "hex");
  const actual = await derive(password, salt);
  return timingSafeEqual(actual, expected) && Boolean(matches);
}

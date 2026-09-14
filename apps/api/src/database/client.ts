import { lstatSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

export function databaseConfig(): { url: string; poolSize: number } {
  let source: Record<string, string | undefined> = process.env;
  const file = process.env.LARAMS_ENV_FILE;
  if (file) {
    const stat = lstatSync(file);
    if (!stat.isFile() || (stat.mode & 0o077) !== 0 || stat.uid !== process.getuid?.()) {
      throw new Error("El archivo de conexión debe pertenecer al usuario del servicio y tener permisos 600.");
    }
    // El archivo propio tiene prioridad sobre variables heredadas del daemon PM2.
    source = parseEnv(readFileSync(file, "utf8"));
  }
  const url = source.DATABASE_URL;
  const poolSize = Number(source.DB_POOL_SIZE ?? "5");
  if (!url || !Number.isInteger(poolSize) || poolSize < 1 || poolSize > 10) {
    throw new Error("Falta la conexión MySQL de LARAMS o su límite de conexiones no es válido.");
  }
  return { url, poolSize };
}

export function createDatabase(options = databaseConfig()): PrismaClient {
  if (!Number.isInteger(options.poolSize) || options.poolSize < 1 || options.poolSize > 10) {
    throw new Error("Límite de conexiones MySQL inválido.");
  }
  let address: URL;
  try { address = new URL(options.url); }
  catch { throw new Error("La conexión MySQL tiene un formato incorrecto."); }
  if (address.protocol !== "mysql:" || address.hostname !== "127.0.0.1"
      || !address.username || !address.password || address.pathname !== "/larams_erp") {
    throw new Error("La conexión debe apuntar a la base local exclusiva larams_erp.");
  }
  const port = Number(address.port || "3306");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Puerto MySQL inválido.");
  const adapter = new PrismaMariaDb({
    host: address.hostname, port, database: "larams_erp",
    user: decodeURIComponent(address.username), password: decodeURIComponent(address.password),
    connectionLimit: options.poolSize, acquireTimeout: 5000, connectTimeout: 3000,
    // Solo se admite loopback; permite caching_sha2_password después de reiniciar MySQL.
    allowPublicKeyRetrieval: true, socketTimeout: 10000, idleTimeout: 60, timezone: "Z",
  });
  return new PrismaClient({ adapter, log: [], errorFormat: "minimal" });
}

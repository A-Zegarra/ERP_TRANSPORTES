import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // La validación de esquema no necesita una conexión real.
  // Las migraciones exigirán DATABASE_URL explícita en la fase 1.
  ...(process.env.DATABASE_URL
    ? { datasource: { url: process.env.DATABASE_URL } }
    : {}),
});

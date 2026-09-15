import { createDatabase } from "./database/client";
import { bootstrapStatus, createInitialAdmin } from "./auth/bootstrap";

async function main() {
  const db = createDatabase();
  try {
    if (process.argv[2] === "--status") {
      console.log(JSON.stringify(await bootstrapStatus(db)));
      return;
    }
    if (process.argv[2] !== "--create") throw new Error("Acción inválida.");
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > 4096) throw new Error("Entrada demasiado grande.");
      chunks.push(chunk);
    }
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    console.log(JSON.stringify(await createInitialAdmin(db, data)));
  } finally { await db.$disconnect(); }
}
main().catch(() => {
  console.error("No se completó el alta inicial. Verifica la conexión, los datos y que la instalación siga vacía; no se cambian cuentas existentes.");
  process.exitCode = 2;
});

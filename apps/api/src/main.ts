import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const port = Number(process.env.API_PORT ?? "3101");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("API_PORT debe ser un entero entre 1024 y 65535.");
  }
  const app = await NestFactory.create(AppModule);
  app.getHttpAdapter().getInstance().disable("x-powered-by");
  app.setGlobalPrefix("api/v1");
  app.enableShutdownHooks();
  // Fase 0: únicamente salud del proceso. No se publica una API de negocio.
  await app.listen(port, "127.0.0.1");
}

bootstrap().catch(() => {
  console.error("No se pudo iniciar la API. Revisa API_PORT y la disponibilidad del puerto.");
  process.exitCode = 1;
});

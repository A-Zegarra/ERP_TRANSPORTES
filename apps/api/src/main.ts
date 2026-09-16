import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { appOrigin } from "./auth/policy";
import { ErrorsFilter } from "./auth/errors.filter";
import type { IncomingMessage } from "node:http";

async function bootstrap(): Promise<void> {
  const port = Number(process.env.API_PORT ?? "3101");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("API_PORT debe ser un entero entre 1024 y 65535.");
  }
  appOrigin();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser("json", { limit: "1400kb", strict: true, type: (req: IncomingMessage) =>
    req.url?.split("?")[0] === "/api/v1/organization/branding/logo" &&
    req.headers["content-type"]?.split(";")[0]?.trim() === "application/json" });
  app.useBodyParser("json", { limit: "4kb", strict: true });
  app.useGlobalFilters(new ErrorsFilter());
  app.getHttpAdapter().getInstance().disable("x-powered-by");
  app.setGlobalPrefix("api/v1");
  app.enableShutdownHooks();
  // Autorización global; salud, login e identidad visual publicada son públicos.
  await app.listen(port, "127.0.0.1");
}

bootstrap().catch(() => {
  console.error("No se pudo iniciar la API. Revisa API_PORT y la disponibilidad del puerto.");
  process.exitCode = 1;
});

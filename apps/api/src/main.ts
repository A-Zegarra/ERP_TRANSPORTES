import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { appOrigin } from "./auth/policy";
import { ErrorsFilter } from "./auth/errors.filter";

async function bootstrap(): Promise<void> {
  const port = Number(process.env.API_PORT ?? "3101");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error("API_PORT debe ser un entero entre 1024 y 65535.");
  }
  appOrigin();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser("json", { limit: "4kb", strict: true });
  app.useGlobalFilters(new ErrorsFilter());
  app.getHttpAdapter().getInstance().disable("x-powered-by");
  app.setGlobalPrefix("api/v1");
  app.enableShutdownHooks();
  // Autorización global; solamente salud y login son públicos.
  await app.listen(port, "127.0.0.1");
}

bootstrap().catch(() => {
  console.error("No se pudo iniciar la API. Revisa API_PORT y la disponibilidad del puerto.");
  process.exitCode = 1;
});

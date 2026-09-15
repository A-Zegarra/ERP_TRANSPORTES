import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { AuthResponse } from "./policy";

@Catch()
export class ErrorsFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<AuthResponse>();
    const type = error && typeof error === "object" && "type" in error ? error.type : null;
    const parserStatus = type === "entity.too.large" ? 413 : type === "entity.parse.failed" ? 400 : null;
    const status = error instanceof HttpException ? error.getStatus() : parserStatus ?? 503;
    const message = parserStatus ? "Solicitud inválida o demasiado grande."
      : error instanceof HttpException ? error.message : "Servicio temporalmente no disponible.";
    response.setHeader("Cache-Control", "no-store");
    if (status === 429) response.setHeader("Retry-After", "900");
    response.status(status).json({ statusCode: status, message });
  }
}

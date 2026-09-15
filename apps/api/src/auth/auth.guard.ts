import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { appOrigin, AuthRequest, policyKey } from "./policy";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method ?? "")) {
      if (request.headers.origin !== appOrigin() || request.headers["x-larams-intent"] !== "1"
          || request.headers["sec-fetch-site"] === "cross-site"
          || request.headers["content-type"]?.split(";")[0]?.trim() !== "application/json") {
        throw new ForbiddenException("Solicitud no permitida.");
      }
    }
    const policy = this.reflector.getAllAndOverride<string>(policyKey, [context.getHandler(), context.getClass()]);
    if (policy === "public") return true;
    request.auth = await this.auth.authenticate(request.headers.cookie);
    if (!policy || (policy !== "authenticated" && !request.auth.permissions.includes(policy))) {
      throw new ForbiddenException("No tienes permiso para esta operación.");
    }
    return true;
  }
}

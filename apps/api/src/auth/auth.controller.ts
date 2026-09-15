import { Body, Controller, Get, Header, HttpCode, Post, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { Authenticated, AuthRequest, AuthResponse, Public, sessionCookie } from "./policy";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  async login(@Body() input: unknown, @Res({ passthrough: true }) response: AuthResponse) {
    const token = await this.auth.login(input);
    response.setHeader("Set-Cookie", sessionCookie(token));
    return { status: "ok" };
  }

  @Authenticated()
  @Get("me")
  @Header("Cache-Control", "no-store")
  me(@Req() request: AuthRequest) {
    const auth = request.auth!;
    return { user: { id: auth.userId, email: auth.email, displayName: auth.displayName, mustChangePassword: auth.mustChangePassword },
      company: { id: auth.companyId, name: auth.companyName }, permissions: auth.permissions,
      branches: auth.branches, session: { expiresAt: auth.expiresAt } };
  }

  @Authenticated()
  @Post("password")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  async password(@Req() request: AuthRequest, @Body() input: unknown, @Res({ passthrough: true }) response: AuthResponse) {
    await this.auth.changePassword(request.auth!, input);
    response.setHeader("Set-Cookie", sessionCookie("", true));
    return { status: "ok" };
  }

  @Authenticated()
  @Post("logout")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  async logout(@Req() request: AuthRequest, @Res({ passthrough: true }) response: AuthResponse) {
    await this.auth.logout(request.auth!);
    response.setHeader("Set-Cookie", sessionCookie("", true));
    return { status: "ok" };
  }
}

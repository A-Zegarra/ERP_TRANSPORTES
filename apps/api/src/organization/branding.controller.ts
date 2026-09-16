import { Body, Controller, Get, Header, Param, Patch, Post, Query, Req, StreamableFile } from "@nestjs/common";
import { AuthRequest, Public, Requires } from "../auth/policy";
import { BrandingService } from "./branding.service";
import { AuditService } from "./audit.service";

@Controller()
export class BrandingController {
  constructor(private readonly branding: BrandingService, private readonly audit: AuditService) {}
  @Public() @Get("branding") @Header("Cache-Control", "no-store")
  publicView() { return this.branding.publicView(); }
  @Public() @Get("branding/logo") @Header("Cache-Control", "no-store") @Header("X-Content-Type-Options", "nosniff")
  async logoView() { return new StreamableFile(await this.branding.publicLogo(), { type: "image/webp" }); }
  @Requires("company.read") @Get("organization/branding") @Header("Cache-Control", "no-store")
  get(@Req() req: AuthRequest) { return this.branding.get(req.auth!); }
  @Requires("branding.write") @Patch("organization/branding") @Header("Cache-Control", "no-store")
  update(@Req() req: AuthRequest, @Body() body: unknown) { return this.branding.update(req.auth!, body); }
  @Requires("branding.write") @Post("organization/branding/logo") @Header("Cache-Control", "no-store")
  logo(@Req() req: AuthRequest, @Body() body: unknown) { return this.branding.logo(req.auth!, body); }
  @Requires("branding.write") @Post("organization/branding/remove-logo") @Header("Cache-Control", "no-store")
  remove(@Req() req: AuthRequest, @Body() body: unknown) { return this.branding.logo(req.auth!, body, true); }
  @Requires("audit.read") @Get("organization/audit") @Header("Cache-Control", "no-store")
  list(@Req() req: AuthRequest, @Query() query: unknown) { return this.audit.list(req.auth!, query); }
  @Requires("audit.read") @Get("organization/audit/:id") @Header("Cache-Control", "no-store")
  detail(@Req() req: AuthRequest, @Param("id") id: string) { return this.audit.detail(req.auth!, id); }
}

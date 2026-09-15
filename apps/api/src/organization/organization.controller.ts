import { Body, Controller, Get, Header, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { AuthRequest, Requires } from "../auth/policy";
import { OrganizationService } from "./organization.service";

@Controller("organization")
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @Requires("company.read") @Get("company") @Header("Cache-Control", "no-store")
  company(@Req() req: AuthRequest) { return this.service.company(req.auth!); }
  @Requires("company.write") @Patch("company") @Header("Cache-Control", "no-store")
  updateCompany(@Req() req: AuthRequest, @Body() body: unknown) { return this.service.updateCompany(req.auth!, body); }
  @Requires("branches.read") @Get("branches") @Header("Cache-Control", "no-store")
  branches(@Req() req: AuthRequest, @Query() query: unknown) { return this.service.branches(req.auth!, query); }
  @Requires("branches.write") @Post("branches") @Header("Cache-Control", "no-store")
  createBranch(@Req() req: AuthRequest, @Body() body: unknown) { return this.service.createBranch(req.auth!, body); }
  @Requires("branches.write") @Patch("branches/:id") @Header("Cache-Control", "no-store")
  updateBranch(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: unknown) { return this.service.updateBranch(req.auth!, id, body); }
  @Requires("users.read") @Get("users") @Header("Cache-Control", "no-store")
  users(@Req() req: AuthRequest, @Query() query: unknown) { return this.service.users(req.auth!, query); }
  @Requires("users.write") @Post("users") @Header("Cache-Control", "no-store")
  createUser(@Req() req: AuthRequest, @Body() body: unknown) { return this.service.createUser(req.auth!, body); }
  @Requires("users.write") @Patch("users/:id") @Header("Cache-Control", "no-store")
  updateUser(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: unknown) { return this.service.updateUser(req.auth!, id, body); }
}

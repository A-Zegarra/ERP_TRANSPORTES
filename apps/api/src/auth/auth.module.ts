import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "../database/database.module";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { OrganizationController } from "../organization/organization.controller";
import { OrganizationService } from "../organization/organization.service";

@Module({ imports: [DatabaseModule], controllers: [AuthController, OrganizationController],
  providers: [AuthService, OrganizationService, { provide: APP_GUARD, useClass: AuthGuard }] })
export class AuthModule {}

import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "../database/database.module";
import { AuthController } from "./auth.controller";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { CompanyController } from "./company.controller";

@Module({ imports: [DatabaseModule], controllers: [AuthController, CompanyController],
  providers: [AuthService, { provide: APP_GUARD, useClass: AuthGuard }] })
export class AuthModule {}

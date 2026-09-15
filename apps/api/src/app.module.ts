import { Module } from "@nestjs/common";
import { HealthModule } from "./modules/health/health.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";

@Module({ imports: [HealthModule, DatabaseModule, AuthModule] })
export class AppModule {}

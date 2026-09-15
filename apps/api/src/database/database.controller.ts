import { Controller, Get, Header, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { Public } from "../auth/policy";

@Controller("ready")
@Public()
export class DatabaseController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  async ready() {
    if (!await this.database.ready()) throw new ServiceUnavailableException("Base de datos no disponible.");
    return { status: "ok", service: "larams-api", database: "ok", schemaVersion: 3 };
  }
}

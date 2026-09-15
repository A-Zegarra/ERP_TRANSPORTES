import { Controller, Get, Header, Req } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { AuthRequest, Requires } from "./policy";

@Controller("organization")
export class CompanyController {
  constructor(private readonly database: DatabaseService) {}

  @Requires("company.read")
  @Get("company")
  @Header("Cache-Control", "no-store")
  company(@Req() request: AuthRequest) {
    // El alcance se obtiene de la sesión validada, nunca de un companyId enviado por el cliente.
    return this.database.client.company.findUniqueOrThrow({ where: { id: request.auth!.companyId },
      select: { id: true, legalName: true, tradeName: true, countryCode: true,
        currencyCode: true, timeZone: true } });
  }
}

import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma/client";
import { createDatabase } from "./client";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private connection?: PrismaClient;

  get client(): PrismaClient {
    this.connection ??= createDatabase();
    return this.connection;
  }

  async ready(): Promise<boolean> {
    try {
      // Comprobar una tabla migrada, no únicamente la existencia de un socket.
      await this.client.company.findFirst({ select: { id: true } });
      await this.client.bootstrap.findUnique({ where: { id: 1 }, select: { id: true } });
      await this.client.authThrottle.findFirst({ select: { key: true } });
      return true;
    } catch {
      // No devolver URLs, SQL, nombres de usuario o errores del driver al cliente.
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.connection?.$disconnect();
  }
}

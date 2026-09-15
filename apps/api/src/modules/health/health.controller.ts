import { Controller, Get, Header } from "@nestjs/common";
import { Public } from "../../auth/policy";

@Controller("health")
@Public()
export class HealthController {
  @Get()
  @Header("Cache-Control", "no-store")
  health() {
    // Liveness del proceso; no equivale a comprobar MySQL o integraciones.
    return { status: "ok", service: "larams-api", phase: 0 };
  }
}

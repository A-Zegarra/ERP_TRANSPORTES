import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { AuthContext } from "../auth/policy";
import { fields, text, version } from "./validation";
import { audit, organizationWrite, sameVersion } from "./transaction";
import { normalizeLogo, readLogo, saveLogo } from "./logo-store";

const select = { version: true, displayName: true, slogan: true, primaryColor: true, accentColor: true,
  density: true, logoHash: true } as const;
function color(value: unknown) {
  if (typeof value !== "string" || !/^#[a-f0-9]{6}$/i.test(value)) throw new BadRequestException("Color inválido.");
  const rgb = [1,3,5].map(i => parseInt(value.slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const luminance = rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
  if (1.05 / (luminance + 0.05) < 4.5) throw new BadRequestException("Elige colores más oscuros para que el texto blanco sea legible.");
  return value.toLowerCase();
}
@Injectable()
export class BrandingService {
  constructor(private readonly database: DatabaseService) {}
  get(auth: AuthContext) {
    return this.database.client.branding.findUniqueOrThrow({ where: { companyId: auth.companyId }, select });
  }
  // La instalación publica una identidad por dominio; nunca acepta companyId desde el navegador.
  private async published() {
    const installation = await this.database.client.bootstrap.findUnique({ where: { id: 1 },
      select: { company: { select: { active: true, branding: true } } } });
    const brand = installation?.company.active ? installation.company.branding : null;
    if (!brand) throw new NotFoundException("Identidad no configurada.");
    return brand;
  }
  async publicView() {
    const { displayName, slogan, primaryColor, accentColor, density, logoHash } = await this.published();
    return { displayName, slogan, primaryColor, accentColor, density, logoHash };
  }
  async publicLogo() {
    const brand = await this.published();
    if (!brand.logoHash) throw new NotFoundException("No hay logo.");
    return readLogo(brand.companyId, brand.logoHash);
  }
  update(auth: AuthContext, input: unknown) {
    const row = fields(input, ["version", "displayName", "slogan", "primaryColor", "accentColor", "density"]);
    const expected = version(row.version);
    if (!["comfortable", "compact"].includes(String(row.density))) throw new BadRequestException("Densidad inválida.");
    const data = { displayName: text(row.displayName, "el nombre visible", 200),
      slogan: row.slogan === "" ? "" : text(row.slogan, "el lema", 160),
      primaryColor: color(row.primaryColor), accentColor: color(row.accentColor), density: row.density as string };
    return organizationWrite(this.database.client, auth, "branding.write", async tx => {
      const before = await tx.branding.findUniqueOrThrow({ where: { companyId: auth.companyId }, select });
      sameVersion(before.version, expected);
      const after = await tx.branding.update({ where: { companyId: auth.companyId }, data: { ...data, version: { increment: 1 } }, select });
      await audit(tx, auth, "branding.updated", "branding", auth.companyId, before, after);
      return after;
    });
  }
  async logo(auth: AuthContext, input: unknown, remove = false) {
    const row = fields(input, remove ? ["version"] : ["version", "data"]);
    const expected = version(row.version);
    const bytes = remove ? null : await normalizeLogo(row.data);
    return organizationWrite(this.database.client, auth, "branding.write", async tx => {
      const before = await tx.branding.findUniqueOrThrow({ where: { companyId: auth.companyId }, select });
      sameVersion(before.version, expected);
      const logoHash = bytes ? await saveLogo(auth.companyId, bytes) : null;
      const after = await tx.branding.update({ where: { companyId: auth.companyId },
        data: { logoHash, version: { increment: 1 } }, select });
      await audit(tx, auth, remove ? "branding.logo_removed" : "branding.logo_updated", "branding", auth.companyId,
        { logoHash: before.logoHash }, { logoHash });
      return after;
    });
  }
}

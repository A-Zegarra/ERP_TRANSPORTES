import Link from "next/link";
import { redirect } from "next/navigation";
import { currentSession, type SessionView } from "@/lib/auth-server";
import { Settings } from "@/components/settings";

export const metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  let session: SessionView | null;
  try { session = await currentSession(); }
  catch { return <div className="page-wrap"><h1>No pudimos cargar la configuración</h1>
    <p className="intro">Vuelve a intentar en unos momentos.</p><Link href="/configuracion" className="primary-button">Reintentar</Link></div>; }
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/mi-cuenta");
  if (!session.permissions.includes("company.read")) {
    return <div className="page-wrap"><h1>Acceso restringido</h1><p className="intro">Tu cuenta no tiene permiso para consultar la configuración.</p></div>;
  }
  return <div className="page-wrap"><div className="eyebrow">ADMINISTRACIÓN</div><h1>Tu empresa, <span>organizada.</span></h1>
    <p className="intro">Configura los datos de la empresa, sus sucursales y los accesos de tu equipo.</p>
    <Settings permissions={session.permissions} userId={session.user.id} />
    <p className="detail-note">La personalización de logos y colores se incorporará en la siguiente entrega. La emisión SUNAT tiene su propia fase de implementación.</p>
  </div>;
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { currentSession, type SessionView } from "@/lib/auth-server";
import { LogoutButton } from "@/components/logout-button";

export const metadata = { title: "Mi cuenta" };
export const dynamic = "force-dynamic";
export default async function AccountPage() {
  let session: SessionView | null;
  try { session = await currentSession(); }
  catch {
    return <div className="page-wrap"><h1>No pudimos comprobar tu sesión</h1>
      <p className="intro">El servicio está temporalmente ocupado. Vuelve a intentar en unos momentos.</p>
      <Link className="primary-button" href="/mi-cuenta">Reintentar</Link></div>;
  }
  if (!session) redirect("/login");
  return <div className="page-wrap"><div className="eyebrow">MI CUENTA</div>
    <h1>Hola, <span>{session.user.displayName}.</span></h1>
    <p className="intro">Tu sesión está activa en {session.company.name}.</p>
    <section className="auth-card account-card" aria-label="Datos de tu cuenta">
      <dl className="account-details"><div><dt>Correo</dt><dd>{session.user.email}</dd></div>
        <div><dt>Empresa</dt><dd>{session.company.name}</dd></div>
        <div><dt>Sucursales asignadas</dt><dd>{session.branches.length ? session.branches.map(branch => branch.name).join(", ") : "Sin sucursales asignadas"}</dd></div>
        <div><dt>Acceso habilitado</dt><dd>{session.permissions.includes("company.read") ? "Consultar datos de empresa" : "Cuenta personal"}</dd></div>
      </dl><LogoutButton />
    </section>
    <p className="detail-note">Las funciones de operación se habilitarán conforme avance la implementación.</p>
    <Link className="back-link" href="/implementacion">Ver avance del proyecto →</Link>
  </div>;
}

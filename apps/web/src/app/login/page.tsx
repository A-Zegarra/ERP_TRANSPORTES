import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Ingresar" };
export default function LoginPage() {
  return <div className="page-wrap auth-layout">
    <section className="auth-intro"><div className="eyebrow">LARAM’S CARGO INTERNACIONAL</div>
      <h1>Tu equipo.<br /><span>Una operación conectada.</span></h1>
      <p className="intro">Ingresa con tu cuenta para acceder a la empresa y a las áreas asignadas.</p>
      <div className="auth-assurance"><ShieldCheck size={21} aria-hidden="true" /><span>Acceso personal para el equipo de LARAM’S.</span></div>
    </section>
    <section className="auth-card" aria-labelledby="login-title">
      <h2 id="login-title">Bienvenido de nuevo</h2><p className="auth-description">Ingresa tus datos para continuar.</p>
      <LoginForm />
      <p className="auth-help">Si necesitas una cuenta o recuperar el acceso, contacta al administrador.</p>
    </section>
  </div>;
}

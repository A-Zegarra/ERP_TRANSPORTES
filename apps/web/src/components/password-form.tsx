"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, request } from "@/lib/organization";

export function PasswordForm({ required }: { required: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password"));
    if (Array.from(password).length < 15 || Array.from(password).length > 128 || password !== data.get("confirmation")) {
      setError("Repite la misma contraseña, de 15 a 128 caracteres."); return;
    }
    setBusy(true); setError("");
    try {
      await request("auth/password", "POST", { currentPassword: data.get("currentPassword"), password, confirmation: data.get("confirmation") });
      form.reset();
      router.replace("/login?password=changed"); router.refresh();
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <section className="auth-card password-card" aria-label="Cambiar contraseña">
    <h2>{required ? "Define tu contraseña personal" : "Cambiar contraseña"}</h2>
    <p className="auth-description">{required ? "Cambia tu contraseña inicial para habilitar el acceso asignado."
      : "Al guardar, se cerrarán tus sesiones y podrás ingresar con la nueva contraseña."}</p>
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="currentPassword">Contraseña actual</label>
      <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" maxLength={256} required disabled={busy} />
      <label htmlFor="newPassword">Nueva contraseña · 15 a 128 caracteres</label>
      <input id="newPassword" name="password" type="password" autoComplete="new-password" maxLength={256} required disabled={busy} />
      <label htmlFor="confirmation">Repite la nueva contraseña</label>
      <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" maxLength={256} required disabled={busy} />
      {error && <p role="alert" className="auth-error">{error}</p>}
      <button className="primary-button auth-submit" disabled={busy}>{busy ? "Guardando…" : "Guardar y volver a ingresar"}</button>
    </form>
  </section>;
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Larams-Intent": "1" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) });
      if (!response.ok) {
        const result = await response.json();
        setError(result.message ?? "No se pudo iniciar sesión.");
        return;
      }
      form.reset();
      router.replace("/mi-cuenta");
      router.refresh();
    } catch { setError("No se pudo conectar. Revisa tu conexión y vuelve a intentar."); }
    finally { setBusy(false); }
  }
  return <form className="auth-form" onSubmit={submit} aria-busy={busy}>
    <label htmlFor="email">Correo electrónico</label>
    <input id="email" name="email" type="email" autoComplete="username" required maxLength={254}
      placeholder="tu@empresa.com" disabled={busy} autoCapitalize="none" spellCheck={false} />
    <label htmlFor="password">Contraseña</label>
    <div className="password-field">
      <input id="password" name="password" type={visible ? "text" : "password"} autoComplete="current-password"
        required maxLength={256} disabled={busy} />
      <button type="button" className="password-toggle" onClick={() => setVisible(!visible)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible}>
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </div>
    {error && <p role="alert" className="auth-error">{error}</p>}
    <button type="submit" className="primary-button auth-submit" disabled={busy}>
      {busy ? "Ingresando…" : "Ingresar"}<ArrowRight size={17} aria-hidden="true" />
    </button>
  </form>;
}

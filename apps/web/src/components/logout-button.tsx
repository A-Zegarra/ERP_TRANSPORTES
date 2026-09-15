"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json", "X-Larams-Intent": "1" }, body: "{}" });
      if (!response.ok && response.status !== 401) throw new Error();
      router.replace("/login");
      router.refresh();
    } catch { setError("No se pudo cerrar la sesión. Vuelve a intentar."); }
    finally { setBusy(false); }
  }
  return <div><button className="secondary-button" disabled={busy} onClick={logout}>
    {busy ? "Cerrando sesión…" : "Cerrar sesión"}
  </button>{error && <p className="auth-error" role="alert">{error}</p>}</div>;
}

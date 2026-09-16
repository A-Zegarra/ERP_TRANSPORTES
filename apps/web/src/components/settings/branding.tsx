"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { errorMessage, request } from "@/lib/organization";
import { refreshBranding, type Brand } from "../branding";
import { Field, Message } from "./shared";

type Value = Brand & { version: number };
export function BrandingSettings({ canWrite }: { canWrite: boolean }) {
  const [value, setValue] = useState<Value | null>(null);
  const [busy, setBusy] = useState(true);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    request<Value>("organization/branding", "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setValue(result); setBusy(false); setError(""); } })
      .catch(error => { if (!controller.signal.aborted) { setError(errorMessage(error)); setBusy(false); } });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);
  const update = (key: keyof Brand, data: string) => { setValue(v => v ? { ...v, [key]: data } : v); setSuccess(""); };
  async function operation(action: () => Promise<Value>, message: string, resetFile = false) {
    if (busy) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const result = await action();
      // Un cambio de logo no descarta texto o colores todavía sin guardar.
      setValue(previous => resetFile && previous ? { ...previous, version: result.version, logoHash: result.logoHash } : result);
      if (resetFile) { setFile(null); setPreview(""); if (fileInput.current) fileInput.current.value = ""; }
      refreshBranding(); setSuccess(message);
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!value) return;
    const { logoHash: unused, ...data } = value;
    void unused;
    void operation(() => request<Value>("organization/branding", "PATCH", data), "Identidad visual guardada.");
  }
  function choose(selected: File | undefined) {
    setError(""); setSuccess(""); setFile(null); setPreview("");
    if (!selected) return;
    if (selected.size > 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(selected.type)) {
      setError("Selecciona un PNG, JPEG o WebP de hasta 1 MiB.");
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }
  async function upload() {
    if (!file || !value) return;
    await operation(async () => {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return request<Value>("organization/branding/logo", "POST", { version: value.version, data: btoa(binary) });
    }, "Logo guardado.", true);
  }
  return <section className="settings-panel" aria-label="Identidad visual" aria-busy={busy}>
    <div className="panel-heading"><div><h2>Identidad visual</h2><p>Tu marca en la navegación y la pantalla de ingreso.</p></div>
      <button className="secondary-button" disabled={busy} onClick={() => {
        setBusy(true); setSuccess(""); setFile(null); setPreview(""); setRevision(v => v + 1);
        if (fileInput.current) fileInput.current.value = "";
      }}>Recargar datos</button></div>
    <Message error={error} success={success} />
    {busy && !value && <p role="status">Cargando identidad…</p>}
    {value && <>
      <p className="form-help">El nombre, lema, logo y colores serán visibles antes de iniciar sesión. Los datos fiscales se editan en Empresa.</p>
      <form onSubmit={save}><fieldset disabled={busy || !canWrite} className="form-grid">
        <Field label="Nombre visible">{id => <input id={id} required maxLength={200} value={value.displayName} onChange={e => update("displayName", e.target.value)} />}</Field>
        <Field label="Lema (opcional)">{id => <input id={id} maxLength={160} value={value.slogan} onChange={e => update("slogan", e.target.value)} />}</Field>
        <Field label="Color principal">{id => <div className="color-control"><input id={id} type="color" value={value.primaryColor} onChange={e => update("primaryColor", e.target.value)} /><code>{value.primaryColor}</code></div>}</Field>
        <Field label="Color de acento">{id => <div className="color-control"><input id={id} type="color" value={value.accentColor} onChange={e => update("accentColor", e.target.value)} /><code>{value.accentColor}</code></div>}</Field>
        <Field label="Espaciado de tablas">{id => <select id={id} value={value.density} onChange={e => update("density", e.target.value)}>
          <option value="comfortable">Cómodo</option><option value="compact">Compacto</option></select>}</Field>
      </fieldset><p className="form-help">Usa colores oscuros para mantener legible el texto blanco. Los cambios se aplican al guardar.</p>
      <div className="brand-preview" aria-label="Vista previa de colores" style={{ borderColor: value.primaryColor }}>
        <strong>{value.displayName}</strong><span>{value.slogan}</span>
        <span className="preview-swatch" style={{ background: value.primaryColor }}>Principal</span>
        <span className="preview-swatch" style={{ background: value.accentColor }}>Acento</span>
      </div>
      {canWrite && <button className="primary-button" disabled={busy}>Guardar identidad visual</button>}</form>
      <div className="logo-settings"><h3>Logo de empresa</h3>
        {(preview || value.logoHash) ? <Image unoptimized width={180} height={120} className="logo-preview"
          src={preview || "/api/branding/logo?v=" + value.logoHash} alt={preview ? "Logo seleccionado, pendiente de guardar" : "Logo actual"} />
          : <p className="form-help">Todavía no has agregado un logo.</p>}
        {canWrite && <><Field label="Seleccionar logo">{id => <input ref={fileInput} id={id} type="file" disabled={busy}
          accept="image/png,image/jpeg,image/webp" onChange={e => choose(e.target.files?.[0])} />}</Field>
          <p className="form-help">PNG, JPEG o WebP estático · hasta 1 MiB y 4096 × 4096 píxeles. Se adapta conservando sus proporciones.</p>
          {file && <p role="status">Vista previa: {file.name}. Falta guardar el logo.</p>}
          <div className="form-actions"><button className="primary-button" disabled={busy || !file} onClick={upload}>Guardar logo</button>
            <button className="secondary-button" disabled={busy || !value.logoHash} onClick={() => void operation(
              () => request<Value>("organization/branding/remove-logo", "POST", { version: value.version }), "Logo retirado.", true)}>Quitar logo</button></div>
        </>}
      </div>
    </>}
  </section>;
}

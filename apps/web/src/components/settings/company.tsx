"use client";

import { useEffect, useState, type FormEvent } from "react";
import { currencies, errorMessage, request, type Company } from "@/lib/organization";
import { Country, Field, Message, Zone } from "./shared";

export function CompanySettings({ canWrite }: { canWrite: boolean }) {
  const [value, setValue] = useState<Company | null>(null);
  const [busy, setBusy] = useState(true);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    request<Company>("organization/company", "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setValue(result); setError(""); setBusy(false); } })
      .catch(error => { if (!controller.signal.aborted) { setError(errorMessage(error)); setBusy(false); } });
    return () => controller.abort();
  }, [revision]);
  const update = (key: keyof Company, data: string) => { setValue(v => v ? { ...v, [key]: data } : v); setSuccess(""); };
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!value || busy) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      const { id: unused, ...data } = value;
      void unused;
      setValue(await request<Company>("organization/company", "PATCH", data));
      setSuccess("Datos de empresa guardados.");
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <section className="settings-panel" aria-label="Datos de empresa" aria-busy={busy}>
    <div className="panel-heading"><div><h2>Datos de empresa</h2><p>Identidad comercial y preferencias de operación.</p></div>
      <button className="secondary-button" disabled={busy} onClick={() => { setBusy(true); setSuccess(""); setRevision(v => v + 1); }}>Recargar datos</button></div>
    <Message error={error} success={success} />
    {busy && !value && <p role="status">Cargando empresa…</p>}
    {value && <form onSubmit={save}><fieldset disabled={busy || !canWrite} className="form-grid">
      <Field label="Razón social">{id => <input id={id} required maxLength={200} value={value.legalName} onChange={e => update("legalName", e.target.value)} />}</Field>
      <Field label="Nombre comercial (opcional)">{id => <input id={id} maxLength={200} value={value.tradeName ?? ""} onChange={e => update("tradeName", e.target.value)} />}</Field>
      <Country value={value.countryCode} change={v => update("countryCode", v)} />
      <Field label="Tipo de documento (opcional)">{id => <input id={id} maxLength={20} placeholder="RUC" value={value.documentType ?? ""} onChange={e => update("documentType", e.target.value.toUpperCase())} />}</Field>
      <Field label="Número de documento (opcional)">{id => <input id={id} maxLength={32} value={value.taxId ?? ""} onChange={e => update("taxId", e.target.value)} />}</Field>
      <Field label="Moneda de referencia">{id => <select id={id} value={value.currencyCode} onChange={e => update("currencyCode", e.target.value)}>
        {currencies.map(code => <option key={code}>{code}</option>)}</select>}</Field>
      <Zone value={value.timeZone} change={v => update("timeZone", v)} />
    </fieldset><p className="form-help">El documento se guarda como dato de empresa. Su registro no verifica el estado del contribuyente ni habilita la emisión electrónica.</p>
    {canWrite && <button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar empresa"}</button>}
    </form>}
  </section>;
}

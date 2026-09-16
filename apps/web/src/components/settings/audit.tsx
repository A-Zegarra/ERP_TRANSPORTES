"use client";

import { useEffect, useState, type FormEvent } from "react";
import { errorMessage, request, type Page } from "@/lib/organization";
import { Field, Message } from "./shared";

type Event = { id: string; action: string; entityType: string; entityId: string | null; actorName: string; createdAt: string };
type Detail = Event & { beforeJson: Record<string, unknown> | null; afterJson: Record<string, unknown> | null };
const actions: Record<string, string> = { "company.updated": "Empresa actualizada", "branch.created": "Sucursal creada",
  "branch.updated": "Sucursal actualizada", "branch.deactivated": "Sucursal desactivada", "user.created": "Usuario creado",
  "user.access_updated": "Accesos actualizados", "user.deactivated": "Usuario desactivado", "user.password_changed": "Contraseña cambiada",
  "branding.updated": "Identidad visual actualizada", "branding.logo_updated": "Logo actualizado", "branding.logo_removed": "Logo retirado",
  "auth.login": "Inicio de sesión", "auth.logout": "Cierre de sesión", "auth.login_failed": "Intento de ingreso fallido",
  "system.bootstrap": "Alta inicial" };
const labels: Record<string, string> = { version: "Versión", displayName: "Nombre visible", slogan: "Lema",
  primaryColor: "Color principal", accentColor: "Color de acento", density: "Espaciado", logoHash: "Referencia del logo",
  legalName: "Razón social", tradeName: "Nombre comercial", countryCode: "País", documentType: "Tipo de documento",
  taxId: "Documento", currencyCode: "Moneda", timeZone: "Zona horaria", code: "Código", name: "Nombre", address: "Dirección",
  active: "Activo", user: "Usuario", roles: "Perfiles", branches: "Sucursales", id: "Identificador" };
const format = (v: unknown) => v === undefined || v === null ? "—" : typeof v === "boolean" ? (v ? "Sí" : "No")
  : typeof v === "object" ? JSON.stringify(v, null, 2) : String(v);
function localDay(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}
function defaultQuery() {
  const end = new Date(); end.setHours(24, 0, 0, 0);
  const start = new Date(end); start.setDate(start.getDate() - 30);
  return { from: start.toISOString(), to: end.toISOString(), action: "" };
}
export function AuditSettings() {
  const [query, setQuery] = useState(defaultQuery);
  const [from, setFrom] = useState(() => localDay(new Date(query.from)));
  const [to, setTo] = useState(() => localDay(new Date(Date.parse(query.to) - 1)));
  const [action, setAction] = useState("");
  const [history, setHistory] = useState<(string | null)[]>([null]);
  const [result, setResult] = useState<Page<Event> | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const after = history[history.length - 1];
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ from: query.from, to: query.to });
    if (query.action) params.set("action", query.action);
    if (after) params.set("after", after);
    request<Page<Event>>("organization/audit?" + params, "GET", undefined, controller.signal)
      .then(data => { if (!controller.signal.aborted) { setResult(data); setBusy(false); } })
      .catch(error => { if (!controller.signal.aborted) { setError(errorMessage(error)); setBusy(false); } });
    return () => controller.abort();
  }, [query, after]);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    request<Detail>("organization/audit/" + selected, "GET", undefined, controller.signal)
      .then(value => { if (!controller.signal.aborted) setDetail(value); })
      .catch(error => { if (!controller.signal.aborted) setError(errorMessage(error)); });
    return () => controller.abort();
  }, [selected]);
  function apply(event: FormEvent) {
    event.preventDefault();
    const start = new Date(from + "T00:00:00"), end = new Date(to + "T00:00:00");
    end.setDate(end.getDate() + 1);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end ||
        end.getTime() - start.getTime() > 90 * 86400000) { setError("Elige un intervalo válido de hasta 90 días."); return; }
    setBusy(true); setError(""); setDetail(null); setSelected(null); setHistory([null]);
    setQuery({ from: start.toISOString(), to: end.toISOString(), action });
  }
  const fields = detail ? [...new Set([...Object.keys(detail.beforeJson ?? {}), ...Object.keys(detail.afterJson ?? {})])] : [];
  return <section className="settings-panel" aria-label="Auditoría" aria-busy={busy}>
    <div className="panel-heading"><div><h2>Auditoría</h2><p>Quién realizó cada operación y cuándo.</p></div></div>
    <form className="audit-filters" onSubmit={apply}>
      <Field label="Desde">{id => <input id={id} type="date" required value={from} onChange={e => setFrom(e.target.value)} />}</Field>
      <Field label="Hasta">{id => <input id={id} type="date" required value={to} onChange={e => setTo(e.target.value)} />}</Field>
      <Field label="Acción">{id => <select id={id} value={action} onChange={e => setAction(e.target.value)}><option value="">Todas las acciones</option>
        {Object.entries(actions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>}</Field>
      <button className="primary-button" disabled={busy}>Aplicar filtros</button>
    </form>
    <p className="form-help">Fechas y horas según tu dispositivo. Consulta hasta 90 días por búsqueda.</p>
    <Message error={error} success="" />
    {busy && <p role="status">Cargando registros…</p>}
    {!busy && result?.items.length === 0 && <p>No hay registros para estos filtros.</p>}
    {result && result.items.length > 0 && <div className="table-scroll"><table className="settings-table">
      <thead><tr><th>Fecha y hora</th><th>Persona</th><th>Acción</th><th>Detalle</th></tr></thead>
      <tbody>{result.items.map(event => <tr key={event.id}><td>{new Date(event.createdAt).toLocaleString("es-PE")}</td>
        <td>{event.actorName}</td><td>{actions[event.action] ?? event.action}</td><td><button className="text-button" disabled={busy}
          aria-label={"Ver registro " + event.id} onClick={() => { setDetail(null); setSelected(event.id); setError(""); }}>Ver cambios</button></td></tr>)}</tbody>
    </table></div>}
    <div className="pagination"><button className="secondary-button" disabled={busy || history.length === 1} onClick={() => {
      setBusy(true); setError(""); setHistory(h => h.slice(0, -1)); }}>Anterior</button>
      <span>Página {history.length}</span><button className="secondary-button" disabled={busy || !result?.next} onClick={() => {
        setBusy(true); setError(""); setHistory(h => [...h, result!.next]); }}>Siguiente</button></div>
    {selected && !detail && !error && <p role="status">Cargando detalle…</p>}
    {detail && <section className="audit-detail" aria-label="Detalle del registro"><div className="panel-heading">
      <h3>{actions[detail.action] ?? detail.action}</h3><button className="secondary-button" onClick={() => { setSelected(null); setDetail(null); }}>Cerrar detalle</button></div>
      <p>{detail.actorName} · {new Date(detail.createdAt).toLocaleString("es-PE")}</p>
      <p className="form-help">Registro {detail.id} · {detail.entityType} · {detail.entityId}</p>
      {fields.length ? <div className="table-scroll"><table className="settings-table audit-values"><thead><tr><th>Campo</th><th>Antes</th><th>Después</th></tr></thead>
        <tbody>{fields.map(key => <tr key={key}><th>{labels[key] ?? key}</th><td><pre>{format(detail.beforeJson?.[key])}</pre></td>
          <td><pre>{format(detail.afterJson?.[key])}</pre></td></tr>)}</tbody></table></div>
        : <p>Este evento no incluye valores anteriores y posteriores. Los registros previos a esta fase y los eventos de acceso solo conservan la operación.</p>}
    </section>}
  </section>;
}

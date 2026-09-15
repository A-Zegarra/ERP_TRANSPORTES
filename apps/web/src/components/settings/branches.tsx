"use client";

import { useState, type FormEvent } from "react";
import { errorMessage, request, type Branch } from "@/lib/organization";
import { Country, Field, Message, Pager, Search, usePage, Zone } from "./shared";

export function BranchesSettings({ canWrite }: { canWrite: boolean }) {
  const list = usePage<Branch>("branches");
  const [editor, setEditor] = useState<Branch | "new" | null>(null);
  const [success, setSuccess] = useState("");
  return <section className="settings-panel" aria-label="Sucursales">
    <div className="panel-heading"><div><h2>Sucursales</h2><p>{canWrite ? "Organiza las sedes de tu empresa." : "Consulta las sucursales asignadas a tu cuenta."}</p></div>
      {canWrite && <button className="primary-button" onClick={() => { setEditor("new"); setSuccess(""); }}>Nueva sucursal</button>}</div>
    {editor && <BranchEditor key={editor === "new" ? "new" : editor.id + ":" + editor.version} initial={editor === "new" ? null : editor}
      cancel={() => { setEditor(null); list.refresh(); }} saved={() => { setEditor(null); setSuccess("Sucursal guardada."); list.refresh(); }} />}
    <Message error={list.error} success={success} />
    <Search search={list.search} disabled={list.busy} />
    {list.busy ? <p role="status">Cargando sucursales…</p> : list.error ?
      <button className="secondary-button" onClick={list.refresh}>Reintentar</button> :
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Listado de sucursales"><table className="data-table">
        <thead><tr><th>Código / nombre</th><th>Ubicación</th><th>Estado</th>{canWrite && <th>Acción</th>}</tr></thead>
        <tbody>{list.data.items.map(branch => <tr key={branch.id}><td><strong>{branch.name}</strong><small>{branch.code}</small></td>
          <td>{branch.countryCode}<small>{branch.address || branch.timeZone}</small></td><td><span className={branch.active ? "status-pill" : "status-pill inactive"}>{branch.active ? "Activa" : "Inactiva"}</span></td>
          {canWrite && <td><button className="secondary-button" aria-label={"Editar " + branch.name} onClick={() => { setEditor(branch); setSuccess(""); }}>Editar</button></td>}</tr>)}
          {!list.data.items.length && <tr><td colSpan={canWrite ? 4 : 3}>No hay sucursales para esta búsqueda.</td></tr>}</tbody>
      </table></div>}
    <Pager list={list} />
  </section>;
}
function BranchEditor({ initial, cancel, saved }: { initial: Branch | null; cancel: () => void; saved: () => void }) {
  const [value, setValue] = useState(initial ?? { code: "", name: "", countryCode: "PE", timeZone: "America/Lima", address: "", active: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const data = { code: value.code, name: value.name, countryCode: value.countryCode,
        timeZone: value.timeZone, address: value.address, active: value.active, ...(initial ? { version: initial.version } : {}) };
      await request("organization/branches" + (initial ? "/" + initial.id : ""), initial ? "PATCH" : "POST", data);
      saved();
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <form className="record-editor" onSubmit={submit}><h3>{initial ? "Editar sucursal" : "Nueva sucursal"}</h3>
    <fieldset className="form-grid" disabled={busy}>
      <Field label="Código">{id => <input id={id} required maxLength={20} value={value.code} onChange={e => setValue({ ...value, code: e.target.value.toUpperCase() })} />}</Field>
      <Field label="Nombre">{id => <input id={id} required maxLength={160} value={value.name} onChange={e => setValue({ ...value, name: e.target.value })} />}</Field>
      <Country value={value.countryCode} change={countryCode => setValue({ ...value, countryCode })} />
      <Zone value={value.timeZone} change={timeZone => setValue({ ...value, timeZone })} />
      <Field label="Dirección (opcional)">{id => <input id={id} maxLength={250} value={value.address ?? ""} onChange={e => setValue({ ...value, address: e.target.value })} />}</Field>
      <label className="check-label"><input type="checkbox" checked={value.active} onChange={e => setValue({ ...value, active: e.target.checked })} />Sucursal activa</label>
    </fieldset><Message error={error} /><p className="form-help">Una sucursal inactiva conserva su historial y deja de aparecer en el acceso de consulta.</p>
    <div className="form-actions"><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : "Guardar sucursal"}</button>
      <button type="button" className="secondary-button" disabled={busy} onClick={cancel}>Cancelar</button></div>
  </form>;
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessage, request, type Branch, type Member } from "@/lib/organization";
import { Field, Message, Pager, Search, usePage } from "./shared";

export function UsersSettings({ canWrite, userId }: { canWrite: boolean; userId: string }) {
  const router = useRouter();
  const list = usePage<Member>("users");
  const [editor, setEditor] = useState<Member | "new" | null>(null);
  const [success, setSuccess] = useState("");
  return <section className="settings-panel" aria-label="Usuarios y accesos">
    <div className="panel-heading"><div><h2>Usuarios y accesos</h2><p>Define quién puede consultar o administrar la empresa.</p></div>
      {canWrite && <button className="primary-button" onClick={() => { setEditor("new"); setSuccess(""); }}>Nuevo usuario</button>}</div>
    {editor && <UserEditor key={editor === "new" ? "new" : editor.id + ":" + editor.version} initial={editor === "new" ? null : editor}
      cancel={() => { setEditor(null); list.refresh(); }} saved={() => {
        if (editor !== "new" && editor.user.id === userId) { router.replace("/login"); router.refresh(); return; }
        setEditor(null); setSuccess("Acceso guardado. Los cambios de permisos cierran las sesiones anteriores del usuario."); list.refresh();
      }} />}
    <Message error={list.error} success={success} /><Search search={list.search} disabled={list.busy} />
    {list.busy ? <p role="status">Cargando usuarios…</p> : list.error ? <button className="secondary-button" onClick={list.refresh}>Reintentar</button> :
      <div className="table-scroll" tabIndex={0} role="region" aria-label="Listado de usuarios"><table className="data-table">
        <thead><tr><th>Usuario</th><th>Perfil / sucursales</th><th>Estado</th>{canWrite && <th>Acción</th>}</tr></thead>
        <tbody>{list.data.items.map(member => <tr key={member.id}><td><strong>{member.user.displayName}{member.user.id === userId ? " (tú)" : ""}</strong><small>{member.user.email}</small></td>
          <td>{member.roles.map(r => r.role.name).join(", ")}<small>{member.branches.map(b => b.branch.name).join(", ")}</small></td>
          <td><span className={member.active && member.user.active ? "status-pill" : "status-pill inactive"}>{member.active && member.user.active ? "Activo" : "Inactivo"}</span>
            {member.user.mustChangePassword && <small>Contraseña inicial pendiente</small>}</td>
          {canWrite && <td><button className="secondary-button" aria-label={"Editar acceso de " + member.user.displayName} onClick={() => { setEditor(member); setSuccess(""); }}>Editar acceso</button></td>}</tr>)}
          {!list.data.items.length && <tr><td colSpan={canWrite ? 4 : 3}>No hay usuarios para esta búsqueda.</td></tr>}</tbody>
      </table></div>}
    <Pager list={list} />
  </section>;
}
function UserEditor({ initial, cancel, saved }: { initial: Member | null; cancel: () => void; saved: () => void }) {
  const [selected, setSelected] = useState<Branch[]>(initial?.branches.map(b => b.branch) ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [role, setRole] = useState(initial?.roles[0]?.role.code ?? "consulta");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!selected.length || selected.length > 50) { setError("Asigna entre 1 y 50 sucursales."); return; }
    const password = String(data.get("password") ?? "");
    if (!initial && (Array.from(password).length < 15 || Array.from(password).length > 128 || password !== data.get("confirmation"))) {
      setError("Repite la misma contraseña inicial, de 15 a 128 caracteres."); return;
    }
    setBusy(true); setError("");
    try {
      await request("organization/users" + (initial ? "/" + initial.id : ""), initial ? "PATCH" : "POST",
        { role, branchIds: selected.map(b => b.id), ...(initial ? { version: initial.version, active: data.get("active") === "on" } :
          { email: data.get("email"), displayName: data.get("displayName"), password, confirmation: data.get("confirmation") }) });
      form.reset(); saved();
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <form className="record-editor" onSubmit={submit} autoComplete="off">
    <h3>{initial ? "Acceso de " + initial.user.displayName : "Nuevo usuario"}</h3>
    <fieldset disabled={busy}>
      {!initial && <div className="form-grid">
        <Field label="Nombre completo">{id => <input id={id} name="displayName" required maxLength={160} autoComplete="off" />}</Field>
        <Field label="Correo de ingreso">{id => <input id={id} name="email" type="email" required maxLength={254} autoCapitalize="none" spellCheck={false} autoComplete="off" />}</Field>
        <Field label="Contraseña inicial · 15 a 128 caracteres">{id => <input id={id} name="password" type="password" required maxLength={256} autoComplete="new-password" />}</Field>
        <Field label="Repite la contraseña inicial">{id => <input id={id} name="confirmation" type="password" required maxLength={256} autoComplete="new-password" />}</Field>
      </div>}
      <div className="form-grid"><Field label="Perfil">{id => <select id={id} value={role} onChange={e => setRole(e.target.value)}>
        <option value="consulta">Consulta</option><option value="administrador">Administrador</option></select>}</Field>
        {initial && <label className="check-label"><input type="checkbox" name="active" defaultChecked={initial.active} />Acceso activo a esta empresa</label>}</div>
      <p className="form-help">{role === "administrador"
        ? "Administra datos de empresa, todas sus sucursales y los accesos del equipo."
        : "Consulta los datos de empresa y únicamente sus sucursales asignadas. No modifica registros ni ve usuarios."}</p>
      <BranchPicker selected={selected} change={setSelected} />
    </fieldset>
    <Message error={error} />
    <p className="form-help">{initial ? "Guardar cerrará las sesiones anteriores de esta cuenta. La baja conserva el historial."
      : "Entrega la contraseña inicial al usuario por un medio privado. Deberá cambiarla al ingresar; el sistema no envía correos."}</p>
    <div className="form-actions"><button className="primary-button" disabled={busy}>{busy ? "Guardando…" : initial ? "Guardar acceso" : "Crear usuario"}</button>
      <button type="button" className="secondary-button" disabled={busy} onClick={cancel}>Cancelar</button></div>
  </form>;
}
function BranchPicker({ selected, change }: { selected: Branch[]; change: (branches: Branch[]) => void }) {
  const list = usePage<Branch>("branches");
  return <section className="branch-picker" aria-label="Asignar sucursales"><h4>Sucursales asignadas · {selected.length}/50</h4>
    <div className="selected-branches">{selected.map(branch => <button type="button" className="selection-chip" key={branch.id}
      aria-label={"Quitar " + branch.name} onClick={() => change(selected.filter(b => b.id !== branch.id))}>{branch.name} ×</button>)}</div>
    <Search search={list.search} disabled={list.busy} /><Message error={list.error} />
    {list.busy ? <p role="status">Cargando opciones…</p> : list.error ? <button type="button" className="secondary-button" onClick={list.refresh}>Reintentar</button> :
      <div className="branch-options">{list.data.items.map(branch => <label className="check-label" key={branch.id}>
        <input type="checkbox" checked={selected.some(b => b.id === branch.id)}
          disabled={!selected.some(b => b.id === branch.id) && (!branch.active || selected.length >= 50)}
          onChange={e => change(e.target.checked ? [...selected, branch] : selected.filter(b => b.id !== branch.id))} />
        {branch.name} · {branch.code}{branch.active ? "" : " (inactiva)"}</label>)}
        {!list.data.items.length && <p>No hay sucursales para esta búsqueda.</p>}</div>}
    <Pager list={list} />
  </section>;
}

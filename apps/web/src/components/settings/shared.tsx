"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { countries, errorMessage, request, searchPath, timeZones, type Page } from "@/lib/organization";

export function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return <div className="form-field"><label htmlFor={id}>{label}</label>{children(id)}</div>;
}
export function Country({ value, change }: { value: string; change: (value: string) => void }) {
  return <Field label="País">{id => <select id={id} value={value} onChange={event => change(event.target.value)}>
    {Object.entries(countries).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select>}</Field>;
}
export function Zone({ value, change }: { value: string; change: (value: string) => void }) {
  return <Field label="Zona horaria">{id => <select id={id} value={value} onChange={event => change(event.target.value)}>
    {[...new Set([value, ...timeZones])].map(zone => <option key={zone}>{zone}</option>)}</select>}</Field>;
}
export function usePage<T>(resource: string) {
  const [data, setData] = useState<Page<T>>({ items: [], next: null });
  const [after, setAfter] = useState<string | null>(null);
  const [history, setHistory] = useState<(string | null)[]>([]);
  const [q, setQ] = useState("");
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    request<Page<T>>(searchPath(resource, after, q), "GET", undefined, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setData(result); setError(""); setBusy(false); } })
      .catch(error => { if (!controller.signal.aborted) { setError(errorMessage(error)); setBusy(false); } });
    return () => controller.abort();
  }, [resource, after, q, revision]);
  const refresh = () => { setBusy(true); setRevision(value => value + 1); };
  return { data, busy, error, refresh, hasPrevious: history.length > 0,
    search: (value: string) => { setBusy(true); setAfter(null); setHistory([]); setQ(value.trim()); setRevision(v => v + 1); },
    next: () => { if (!data.next) return; setBusy(true); setHistory([...history, after]); setAfter(data.next); },
    previous: () => { if (!history.length) return; setBusy(true); setAfter(history[history.length - 1]!); setHistory(history.slice(0, -1)); },
  };
}
export function Search({ search, disabled }: { search: (query: string) => void; disabled: boolean }) {
  const [value, setValue] = useState("");
  return <div className="list-search"><Field label="Buscar por inicio del nombre o código/correo">{id =>
    <input id={id} type="search" value={value} maxLength={80} onChange={e => setValue(e.target.value)}
      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); search(value); } }} />}</Field>
    <button type="button" className="secondary-button" disabled={disabled} onClick={() => search(value)}>Buscar</button></div>;
}
export function Pager({ list }: { list: Pick<ReturnType<typeof usePage>, "busy" | "hasPrevious" | "data" | "next" | "previous"> }) {
  return <div className="pager"><span>Hasta 20 registros por página</span><div className="form-actions">
    <button type="button" className="secondary-button" disabled={list.busy || !list.hasPrevious} onClick={list.previous}>Anterior</button>
    <button type="button" className="secondary-button" disabled={list.busy || !list.data.next} onClick={list.next}>Siguiente</button>
  </div></div>;
}
export function Message({ error, success }: { error?: string; success?: string }) {
  return <>{error && <p className="auth-error" role="alert">{error}
    {error.includes("La sesión terminó") && <> <Link href="/login">Iniciar sesión →</Link></>}</p>}
    {success && <p className="success-message" role="status">{success}</p>}</>;
}

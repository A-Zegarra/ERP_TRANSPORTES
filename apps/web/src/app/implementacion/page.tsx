import { phases } from "@/lib/modules";

export const metadata = { title: "Plan de implementación" };

export default function ImplementationPage() {
  return <div className="page-wrap"><div className="eyebrow">DESARROLLO CONTROLADO</div>
    <h1>Un avance, una fase.</h1><p className="intro">Cada entrega tendrá un resultado verificable antes de continuar con la siguiente.</p>
    <div className="phase-list">{phases.map((phase) => <section className="phase-row" key={phase.number}>
      <div className="phase-index">{String(phase.number).padStart(2, "0")}</div>
      <div><h2>{phase.name}</h2><p>{phase.result}</p></div>
      <span className={phase.number === 1 ? "phase-state current" : "phase-state"}>{phase.number === 0 ? "Publicada" : phase.number === 1 ? "En desarrollo" : "Planificada"}</span>
    </section>)}</div>
    <p className="detail-note">La web ya está publicada. La fase 1 avanza por entregas: persistencia, acceso de usuarios y configuración de empresa. La configuración tributaria, los dispositivos GPS y las reglas de mantenimiento se definirán con los responsables de cada área.</p>
  </div>;
}

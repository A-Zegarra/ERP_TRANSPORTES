import Link from "next/link";
import { ArrowRight, Route, ShieldCheck, Truck } from "lucide-react";
import { modules } from "@/lib/modules";

export default function HomePage() {
  return <div className="page-wrap">
    <div className="eyebrow">CENTRO DE OPERACIONES</div>
    <section className="hero">
      <div><h1>Cada viaje,<br /><span>bajo control.</span></h1>
        <p>Una operación conectada: desde la primera cotización hasta la entrega y la liquidación del servicio.</p>
        <Link href="/implementacion" className="primary-button">Ver plan de implementación <ArrowRight size={17} aria-hidden="true" /></Link>
      </div>
      <div className="journey-card" aria-label="Ámbito del proyecto">
        <div className="journey-top"><Truck size={28} aria-hidden="true" /><span>TRANSPORTE TERRESTRE</span></div>
        <div className="journey-city"><span className="route-dot" /><div><strong>Tacna</strong><small>Base de operaciones · Perú</small></div></div>
        <div className="journey-line" />
        <div className="journey-city"><span className="route-dot end" /><div><strong>Conexión internacional</strong><small>Chile y países con rutas terrestres</small></div></div>
        <div className="journey-bottom"><Route size={17} aria-hidden="true" />Carga general y refrigerada</div>
      </div>
    </section>
    <section className="notice" aria-label="Estado de la implementación"><ShieldCheck size={22} aria-hidden="true" /><div>
      <strong>La operación comienza con una buena base.</strong>
      <p>El acceso del equipo ya está habilitado. El registro de empresa y las funciones de operación se incorporarán por entregas.</p>
    </div></section>
    <div className="section-heading"><div><span className="eyebrow">ÁREAS DE TRABAJO</span><h2>Todo conectado a tu operación</h2></div><span className="subtle">Implementación por fases</span></div>
    <section className="module-grid" aria-label="Módulos del ERP">{modules.map((module, i) =>
      <Link href={`/${module.slug}`} className="module-card" key={module.slug}>
        <div className="card-top"><span className="module-number">{String(i + 1).padStart(2, "0")}</span><span className="area-tag">{module.area}</span></div>
        <h3>{module.name}</h3><p>{module.description}</p>
        <div className="card-bottom"><span>Alcance de la fase {module.phase}</span><ArrowRight size={17} aria-hidden="true" /></div>
      </Link>)}
    </section>
  </div>;
}

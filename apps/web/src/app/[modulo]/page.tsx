import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, Layers3 } from "lucide-react";
import { modules } from "@/lib/modules";

export const dynamicParams = false;

export function generateStaticParams() {
  return modules.map(({ slug }) => ({ modulo: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo } = await params;
  return { title: modules.find((module) => module.slug === modulo)?.name ?? "Página no encontrada" };
}

export default async function ModulePage({ params }: { params: Promise<{ modulo: string }> }) {
  const { modulo } = await params;
  const projectModule = modules.find((item) => item.slug === modulo);
  if (!projectModule) notFound();
  return <div className="page-wrap module-detail">
    <Link href="/" className="back-link"><ArrowLeft size={16} aria-hidden="true" />Centro de operaciones</Link>
    <div className="eyebrow">{projectModule.area}</div><h1>{projectModule.name}</h1>
    <p className="intro">{projectModule.description}</p>
    <section className="detail-panel"><div className="panel-icon"><Layers3 size={28} aria-hidden="true" /></div>
      <span className="area-tag">Planificado · Fase {projectModule.phase}</span>
      <h2>Alcance previsto</h2>
      <ul className="scope-list">{projectModule.scope.map((item) => <li key={item}><CircleCheck size={19} aria-hidden="true" /><span>{item}</span></li>)}</ul>
      <p className="detail-note">El módulo todavía no permite registrar ni modificar datos. Su implementación seguirá los criterios definidos en el plan.</p>
      <Link href="/implementacion" className="primary-button">Consultar las fases</Link>
    </section>
  </div>;
}

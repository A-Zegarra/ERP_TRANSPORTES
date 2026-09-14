import Link from "next/link";

export default function NotFound() {
  return <div className="page-wrap"><div className="eyebrow">404</div><h1>Página no encontrada</h1><p className="intro">La dirección no corresponde a un módulo del sistema.</p><Link className="primary-button" href="/">Volver al inicio</Link></div>;
}

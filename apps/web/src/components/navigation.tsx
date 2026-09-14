"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Building2, ClipboardList, Home, MapPin, Package, Settings2, Truck, Users, Wallet, Wrench } from "lucide-react";

const items = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/cotizaciones", label: "Cotizaciones", icon: ClipboardList },
  { href: "/viajes", label: "Viajes y operaciones", icon: Truck },
  { href: "/flota", label: "Flota y llantas", icon: Truck },
  { href: "/taller", label: "Taller", icon: Wrench },
  { href: "/almacen", label: "Compras y almacén", icon: Package },
  { href: "/personas", label: "Personas y empresas", icon: Users },
  { href: "/finanzas", label: "Finanzas y SUNAT", icon: Wallet },
  { href: "/seguimiento", label: "GPS y seguimiento", icon: MapPin },
  { href: "/configuracion", label: "Configuración", icon: Settings2 },
];

export function Navigation() {
  const pathname = usePathname();
  return <>
    <Link href="/" className="brand" aria-label="LARAM'S, inicio">
      <span className="brand-icon"><Building2 size={23} aria-hidden="true" /></span>
      <span><strong>LARAM’S</strong><small>CARGO INTERNACIONAL</small></span>
    </Link>
    <nav aria-label="Navegación principal" className="navigation">
      {items.map(({ href, label, icon: Icon }) => <Link key={href} href={href}
        aria-current={pathname === href ? "page" : undefined}
        className={pathname === href ? "nav-item active" : "nav-item"}>
        <Icon size={18} aria-hidden="true" /><span>{label}</span>
      </Link>)}
    </nav>
    <Link href="/implementacion" className="plan-link">Plan de implementación <ArrowUpRight size={16} aria-hidden="true" /></Link>
    <div className="sidebar-foot"><span className="status-dot" />Tacna · Transporte terrestre</div>
  </>;
}

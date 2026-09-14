import type { Metadata } from "next";
import { Navigation } from "@/components/navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "LARAM’S | Gestión de transporte", template: "%s | LARAM’S" },
  description: "Gestión de transporte terrestre nacional e internacional.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    <aside className="sidebar"><Navigation /></aside>
    <div className="app-main">
      <header className="topbar"><span>Gestión de transporte</span><span className="preview-badge">Vista inicial · Fase 0</span></header>
      <main id="contenido" tabIndex={-1}>{children}</main>
      <footer className="footer">LARAM’S CARGO INTERNACIONAL <span>Perú · Chile · Rutas terrestres</span></footer>
    </div>
  </body></html>;
}

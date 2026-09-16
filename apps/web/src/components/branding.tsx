"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { request } from "@/lib/organization";

export type Brand = { displayName: string; slogan: string; primaryColor: string; accentColor: string;
  density: string; logoHash: string | null };
const defaults: Brand = { displayName: "LARAM’S", slogan: "Transporte terrestre", primaryColor: "#006e63",
  accentColor: "#956416", density: "comfortable", logoHash: null };
const Context = createContext(defaults);
export const refreshBranding = () => window.dispatchEvent(new Event("larams:branding"));
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState(defaults);
  useEffect(() => {
    let active = true;
    let generation = 0;
    const load = () => {
      const current = ++generation;
      request<Brand>("branding").then(value => {
        if (active && generation === current) setBrand(value);
      }).catch(() => { /* Conservar identidad anterior durante una interrupción. */ });
    };
    load();
    window.addEventListener("larams:branding", load);
    return () => { active = false; window.removeEventListener("larams:branding", load); };
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (/^#[a-f0-9]{6}$/i.test(brand.primaryColor)) root.style.setProperty("--brand", brand.primaryColor);
    if (/^#[a-f0-9]{6}$/i.test(brand.accentColor)) root.style.setProperty("--accent", brand.accentColor);
    root.dataset.density = brand.density === "compact" ? "compact" : "comfortable";
  }, [brand]);
  return <Context.Provider value={brand}>{children}</Context.Provider>;
}
export function BrandMark() {
  const brand = useContext(Context);
  return <>{brand.logoHash ? <Image unoptimized width={44} height={44} className="company-logo"
    src={"/api/branding/logo?v=" + brand.logoHash} alt="" /> : <span className="brand-icon"><Building2 size={23} aria-hidden="true" /></span>}
    <span><strong>{brand.displayName}</strong>{brand.slogan && <small>{brand.slogan}</small>}</span></>;
}
export function BrandFooter() {
  const brand = useContext(Context);
  return <>{brand.displayName}<span>{brand.slogan || "Perú · Chile · Rutas terrestres"}</span></>;
}
export function BrandName() { return <>{useContext(Context).displayName}</>; }

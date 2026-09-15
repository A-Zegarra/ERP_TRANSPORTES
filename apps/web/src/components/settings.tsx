"use client";

import { useState } from "react";
import { Building2, MapPin, Users } from "lucide-react";
import { CompanySettings } from "./settings/company";
import { BranchesSettings } from "./settings/branches";
import { UsersSettings } from "./settings/users";

export function Settings({ permissions, userId }: { permissions: string[]; userId: string }) {
  const [tab, setTab] = useState("company");
  const tabs = [{ key: "company", label: "Empresa", permission: "company.read", icon: Building2 },
    { key: "branches", label: "Sucursales", permission: "branches.read", icon: MapPin },
    { key: "users", label: "Usuarios", permission: "users.read", icon: Users }];
  return <><nav className="settings-tabs" aria-label="Secciones de configuración">
    {tabs.filter(item => permissions.includes(item.permission)).map(({ key, label, icon: Icon }) =>
      <button key={key} className={tab === key ? "settings-tab selected" : "settings-tab"} aria-current={tab === key ? "page" : undefined}
        onClick={() => setTab(key)}><Icon size={18} aria-hidden="true" />{label}</button>)}</nav>
    {tab === "company" && <CompanySettings canWrite={permissions.includes("company.write")} />}
    {tab === "branches" && <BranchesSettings canWrite={permissions.includes("branches.write")} />}
    {tab === "users" && <UsersSettings canWrite={permissions.includes("users.write")} userId={userId} />}
  </>;
}

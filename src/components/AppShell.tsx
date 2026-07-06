"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays, ChevronDown, ClipboardList, LayoutDashboard,
  LogOut, Menu, Search, Settings, Stethoscope, UserRoundCheck, Users, X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type Perfil = {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  email: string | null;
};

const navigation = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/consultas", label: "Consultas", icon: ClipboardList },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/profissionais", label: "Profissionais", icon: UserRoundCheck },
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "—";
}

export function AppShell({ children, perfil }: { children: ReactNode; perfil: Perfil }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const primary = perfil.cor_primaria ?? "#4c6fff";
  const secondary = perfil.cor_secundaria ?? "#34d6c4";
  const clinicInitials = initials(perfil.nome);
  const userInitials = perfil.email ? perfil.email[0].toUpperCase() : "—";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    
    <div className="appShell" style={{ ["--brand-primary" as string]: primary, ["--brand-secondary" as string]: secondary }}>
      <aside className={`appSidebar ${menuOpen ? "isOpen" : ""}`}>
        <div className="appBrand"><span className="appBrandMark" style={{ background: primary }}><Stethoscope size={18} /></span><span>Reserve Clinic</span><button className="mobileClose" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={20} /></button></div>
        <div className="clinicSwitcher"><span className="clinicAvatar" style={{ background: primary, color: "#fff", overflow: "hidden" }}>{perfil.logo_url ? <img src={perfil.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : clinicInitials}</span><div><strong>{perfil.nome}</strong><small>Unidade principal</small></div><ChevronDown size={15} /></div>
        <nav className="appNavigation" aria-label="Navegação principal">
          <span className="navGroupLabel">GESTÃO</span>
          {navigation.map(({ href, label, icon: Icon }) => <Link className={pathname === href ? "active" : ""} href={href} key={href} onClick={() => setMenuOpen(false)}><Icon size={18} /><span>{label}</span></Link>)}
          <span className="navGroupLabel navGroupSettings">CONTA</span>
          <Link className={pathname === "/configuracoes" ? "active" : ""} href="/configuracoes" onClick={() => setMenuOpen(false)}><Settings size={18} /><span>Configurações</span></Link>
        </nav>
        <div className="sidebarUser"><span className="userAvatar">{userInitials}</span><div><strong>{perfil.email ?? "Usuário"}</strong><small>Administrador</small></div><button onClick={handleLogout} aria-label="Sair" style={{ background: "transparent", border: 0, cursor: "pointer", color: "inherit", padding: 0 }}><LogOut size={17} /></button></div>
      </aside>
      {menuOpen && <button className="sidebarBackdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <div className="appBody">
        <header className="appTopbar"><button className="menuTrigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button><label className="globalSearch"><Search size={18} /><input placeholder="Buscar paciente, consulta..." aria-label="Buscar" /><kbd>⌘ K</kbd></label><div className="topbarDate"><span>Hoje</span><strong>{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</strong></div><button className="notificationButton" aria-label="Notificações">◦</button></header>
        <main className="appContent">{children}</main>
      </div>
    </div>
  );
}

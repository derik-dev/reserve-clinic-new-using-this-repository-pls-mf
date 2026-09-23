"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays, ChevronDown, ClipboardList, LayoutDashboard,
  Bot, CircleAlert, LogOut, Menu, Moon, Search, Settings, Sun, UserRoundCheck, Users, X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { ProductTour } from "@/components/ProductTour";

export type Perfil = {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  email: string | null;
  created_at: string | null;
};

const navigation = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/consultas", label: "Consultas", icon: ClipboardList },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/profissionais", label: "Profissionais", icon: UserRoundCheck },
  { href: "/navi", label: "Navi IA", icon: Bot },
] as const;

const mobileNav = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/consultas", label: "Consultas", icon: ClipboardList },
  { href: "/pacientes", label: "Pacientes", icon: Users },
] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "—";
}

export function AppShell({ children, perfil }: { children: ReactNode; perfil: Perfil }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navAlerts, setNavAlerts] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("reserve-clinic-theme");
      if (savedTheme === "dark" || savedTheme === "light") setTheme(savedTheme);
    } catch {
      // storage unavailable
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: profissionais }, { data: perfilConfig }] = await Promise.all([
        supabase.from("profissionais").select("id, valor_consulta").eq("ativo", true),
        supabase.from("perfis").select("valor_consulta").eq("id", perfil.id).maybeSingle(),
      ]);

      if (cancelled) return;
      const profissionaisCount = profissionais?.length ?? 0;
      const hasConsultationValue = Number(perfilConfig?.valor_consulta) > 0 || (profissionais ?? []).some((professional: { valor_consulta: number | null }) => Number(professional.valor_consulta) > 0);
      setNavAlerts({
        "/profissionais": profissionaisCount === 0,
        "/configuracoes": profissionaisCount > 0 && !hasConsultationValue,
      });
    })();

    return () => { cancelled = true; };
  }, [perfil.id]);

  const primary = perfil.cor_primaria ?? "#4c6fff";
  const secondary = perfil.cor_secundaria ?? "#34d6c4";
  const clinicInitials = initials(perfil.nome);
  const userInitials = perfil.email ? perfil.email[0].toUpperCase() : "—";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("reserve-clinic-theme", nextTheme);
    } catch {
      // storage unavailable
    }
  }

  return (
    
    <div className={`appShell ${theme === "dark" ? "theme-dark" : ""}`} style={{ ["--brand-primary" as string]: primary, ["--brand-secondary" as string]: secondary }}>
      <aside className={`appSidebar ${menuOpen ? "isOpen" : ""}`}>
        <div className="appBrand"><span className="appBrandSymbol"><img className="appBrandLogo" src="/logo.svg" alt="" /></span><span className="appBrandName">Reserve Clinic</span><button className="mobileClose" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X size={20} /></button></div>
        <div className="clinicSwitcher"><span className="clinicAvatar" style={{ background: primary, color: "#fff", overflow: "hidden" }}>{perfil.logo_url ? <img src={perfil.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : clinicInitials}</span><div><strong>{perfil.nome}</strong><small>Unidade principal</small></div><ChevronDown size={15} /></div>
        <nav className="appNavigation" aria-label="Navegação principal">
          <span className="navGroupLabel">GESTÃO</span>
          {navigation.map(({ href, label, icon: Icon }) => <Link className={pathname === href || (href !== "/dashboard" && pathname.startsWith(href)) ? "active" : ""} href={href} key={href} onClick={() => setMenuOpen(false)}><Icon size={18} /><span>{label}</span>{href === "/navi" && <span className="navBeta">Beta</span>}{navAlerts[href] && <CircleAlert className="navAlert" size={15} aria-label={`${label}: configuração pendente`} />}</Link>)}
          <span className="navGroupLabel navGroupSettings">CONTA</span>
          <Link className={pathname === "/configuracoes" ? "active" : ""} href="/configuracoes" onClick={() => setMenuOpen(false)}><Settings size={18} /><span>Configurações</span>{navAlerts["/configuracoes"] && <CircleAlert className="navAlert" size={15} aria-label="Configurações: configuração pendente" />}</Link>
        </nav>
        <div className="sidebarUser"><span className="userAvatar">{userInitials}</span><div><strong>{perfil.email ?? "Usuário"}</strong><small>Administrador</small></div><button onClick={handleLogout} aria-label="Sair" style={{ background: "transparent", border: 0, cursor: "pointer", color: "inherit", padding: 0 }}><LogOut size={17} /></button></div>
      </aside>
      {menuOpen && <button className="sidebarBackdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <div className="appBody">
        <header className="appTopbar"><button className="menuTrigger" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button><label className="globalSearch"><Search size={18} /><input placeholder="Buscar paciente, consulta..." aria-label="Buscar" /><kbd>⌘ K</kbd></label><div className="topbarDate"><span>Hoje</span><strong>{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</strong></div><button className="themeToggle" onClick={toggleTheme} aria-label={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"} title={theme === "light" ? "Modo escuro" : "Modo claro"}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}</button><button className="notificationButton" aria-label="Notificações">◦</button></header>
        <main className="appContent">{children}</main>
      </div>
      <nav className="mobileTabbar" aria-label="Navegação">
        {mobileNav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={pathname === href ? "active" : ""} onClick={() => setMenuOpen(false)}>
            <Icon size={20} strokeWidth={pathname === href ? 2.2 : 1.8} />
            <span>{label}</span>{navAlerts[href] && <CircleAlert className="navAlert" size={14} aria-label={`${label}: configuração pendente`} />}
          </Link>
        ))}
        <Link href="/configuracoes" className={pathname === "/configuracoes" ? "active" : ""} onClick={() => setMenuOpen(false)}>
          <Settings size={20} strokeWidth={pathname === "/configuracoes" ? 2.2 : 1.8} />
          <span>Config</span>{navAlerts["/configuracoes"] && <CircleAlert className="navAlert" size={14} aria-label="Configurações: configuração pendente" />}
        </Link>
      </nav>
      <ProductTour slug={perfil.slug} userId={perfil.id} accountCreatedAt={perfil.created_at} />
    </div>
  );
}

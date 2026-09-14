"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell, type Perfil } from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

export default function SystemLayout({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase.from("perfis").select("id, nome, slug, logo_url, cor_primaria, cor_secundaria, onboarding_concluido, created_at").eq("id", session.user.id).maybeSingle();
      if (!data || !data.onboarding_concluido) {
        router.replace("/onboarding");
        return;
      }
      setPerfil({ id: data.id, nome: data.nome, slug: data.slug, logo_url: data.logo_url, cor_primaria: data.cor_primaria, cor_secundaria: data.cor_secundaria, email: session.user.email ?? null, created_at: data.created_at ?? null });
      setReady(true);
    })();
  }, [router]);

  if (!ready || !perfil) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#858d9f", fontSize: 13 }}>Carregando…</div>;
  }

  return <AppShell perfil={perfil}>{children}</AppShell>;
}

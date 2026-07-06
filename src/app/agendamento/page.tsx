"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Stethoscope, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AgendamentoPage() {
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) { router.replace("/login"); return; }
      const { data } = await supabase.from("perfis").select("slug").eq("id", session.user.id).maybeSingle();
      if (!data?.slug) { router.replace("/onboarding"); return; }
      setSlug(data.slug);
    })();
  }, [router]);

  if (!slug) {
    return <main className="bookingPage"><div style={{ padding: 40, textAlign: "center", color: "#858d9f" }}>Carregando…</div></main>;
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${baseUrl}/agendamento/${slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return <main className="bookingPage">
    <header className="bookingHeader"><Link href="/dashboard" className="bookingBrand"><span><Stethoscope size={18} /></span>Reserve Clinic</Link><small>Seu link público</small></header>
    <div className="bookingContainer" style={{ maxWidth: 640 }}>
      <section className="panel" style={{ padding: 28 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>Link de agendamento</h1>
        <p style={{ margin: "0 0 20px", color: "#7d8597", fontSize: 13 }}>Compartilhe este endereço com seus pacientes. Toda solicitação chega direto no painel.</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#f5f7fb", border: "1px solid #e0e4eb", borderRadius: 10, padding: "10px 12px" }}>
          <code style={{ flex: 1, fontSize: 13, color: "#2a3244", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{link}</code>
          <button className="secondaryButton" onClick={handleCopy}>{copied ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <a className="primaryButton" href={link} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Abrir página pública</a>
        </div>
      </section>
    </div>
    <footer className="bookingFooter">Personalize a página em <Link href="/dashboard">Configurações</Link></footer>
  </main>;
}

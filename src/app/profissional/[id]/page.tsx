import { createClient } from "@supabase/supabase-js";
import { Award, Phone, TrendingUp, CalendarDays, CheckCircle2, XCircle, Banknote, Copy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

type Profissional = {
  id: string;
  perfil_id: string;
  nome: string;
  especialidade: string | null;
  whatsapp: string | null;
  cpf: string | null;
  crm: string | null;
  anos_experiencia: number | null;
  foto_url: string | null;
  ativo: boolean;
  created_at: string | null;
};

type ConsultaRow = {
  status: string;
  valor: number | null;
  data_hora: string;
  servico: string | null;
  paciente_nome: string;
};

type Perfil = {
  id: string;
  nome: string;
  slug: string | null;
  logo_url: string | null;
  cor_primaria: string | null;
};

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "—";
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABEL: Record<string, string> = {
  aguardando: "Aguardando",
  confirmada: "Confirmada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  aguardando: "#f59e0b",
  confirmada: "#3b82f6",
  concluida: "#10b981",
  cancelada: "#94a3b8",
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "");
}

function monthsBetween(from: Date, to: Date): string[] {
  const months: string[] = [];
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cur <= end) {
    months.push(monthKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}

export default async function PublicProfissionalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mes?: string }>;
}) {
  const { id } = await params;
  const { mes } = await searchParams;

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const [{ data: profRaw }, { data: consultasRaw }] = await Promise.all([
    db.from("profissionais").select("*").eq("id", id).single(),
    db.from("consultas").select("status, valor, data_hora, servico, paciente_nome").eq("profissional_id", id).order("data_hora", { ascending: false }),
  ]);

  if (!profRaw) notFound();

  const prof = profRaw as Profissional;
  const { data: perfilRaw } = await db.from("perfis").select("id, nome, slug, logo_url, cor_primaria").eq("id", prof.perfil_id).single();
  const perfil = perfilRaw as Perfil | null;

  const allConsultas = (consultasRaw ?? []) as ConsultaRow[];

  // Build month list from prof.created_at to now
  const createdAt = new Date(prof.created_at ?? Date.now());
  const now = new Date();
  const months = monthsBetween(createdAt, now).reverse(); // newest first

  // Filter consultas by selected month (or show all)
  const consultas = mes
    ? allConsultas.filter((c) => c.data_hora.startsWith(mes))
    : allConsultas;

  const total = consultas.length;
  const concluidas = consultas.filter((c) => c.status === "concluida").length;
  const canceladas = consultas.filter((c) => c.status === "cancelada").length;
  const faturamento = consultas
    .filter((c) => c.status === "concluida" || c.status === "confirmada")
    .reduce((sum, c) => sum + (c.valor ?? 0), 0);
  const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  const bg = "#f1f5f9";
  const cardBg = "#ffffff";
  const border = "1px solid #e2e8f0";
  const radius = 16;
  const shadow = "0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)";
  const textPrimary = "#0f172a";
  const textMuted = "#64748b";
  const textSubtle = "#94a3b8";
  const accent = "#1d4ed8";

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "var(--font-plex, system-ui, sans-serif)", color: textPrimary }}>
      {/* Top bar */}
      <header style={{ background: cardBg, borderBottom: border, padding: "0 32px", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
        {perfil?.logo_url
          ? <img src={perfil.logo_url} alt={perfil.nome} style={{ height: 26, width: "auto", objectFit: "contain" }} />
          : <span style={{ font: `600 14px var(--font-space, sans-serif)`, color: textPrimary }}>{perfil?.nome ?? "Reserve Clinic"}</span>
        }
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px 80px" }}>

        {/* Profile card */}
        <div style={{ background: cardBg, borderRadius: radius, border, boxShadow: shadow, padding: "28px 32px", marginBottom: 22, display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ width: 88, height: 88, borderRadius: 18, overflow: "hidden", background: "#e0e7ff", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 700, color: accent, flexShrink: 0, border: "1px solid #c7d2fe" }}>
            {prof.foto_url
              ? <img src={prof.foto_url} alt={prof.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials(prof.nome)}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
              <h1 style={{ margin: 0, font: `600 24px/1.1 var(--font-space, sans-serif)`, color: textPrimary, letterSpacing: "-.02em" }}>{prof.nome}</h1>
              <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 10px", borderRadius: 20, background: prof.ativo ? "rgba(16,185,129,.12)" : "rgba(148,163,184,.12)", color: prof.ativo ? "#059669" : "#64748b", fontSize: 11, fontWeight: 600, letterSpacing: ".02em" }}>
                {prof.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            {prof.especialidade && <p style={{ margin: "0 0 14px", color: textMuted, fontSize: 13 }}>{prof.especialidade}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px" }}>
              {prof.whatsapp && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: textMuted }}>
                  <Phone size={12} /> {prof.whatsapp}
                </span>
              )}
              {prof.cpf && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: textMuted }}>
                  <Copy size={12} /> CPF {prof.cpf}
                </span>
              )}
              {prof.anos_experiencia != null && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: textMuted }}>
                  <TrendingUp size={12} /> {prof.anos_experiencia} anos de experiência
                </span>
              )}
              {prof.crm && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: textMuted }}>
                  <Award size={12} /> CRM {prof.crm}
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Section label + month filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: textPrimary, fontFamily: "var(--font-space, sans-serif)", letterSpacing: "-.01em" }}>Relatório</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Link
              href={`/profissional/${id}`}
              style={{ display: "inline-flex", alignItems: "center", height: 30, padding: "0 14px", borderRadius: 20, border: `1px solid ${!mes ? accent : "#e2e8f0"}`, background: !mes ? accent : "transparent", color: !mes ? "#fff" : textMuted, fontSize: 12, fontWeight: 500, textDecoration: "none", transition: "all .15s" }}
            >
              Todos
            </Link>
            {months.map((m) => (
              <Link
                key={m}
                href={`/profissional/${id}?mes=${m}`}
                style={{ display: "inline-flex", alignItems: "center", height: 30, padding: "0 14px", borderRadius: 20, border: `1px solid ${mes === m ? accent : "#e2e8f0"}`, background: mes === m ? accent : "transparent", color: mes === m ? "#fff" : textMuted, fontSize: 12, fontWeight: 500, textDecoration: "none", textTransform: "capitalize" }}
              >
                {monthLabel(m)}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "CONSULTAS", value: String(total), icon: <CalendarDays size={11} /> },
            { label: "FATURAMENTO", value: formatCurrency(faturamento), icon: <Banknote size={11} /> },
            { label: "CONCLUÍDAS", value: String(concluidas), icon: <CheckCircle2 size={11} /> },
            { label: "TAXA DE CONCLUSÃO", value: `${taxaConclusao}%`, icon: null },
            { label: "CANCELAMENTOS", value: String(canceladas), icon: <XCircle size={11} /> },
          ].map((s) => (
            <div key={s.label} style={{ background: cardBg, borderRadius: 12, border, padding: "16px 20px", boxShadow: shadow }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10, color: textSubtle }}>
                {s.icon}
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: textSubtle, textTransform: "uppercase" }}>{s.label}</span>
              </div>
              <strong style={{ font: `300 28px/1 var(--font-space, sans-serif)`, color: textPrimary, letterSpacing: "-.02em", fontFeatureSettings: '"tnum"' }}>{s.value}</strong>
            </div>
          ))}
        </div>

        {/* Consultas */}
        <div style={{ background: cardBg, borderRadius: radius, border, boxShadow: shadow, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: border }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>Consultas</span>
            <span style={{ fontSize: 11, color: textMuted }}>{total} registro{total !== 1 ? "s" : ""}</span>
          </div>

          {consultas.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "64px 24px", color: textMuted, textAlign: "center" }}>
              <CalendarDays size={36} strokeWidth={1.4} color={textSubtle} />
              <div>
                <strong style={{ display: "block", font: `600 15px/1 var(--font-space, sans-serif)`, color: textPrimary, marginBottom: 6 }}>Nenhuma consulta registrada</strong>
                <small style={{ fontSize: 12, color: textMuted }}>As consultas deste profissional aparecerão aqui.</small>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr>
                    {["Data", "Paciente", "Serviço", "Status", "Valor"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 24px", color: textSubtle, fontSize: 10, letterSpacing: ".1em", fontWeight: 600, textTransform: "uppercase", borderBottom: border, background: "transparent" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {consultas.map((c, i) => (
                    <tr key={i} style={{ borderTop: i === 0 ? "none" : border }}>
                      <td style={{ padding: "14px 24px", fontSize: 12, color: textMuted }}>
                        <strong style={{ display: "block", color: textPrimary, fontSize: 12, fontWeight: 500 }}>{formatDate(c.data_hora)}</strong>
                        <small style={{ fontSize: 10, color: textMuted }}>{formatTime(c.data_hora)}</small>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 12, color: textPrimary }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#e0e7ff", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, color: accent, flexShrink: 0 }}>
                            {initials(c.paciente_nome)}
                          </div>
                          <span style={{ fontWeight: 500 }}>{c.paciente_nome}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 12, color: c.servico ? textMuted : textSubtle }}>{c.servico ?? "—"}</td>
                      <td style={{ padding: "14px 24px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 10px", borderRadius: 20, background: `${STATUS_COLOR[c.status] ?? "#94a3b8"}18`, color: STATUS_COLOR[c.status] ?? "#94a3b8", fontSize: 11, fontWeight: 600 }}>
                          {STATUS_LABEL[c.status] ?? c.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: 12, color: textPrimary, fontVariantNumeric: "tabular-nums" }}>
                        {c.valor != null ? formatCurrency(c.valor) : <span style={{ color: textSubtle }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer branding */}
        <p style={{ textAlign: "center", fontSize: 11, color: textSubtle, marginTop: 36 }}>
          Agendamento gerenciado por{" "}
          <a href="/" style={{ color: accent, textDecoration: "none", fontWeight: 500 }}>Reserve Clinic</a>
        </p>
      </main>
    </div>
  );
}

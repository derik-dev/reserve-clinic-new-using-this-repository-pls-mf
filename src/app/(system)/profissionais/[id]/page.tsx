"use client";

import { ArrowLeft, Award, Copy, Phone, TrendingUp, CalendarDays, CheckCircle2, XCircle, BarChart3, Link2, Check, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { initials, formatCurrency, formatDate, formatTime, STATUS_CLASS, STATUS_LABEL, type Consulta } from "@/lib/db";

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
  created_at: string;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
    .replace(".", "");
}

function monthsBetween(from: Date, to: Date): string[] {
  const months: string[] = [];
  const cur = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (cur <= end) {
    months.push(monthKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return months.reverse();
}

export default function ProfissionalRelatorioPage() {
  const { id } = useParams<{ id: string }>();
  const [prof, setProf] = useState<Profissional | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [perfilSlug, setPerfilSlug] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase.from("profissionais").select("*").eq("id", id).single(),
      supabase.from("consultas").select("*").eq("profissional_id", id).order("data_hora", { ascending: false }),
    ]).then(async ([p, c]) => {
      setProf((p.data as Profissional | null) ?? null);
      setConsultas((c.data as Consulta[] | null) ?? []);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perf } = await supabase.from("perfis").select("slug").eq("id", user.id).maybeSingle();
        setPerfilSlug((perf as { slug: string } | null)?.slug ?? null);
      }
      setLoading(false);
    });
  }, [id]);

  const months = useMemo(() => {
    if (!prof) return [];
    return monthsBetween(new Date(prof.created_at), new Date());
  }, [prof]);

  const filtered = useMemo(() => {
    if (!mesSelecionado) return consultas;
    return consultas.filter((c) => c.data_hora.startsWith(mesSelecionado));
  }, [consultas, mesSelecionado]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const concluidas = filtered.filter((c) => c.status === "concluida").length;
    const canceladas = filtered.filter((c) => c.status === "cancelada").length;
    const faturamento = filtered
      .filter((c) => c.status === "concluida" || c.status === "confirmada")
      .reduce((sum, c) => sum + (c.valor ?? 0), 0);
    const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    return { total, concluidas, canceladas, faturamento, taxaConclusao };
  }, [filtered]);

  const bookingPath = perfilSlug && prof ? `/agendamento/${perfilSlug}?p=${prof.id}` : null;

  if (loading) {
    return (
      <div style={{ padding: "60px 36px", color: "var(--text-muted)", fontSize: 13 }}>
        Carregando…
      </div>
    );
  }

  if (!prof) {
    return (
      <div style={{ padding: "60px 36px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>Profissional não encontrado.</p>
        <Link href="/profissionais" className="secondaryButton" style={{ textDecoration: "none" }}>
          <ArrowLeft size={15} /> Voltar
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Back link */}
      <Link
        href="/profissionais"
        style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-muted)", fontSize: 12, fontWeight: 500, textDecoration: "none", marginBottom: 28, transition: "color .15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={14} /> Profissionais
      </Link>

      {/* Profile header */}
      <div className="panel" style={{ padding: "32px 36px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 28, flexWrap: "wrap" }}>
        {/* Avatar */}
        <div style={{ width: 96, height: 96, borderRadius: 20, overflow: "hidden", background: "var(--accent-dim)", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 700, color: "var(--accent)", flexShrink: 0, border: "1px solid var(--border-soft)" }}>
          {prof.foto_url
            ? <img src={prof.foto_url} alt={prof.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials(prof.nome)}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
            <h1 style={{ margin: 0, font: `600 26px/1.1 var(--font-space)`, color: "var(--text)", letterSpacing: "-.02em" }}>{prof.nome}</h1>
            <span className={`statusBadge ${prof.ativo ? "statusAtivo" : "statusConcluida"}`}>
              {prof.ativo ? "Ativo" : "Inativo"}
            </span>
          </div>
          {prof.especialidade && (
            <p style={{ margin: "0 0 14px", color: "var(--text-muted)", fontSize: 13 }}>{prof.especialidade}</p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {prof.crm && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                <Award size={13} /> CRM {prof.crm}
              </span>
            )}
            {prof.whatsapp && (
              <a href={`tel:${prof.whatsapp}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
                <Phone size={13} /> {prof.whatsapp}
              </a>
            )}
            {prof.cpf && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                <Copy size={13} /> CPF {prof.cpf}
              </span>
            )}
            {prof.anos_experiencia != null && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}>
                <TrendingUp size={13} /> {prof.anos_experiencia} anos de experiência
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexShrink: 0 }}>
          <button
            className="secondaryButton"
            style={{ gap: 7, fontSize: 12 }}
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/profissional/${prof?.id}`);
              setCopiedPublic(true);
              setTimeout(() => setCopiedPublic(false), 1600);
            }}
          >
            {copiedPublic ? <Check size={14} /> : <Share2 size={14} />}
            {copiedPublic ? "Link copiado!" : "Compartilhar perfil"}
          </button>
          {bookingPath && (
            <button
              className="secondaryButton"
              style={{ gap: 7, fontSize: 12 }}
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + bookingPath);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 1600);
              }}
            >
              {copiedLink ? <Check size={14} /> : <Link2 size={14} />}
              {copiedLink ? "Copiado!" : "Link de agendamento"}
            </button>
          )}
          <Link href={`/profissionais`} className="secondaryButton" style={{ textDecoration: "none", fontSize: 12 }}>
            Editar
          </Link>
        </div>
      </div>

      {/* Period selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <BarChart3 size={15} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-space)", letterSpacing: "-.01em" }}>Relatório</span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            className={`profFiltroBtn${!mesSelecionado ? " active" : ""}`}
            onClick={() => setMesSelecionado(null)}
          >
            Todos
          </button>
          {months.map((m) => (
            <button
              key={m}
              className={`profFiltroBtn${mesSelecionado === m ? " active" : ""}`}
              onClick={() => setMesSelecionado(m)}
              style={{ textTransform: "capitalize" }}
            >
              {monthLabel(m)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="summaryPills" style={{ marginBottom: 24 }}>
        <div>
          <span><CalendarDays size={11} style={{ display: "inline", marginRight: 4 }} />Consultas</span>
          <strong>{stats.total}</strong>
        </div>
        <div>
          <span><TrendingUp size={11} style={{ display: "inline", marginRight: 4 }} />Faturamento</span>
          <strong className="mintText">{formatCurrency(stats.faturamento)}</strong>
        </div>
        <div>
          <span><CheckCircle2 size={11} style={{ display: "inline", marginRight: 4 }} />Concluídas</span>
          <strong>{stats.concluidas}</strong>
        </div>
        <div>
          <span>Taxa de conclusão</span>
          <strong>{stats.taxaConclusao}%</strong>
        </div>
        <div>
          <span><XCircle size={11} style={{ display: "inline", marginRight: 4 }} />Cancelamentos</span>
          <strong className={stats.canceladas > 0 ? "amberText" : ""}>{stats.canceladas}</strong>
        </div>
      </div>

      {/* Consultas table */}
      <div className="panel dataPanel">
        <div className="tableToolbar" style={{ padding: "16px 24px" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", letterSpacing: "-.005em" }}>
            Consultas
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="tableEmpty">
            <CalendarDays size={36} strokeWidth={1.4} />
            <div>
              <strong>Nenhuma consulta no período</strong>
              <small>Troque o filtro de período para ver mais resultados.</small>
            </div>
          </div>
        ) : (
          <div className="tableScroll">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Paciente</th>
                  <th>Serviço</th>
                  <th>Status</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="rowClickable">
                    <td>
                      <strong>{formatDate(c.data_hora)}</strong>
                      <small>{formatTime(c.data_hora)}</small>
                    </td>
                    <td>
                      <div className="patientCell">
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-dim)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                          {initials(c.paciente_nome)}
                        </div>
                        <div>
                          <strong>{c.paciente_nome}</strong>
                          {c.paciente_telefone && <small>{c.paciente_telefone}</small>}
                        </div>
                      </div>
                    </td>
                    <td>{c.servico ?? <span style={{ color: "var(--text-subtle)" }}>—</span>}</td>
                    <td>
                      <span className={`statusBadge ${STATUS_CLASS[c.status]}`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td className="valorCell">{formatCurrency(c.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

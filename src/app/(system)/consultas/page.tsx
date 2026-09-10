"use client";

import { CalendarDays, CalendarX, ChevronDown, Download, Filter, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, formatTime, initials, STATUS_CLASS, STATUS_LABEL, type Consulta, type ConsultaStatus, type Paciente } from "@/lib/db";

type FormState = {
  paciente_id: string;
  paciente_nome: string;
  data: string;
  hora: string;
  duracao_min: string;
  servico: string;
  profissional: string;
  valor: string;
  status: ConsultaStatus;
  observacoes: string;
};

const emptyForm: FormState = { paciente_id: "", paciente_nome: "", data: "", hora: "", duracao_min: "30", servico: "", profissional: "", valor: "", status: "aguardando", observacoes: "" };

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type Periodo = "todos" | "hoje" | "semana" | "mes";
const PERIODO_LABEL: Record<Periodo, string> = { todos: "Todos", hoje: "Hoje", semana: "Esta semana", mes: "Este mês" };

export default function ConsultasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("todos");
  const [statusFiltro, setStatusFiltro] = useState<ConsultaStatus | "todos">("todos");
  const [showPeriodo, setShowPeriodo] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const periodoRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const [cs, ps] = await Promise.race([
        Promise.all([
          supabase.from("consultas").select("*").order("data_hora", { ascending: true }),
          supabase.from("pacientes").select("*").eq("status", "ativo").order("nome"),
        ]),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
      ]);
      setConsultas((cs.data as Consulta[] | null) ?? []);
      setPacientes((ps.data as Paciente[] | null) ?? []);
    } catch {
      setLoadError(true);
      setConsultas([]);
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (periodoRef.current && !periodoRef.current.contains(e.target as Node)) setShowPeriodo(false);
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setShowStatus(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const today = useMemo(() => new Date(), []);
  const totais = useMemo(() => {
    const hoje = consultas.filter(c => isSameDay(new Date(c.data_hora), today));
    return {
      hoje: hoje.length,
      confirmadas: hoje.filter(c => c.status === "confirmada").length,
      aguardando: hoje.filter(c => c.status === "aguardando").length,
      concluidas: hoje.filter(c => c.status === "concluida").length,
    };
  }, [consultas, today]);

  const filtered = useMemo(() => {
    let r = consultas;
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(c => c.paciente_nome.toLowerCase().includes(q) || (c.servico ?? "").toLowerCase().includes(q) || (c.profissional ?? "").toLowerCase().includes(q));
    }
    if (periodo === "hoje") {
      r = r.filter(c => isSameDay(new Date(c.data_hora), today));
    } else if (periodo === "semana") {
      const seg = new Date(today); seg.setDate(today.getDate() - ((today.getDay() + 6) % 7)); seg.setHours(0, 0, 0, 0);
      const dom = new Date(seg); dom.setDate(seg.getDate() + 6); dom.setHours(23, 59, 59, 999);
      r = r.filter(c => { const d = new Date(c.data_hora); return d >= seg && d <= dom; });
    } else if (periodo === "mes") {
      r = r.filter(c => { const d = new Date(c.data_hora); return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(); });
    }
    if (statusFiltro !== "todos") r = r.filter(c => c.status === statusFiltro);
    return r;
  }, [consultas, query, periodo, statusFiltro, today]);

  async function handleSave() {
    const nome = form.paciente_id ? (pacientes.find(p => p.id === form.paciente_id)?.nome ?? form.paciente_nome) : form.paciente_nome.trim();
    if (!nome) { setError("Selecione ou informe o paciente."); return; }
    if (!form.data || !form.hora) { setError("Informe data e horário."); return; }
    setError(null);
    setSaving(true);
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) { setSaving(false); return; }
    const paciente = pacientes.find(p => p.id === form.paciente_id);
    const dataIso = new Date(`${form.data}T${form.hora}:00`).toISOString();
    const { error: err } = await supabase.from("consultas").insert({
      perfil_id: session.user.id,
      paciente_id: form.paciente_id || null,
      paciente_nome: nome,
      paciente_telefone: paciente?.telefone ?? null,
      paciente_email: paciente?.email ?? null,
      data_hora: dataIso,
      duracao_min: Number(form.duracao_min) || 30,
      servico: form.servico || null,
      profissional: form.profissional || null,
      valor: form.valor ? Number(form.valor.replace(",", ".")) : null,
      status: form.status,
      observacoes: form.observacoes || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setForm(emptyForm);
    setModalOpen(false);
    load();
  }

  async function updateStatus(c: Consulta, status: ConsultaStatus) {
    let pacienteId = c.paciente_id;

    if (status === "confirmada" && !c.paciente_id) {
      const { data: session } = await supabase.auth.getUser();
      if (session.user) {
        const { data: existente } = await supabase
          .from("pacientes")
          .select("id")
          .eq("perfil_id", session.user.id)
          .ilike("nome", c.paciente_nome)
          .maybeSingle();

        if (existente) {
          pacienteId = existente.id;
        } else {
          const { data: novo } = await supabase
            .from("pacientes")
            .insert({
              perfil_id: session.user.id,
              nome: c.paciente_nome,
              telefone: c.paciente_telefone ?? null,
              email: c.paciente_email ?? null,
            })
            .select("id")
            .single();
          if (novo) pacienteId = novo.id;
        }
      }
    }

    await supabase.from("consultas").update({ status, paciente_id: pacienteId }).eq("id", c.id);
    load();
  }

  function exportCSV() {
    const headers = ["Data", "Hora", "Paciente", "Serviço", "Profissional", "Valor (R$)", "Status"];
    const rows = filtered.map(c => [
      formatDate(c.data_hora), formatTime(c.data_hora), c.paciente_nome,
      c.servico ?? "", c.profissional ?? "",
      c.valor != null ? String(c.valor) : "", STATUS_LABEL[c.status],
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `consultas_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return <>
    <PageHeader title="Consultas" description="Acompanhe todos os atendimentos da clínica." actions={<button className="primaryButton" onClick={() => setModalOpen(true)}><Plus size={17} /> Nova consulta</button>} />
    <div className="summaryPills">
      <div><span>Hoje</span><strong>{totais.hoje} consultas</strong></div>
      <div><span>Confirmadas</span><strong className="mintText">{totais.confirmadas}</strong></div>
      <div><span>Aguardando</span><strong className="amberText">{totais.aguardando}</strong></div>
      <div><span>Concluídas</span><strong>{totais.concluidas}</strong></div>
    </div>
    <section className="panel dataPanel">
      <div className="tableToolbar">
        <label><Search size={17} /><input placeholder="Buscar consulta ou paciente" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div ref={periodoRef} style={{ position: "relative" }}>
            <button className={`dateButton${periodo !== "todos" ? " active" : ""}`} onClick={() => { setShowPeriodo(v => !v); setShowStatus(false); }}>
              <CalendarDays size={16} /> {PERIODO_LABEL[periodo]} <ChevronDown size={13} />
            </button>
            {showPeriodo && (
              <div className="tableDropdown">
                {(Object.keys(PERIODO_LABEL) as Periodo[]).map(p => (
                  <button key={p} className={periodo === p ? "active" : ""} onClick={() => { setPeriodo(p); setShowPeriodo(false); }}>
                    {PERIODO_LABEL[p]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div ref={statusRef} style={{ position: "relative" }}>
            <button className={`secondaryButton${statusFiltro !== "todos" ? " active" : ""}`} onClick={() => { setShowStatus(v => !v); setShowPeriodo(false); }}>
              <Filter size={16} /> {statusFiltro === "todos" ? "Filtros" : STATUS_LABEL[statusFiltro]} <ChevronDown size={13} />
            </button>
            {showStatus && (
              <div className="tableDropdown">
                <button className={statusFiltro === "todos" ? "active" : ""} onClick={() => { setStatusFiltro("todos"); setShowStatus(false); }}>Todos os status</button>
                {(Object.keys(STATUS_LABEL) as ConsultaStatus[]).map(s => (
                  <button key={s} className={statusFiltro === s ? "active" : ""} onClick={() => { setStatusFiltro(s); setShowStatus(false); }}>
                    <span className={`statusBadge ${STATUS_CLASS[s]}`} style={{ pointerEvents: "none" }}>{STATUS_LABEL[s]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="iconButton" aria-label="Exportar CSV" title="Exportar CSV" onClick={exportCSV}><Download size={17} /></button>
        </div>
      </div>
      <div className="tableScroll">
        <table>
          <thead><tr><th>QUANDO</th><th>PACIENTE / SERVIÇO</th><th>PROFISSIONAL</th><th>VALOR</th><th>STATUS</th><th /></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "72px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Carregando…</td></tr>
            ) : loadError ? (
              <tr><td colSpan={6} style={{ padding: "72px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Não foi possível carregar as consultas. <button className="linkButton" onClick={load}>Tentar novamente</button></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "72px 24px", color: "var(--text-muted)", textAlign: "center" }}>
                  <CalendarX size={38} strokeWidth={1.4} style={{ color: "var(--text-subtle)", opacity: .7 }} />
                  <div>
                    <strong style={{ display: "block", font: "600 16px var(--font-space)", color: "var(--text)", letterSpacing: "-.01em", marginBottom: 6 }}>{consultas.length === 0 ? "Nenhuma consulta agendada ainda" : "Nenhuma consulta encontrada"}</strong>
                    <small style={{ display: "block", fontSize: 12, color: "var(--text-muted)", maxWidth: 320 }}>{consultas.length === 0 ? "As consultas que você agendar aparecerão aqui, organizadas por data." : "Ajuste os filtros ou a busca para encontrar outras consultas."}</small>
                  </div>
                </div>
              </td></tr>
            ) : filtered.map(c => (
              <tr key={c.id}>
                <td><strong>{formatDate(c.data_hora)}</strong><small>{formatTime(c.data_hora)} · {c.duracao_min} min</small></td>
                <td><div className="patientCell"><div className="tableAvatar">{initials(c.paciente_nome)}</div><div><strong>{c.paciente_nome}</strong>{c.servico && <small>{c.servico}</small>}</div></div></td>
                <td>{c.profissional ?? "—"}</td>
                <td>{formatCurrency(c.valor)}</td>
                <td>
                  <select value={c.status} onChange={(e) => updateStatus(c, e.target.value as ConsultaStatus)} className={`statusBadge ${STATUS_CLASS[c.status]}`} style={{ border: 0, cursor: "pointer" }}>
                    {(Object.keys(STATUS_LABEL) as ConsultaStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    {modalOpen && (
      <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <div className="modalCard">
          <header className="modalHeader"><h2>Nova consulta</h2><button className="iconButton" onClick={() => setModalOpen(false)} aria-label="Fechar"><X size={17} /></button></header>
          <div className="modalBody">
            <div className="formRow"><label>Paciente</label>
              <select value={form.paciente_id} onChange={(e) => setForm({ ...form, paciente_id: e.target.value, paciente_nome: pacientes.find(p => p.id === e.target.value)?.nome ?? "" })}>
                <option value="">— Selecionar ou digitar abaixo —</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              {!form.paciente_id && <input style={{ marginTop: 8 }} value={form.paciente_nome} onChange={(e) => setForm({ ...form, paciente_nome: e.target.value })} placeholder="Nome do paciente" />}
            </div>
            <div className="formRow split">
              <div className="formRow"><label>Data</label><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
              <div className="formRow"><label>Horário</label><input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></div>
            </div>
            <div className="formRow split">
              <div className="formRow"><label>Duração (min)</label><input type="number" value={form.duracao_min} onChange={(e) => setForm({ ...form, duracao_min: e.target.value })} /></div>
              <div className="formRow"><label>Valor (R$)</label><input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="150,00" /></div>
            </div>
            <div className="formRow split">
              <div className="formRow"><label>Serviço</label><input value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })} placeholder="Consulta clínica" /></div>
              <div className="formRow"><label>Profissional</label><input value={form.profissional} onChange={(e) => setForm({ ...form, profissional: e.target.value })} placeholder="Dr. Ricardo" /></div>
            </div>
            <div className="formRow"><label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ConsultaStatus })}>
                {(Object.keys(STATUS_LABEL) as ConsultaStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div className="formRow"><label>Observações</label><textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
            {error && <div className="onboardingError">{error}</div>}
          </div>
          <footer className="modalFooter">
            <button className="secondaryButton" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="primaryButton" disabled={saving} onClick={handleSave}>{saving ? "Salvando…" : "Agendar"}</button>
          </footer>
        </div>
      </div>
    )}
  </>;
}

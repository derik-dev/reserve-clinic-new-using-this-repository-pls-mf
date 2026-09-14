"use client";

import { CalendarDays, CalendarX, ChevronDown, Download, Filter, Plus, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, formatTime, initials, STATUS_CLASS, STATUS_LABEL, type Consulta, type ConsultaStatus, type Paciente } from "@/lib/db";

type Profissional = { id: string; nome: string; especialidade: string | null };

type FormState = {
  paciente_id: string;
  paciente_nome: string;
  data: string;
  hora: string;
  duracao_min: string;
  servico: string;
  profissional_id: string;
  profissional: string;
  valor: string;
  status: ConsultaStatus;
  observacoes: string;
};

const emptyForm: FormState = { paciente_id: "", paciente_nome: "", data: "", hora: "", duracao_min: "30", servico: "", profissional_id: "", profissional: "", valor: "", status: "aguardando", observacoes: "" };

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatWhen(iso: string, today: Date) {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isSameDay(d, today)) return { label: `Hoje às ${hora}`, isToday: true };
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return { label: `${dia} às ${hora}`, isToday: false };
}

type Periodo = "todos" | "hoje" | "semana" | "mes";
const PERIODO_LABEL: Record<Periodo, string> = { todos: "Todos", hoje: "Hoje", semana: "Esta semana", mes: "Este mês" };

export default function ConsultasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      // Remove consultas cujo horário já passou (qualquer status)
      await supabase
        .from("consultas")
        .delete()
        .lt("data_hora", new Date().toISOString());

      const [cs, ps, pr] = await Promise.race([
        Promise.all([
          supabase.from("consultas").select("*").order("data_hora", { ascending: true }),
          supabase.from("pacientes").select("*").eq("status", "ativo").order("nome"),
          supabase.from("profissionais").select("id, nome, especialidade").eq("ativo", true).order("nome"),
        ]),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
      ]);
      setConsultas((cs.data as Consulta[] | null) ?? []);
      setPacientes((ps.data as Paciente[] | null) ?? []);
      setProfissionais((pr.data as Profissional[] | null) ?? []);
    } catch {
      setLoadError(true);
      setConsultas([]);
      setPacientes([]);
      setProfissionais([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (searchParams.get("nova") === "1") {
      const data = searchParams.get("data") ?? "";
      const hora = searchParams.get("hora") ?? "";
      setEditingId(null);
      setForm({ ...emptyForm, data, hora });
      setError(null);
      setModalOpen(true);
      router.replace("/consultas");
      return;
    }
    const editarId = searchParams.get("editar");
    if (editarId && consultas.length > 0) {
      const c = consultas.find(x => x.id === editarId);
      if (c) openEdit(c);
      router.replace("/consultas");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, router, consultas]);

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

  function openEdit(c: Consulta) {
    const dt = new Date(c.data_hora);
    const data = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    const hora = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
    setForm({
      paciente_id: c.paciente_id ?? "",
      paciente_nome: c.paciente_nome,
      data, hora,
      duracao_min: String(c.duracao_min),
      servico: c.servico ?? "",
      profissional_id: c.profissional_id ?? "",
      profissional: c.profissional ?? "",
      valor: c.valor != null ? String(c.valor).replace(".", ",") : "",
      status: c.status,
      observacoes: c.observacoes ?? "",
    });
    setEditingId(c.id);
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

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
    const profSelecionado = form.profissional_id ? profissionais.find(p => p.id === form.profissional_id) : null;
    const profissionalNome = profSelecionado?.nome ?? (form.profissional || null);
    const payload = {
      paciente_id: form.paciente_id || null,
      paciente_nome: nome,
      paciente_telefone: paciente?.telefone ?? null,
      paciente_email: paciente?.email ?? null,
      data_hora: dataIso,
      duracao_min: Number(form.duracao_min) || 30,
      servico: form.servico || null,
      profissional_id: form.profissional_id || null,
      profissional: profissionalNome,
      valor: form.valor ? Number(form.valor.replace(",", ".")) : null,
      status: form.status,
      observacoes: form.observacoes || null,
    };
    const { error: err } = editingId
      ? await supabase.from("consultas").update(payload).eq("id", editingId)
      : await supabase.from("consultas").insert({ perfil_id: session.user.id, ...payload });
    setSaving(false);
    if (err) { setError(err.message); return; }
    closeModal();
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
    <PageHeader title="Consultas" description="Acompanhe todos os atendimentos da clínica." actions={<button className="primaryButton" onClick={() => { setEditingId(null); setForm(emptyForm); setError(null); setModalOpen(true); }}><Plus size={17} /> Nova consulta</button>} />
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
                <div className="tableEmpty">
                  <CalendarX size={38} strokeWidth={1.4} />
                  <div>
                    <strong>{consultas.length === 0 ? "Nenhuma consulta registrada ainda" : "Nenhuma consulta encontrada"}</strong>
                    <small>{consultas.length === 0 ? "Consultas aparecerão aqui assim que forem agendadas pelos pacientes." : "Ajuste os filtros ou a busca para encontrar outras consultas."}</small>
                  </div>
                </div>
              </td></tr>
            ) : filtered.map(c => {
              const when = formatWhen(c.data_hora, today);
              return (
                <tr key={c.id} className="rowClickable" onClick={() => openEdit(c)}>
                  <td><strong className={when.isToday ? "isTodayLabel" : ""}>{when.label}</strong><small>{c.duracao_min} min</small></td>
                  <td><div className="patientCell"><div className="tableAvatar">{initials(c.paciente_nome)}</div><div><strong>{c.paciente_nome}</strong>{c.servico && <small>{c.servico}</small>}</div></div></td>
                  <td>{c.profissional ?? "—"}</td>
                  <td className="valorCell">{formatCurrency(c.valor)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select value={c.status} onChange={(e) => updateStatus(c, e.target.value as ConsultaStatus)} className={`statusBadge ${STATUS_CLASS[c.status]}`} style={{ border: 0, cursor: "pointer" }}>
                      {(Object.keys(STATUS_LABEL) as ConsultaStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </td>
                  <td />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>

    {modalOpen && (
      <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modalCard">
          <header className="modalHeader"><h2>{editingId ? "Editar consulta" : "Nova consulta"}</h2><button className="iconButton" onClick={closeModal} aria-label="Fechar"><X size={17} /></button></header>
          <div className="modalBody">
            <div className="formGroup">
              <span className="formGroupLabel">Paciente</span>
              <div className="formRow">
                <select value={form.paciente_id} onChange={(e) => setForm({ ...form, paciente_id: e.target.value, paciente_nome: pacientes.find(p => p.id === e.target.value)?.nome ?? "" })}>
                  <option value="">— Selecionar ou digitar abaixo —</option>
                  {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                {!form.paciente_id && <input style={{ marginTop: 8 }} value={form.paciente_nome} onChange={(e) => setForm({ ...form, paciente_nome: e.target.value })} placeholder="Nome do paciente" />}
              </div>
            </div>
            <div className="formGroup">
              <span className="formGroupLabel">Quando</span>
              <div className="formRow split">
                <div className="formRow"><label>Data</label><input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                <div className="formRow"><label>Horário</label><input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></div>
              </div>
              <div className="formRow split">
                <div className="formRow"><label>Duração (min)</label><input type="number" value={form.duracao_min} onChange={(e) => setForm({ ...form, duracao_min: e.target.value })} /></div>
                <div className="formRow"><label>Valor (R$)</label><input value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="150,00" /></div>
              </div>
            </div>
            <div className="formGroup">
              <span className="formGroupLabel">Detalhes</span>
              <div className="formRow split">
                <div className="formRow"><label>Serviço</label><input value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })} placeholder="Consulta clínica" /></div>
                <div className="formRow"><label>Profissional</label>
                  {profissionais.length > 0 ? (
                    <select value={form.profissional_id} onChange={(e) => setForm({ ...form, profissional_id: e.target.value })}>
                      <option value="">— Selecionar —</option>
                      {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}{p.especialidade ? ` — ${p.especialidade}` : ""}</option>)}
                      {!form.profissional_id && form.profissional && (
                        <option value="" disabled>Atual: {form.profissional}</option>
                      )}
                    </select>
                  ) : (
                    <input value={form.profissional} onChange={(e) => setForm({ ...form, profissional: e.target.value })} placeholder="Cadastre profissionais em /profissionais" />
                  )}
                </div>
              </div>
            </div>
            <div className="formGroup">
              <span className="formGroupLabel">Status & observações</span>
              <div className="formRow"><label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ConsultaStatus })}>
                  {(Object.keys(STATUS_LABEL) as ConsultaStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div className="formRow"><label>Observações</label><textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Notas internas sobre este atendimento" /></div>
            </div>
            {error && <div className="onboardingError">{error}</div>}
          </div>
          <footer className="modalFooter">
            <button className="secondaryButton" onClick={closeModal}>Cancelar</button>
            <button className="primaryButton" disabled={saving} onClick={handleSave}>{saving ? "Salvando…" : editingId ? "Salvar alterações" : "Agendar"}</button>
          </footer>
        </div>
      </div>
    )}
  </>;
}

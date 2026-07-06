"use client";

import { CalendarDays, Download, Filter, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

export default function ConsultasPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [cs, ps] = await Promise.all([
      supabase.from("consultas").select("*").order("data_hora", { ascending: true }),
      supabase.from("pacientes").select("*").eq("status", "ativo").order("nome"),
    ]);
    setConsultas((cs.data as Consulta[] | null) ?? []);
    setPacientes((ps.data as Paciente[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

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
    if (!query.trim()) return consultas;
    const q = query.toLowerCase();
    return consultas.filter(c => c.paciente_nome.toLowerCase().includes(q) || (c.servico ?? "").toLowerCase().includes(q) || (c.profissional ?? "").toLowerCase().includes(q));
  }, [consultas, query]);

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
    await supabase.from("consultas").update({ status }).eq("id", c.id);
    load();
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
        <div>
          <button className="dateButton"><CalendarDays size={16} /> Todos</button>
          <button className="secondaryButton"><Filter size={16} /> Filtros</button>
          <button className="iconButton" aria-label="Exportar consultas"><Download size={17} /></button>
        </div>
      </div>
      <div className="tableScroll">
        <table>
          <thead><tr><th>QUANDO</th><th>PACIENTE / SERVIÇO</th><th>PROFISSIONAL</th><th>VALOR</th><th>STATUS</th><th /></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", color: "#858d9f", fontSize: 13 }}>Carregando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: "48px 16px", textAlign: "center", color: "#858d9f", fontSize: 13 }}>{consultas.length === 0 ? "Nenhuma consulta cadastrada." : "Nenhuma consulta encontrada."}</td></tr>
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
      <div className="modalBackdrop" onClick={() => setModalOpen(false)}>
        <div className="modalCard" onClick={(e) => e.stopPropagation()}>
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

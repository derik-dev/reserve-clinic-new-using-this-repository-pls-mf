"use client";

import { Download, Filter, MessageSquare, Plus, Search, Send, UsersRound, X, Phone, Mail, FileText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { calcIdade, formatDate, initials, type Paciente } from "@/lib/db";

type FormState = {
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  data_nascimento: string;
  observacoes: string;
};

const emptyForm: FormState = { nome: "", telefone: "", email: "", cpf: "", data_nascimento: "", observacoes: "" };

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await Promise.race([
        supabase.from("pacientes").select("*").order("created_at", { ascending: false }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
      ]);
      setPacientes((data as Paciente[] | null) ?? []);
    } catch {
      setLoadError(true);
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return pacientes;
    const q = query.toLowerCase();
    return pacientes.filter(p => p.nome.toLowerCase().includes(q) || (p.telefone ?? "").includes(q) || (p.cpf ?? "").includes(q) || (p.email ?? "").toLowerCase().includes(q));
  }, [pacientes, query]);

  async function handleSave() {
    if (!form.nome.trim()) { setError("Informe o nome do paciente."); return; }
    setError(null);
    setSaving(true);
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) { setSaving(false); return; }
    const { error: err } = await supabase.from("pacientes").insert({
      perfil_id: session.user.id,
      nome: form.nome.trim(),
      telefone: form.telefone || null,
      email: form.email || null,
      cpf: form.cpf || null,
      data_nascimento: form.data_nascimento || null,
      observacoes: form.observacoes || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setForm(emptyForm);
    setModalOpen(false);
    load();
  }

  async function handleEdit() {
    if (!form.nome.trim() || !editingPaciente) { setEditError("Informe o nome do paciente."); return; }
    setEditError(null);
    setEditSaving(true);
    const { error: err } = await supabase.from("pacientes").update({
      nome: form.nome.trim(),
      telefone: form.telefone || null,
      email: form.email || null,
      cpf: form.cpf || null,
      data_nascimento: form.data_nascimento || null,
      observacoes: form.observacoes || null,
    }).eq("id", editingPaciente.id);
    setEditSaving(false);
    if (err) { setEditError(err.message); return; }
    setEditingPaciente(null);
    setForm(emptyForm);
    load();
  }

  function openEdit(p: Paciente) {
    setForm({ nome: p.nome, telefone: p.telefone ?? "", email: p.email ?? "", cpf: p.cpf ?? "", data_nascimento: p.data_nascimento ?? "", observacoes: p.observacoes ?? "" });
    setEditingPaciente(p);
    setSelectedPaciente(null);
    setEditError(null);
  }

  async function toggleStatus(p: Paciente) {
    const next = p.status === "ativo" ? "inativo" : "ativo";
    await supabase.from("pacientes").update({ status: next }).eq("id", p.id);
    load();
  }

  return <>
    <PageHeader title="Pacientes" description="Gerencie os cadastros e o histórico dos seus pacientes." actions={<button className="primaryButton" onClick={() => setModalOpen(true)}><Plus size={17} /> Novo paciente</button>} />
    <section className="panel dataPanel">
      <div className="tableToolbar">
        <label><Search size={17} /><input placeholder="Buscar por nome, telefone ou CPF" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
        <div>
          <button className="secondaryButton"><Filter size={16} /> Filtros</button>
          <button className="iconButton" aria-label="Exportar pacientes"><Download size={17} /></button>
        </div>
      </div>
      <div className="tableScroll">
        <table>
          <thead><tr><th>PACIENTE</th><th>CONTATO</th><th>IDADE</th><th>CADASTRADO EM</th><th>STATUS</th><th /></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "72px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Carregando…</td></tr>
            ) : loadError ? (
              <tr><td colSpan={6} style={{ padding: "72px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Não foi possível carregar os pacientes. <button className="linkButton" onClick={load}>Tentar novamente</button></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "72px 24px", color: "var(--text-muted)", textAlign: "center" }}>
                  <UsersRound size={38} strokeWidth={1.4} style={{ color: "var(--text-subtle)", opacity: .7 }} />
                  <div>
                    <strong style={{ display: "block", font: "600 16px var(--font-space)", color: "var(--text)", letterSpacing: "-.01em", marginBottom: 6 }}>{pacientes.length === 0 ? "Nenhum paciente cadastrado ainda" : "Nenhum paciente encontrado"}</strong>
                    <small style={{ display: "block", fontSize: 12, color: "var(--text-muted)", maxWidth: 320 }}>{pacientes.length === 0 ? "Cadastre seus pacientes para acompanhar histórico, contato e agendamentos." : "Ajuste a busca para encontrar outros pacientes."}</small>
                  </div>
                </div>
              </td></tr>
            ) : filtered.map(p => {
              const idade = calcIdade(p.data_nascimento);
              return <tr key={p.id} className="rowClickable" onClick={() => setSelectedPaciente(p)}>
                <td><div className="patientCell"><div className="tableAvatar">{initials(p.nome)}</div><div><strong>{p.nome}</strong>{p.cpf && <small>CPF {p.cpf}</small>}</div></div></td>
                <td><strong>{p.telefone ?? "—"}</strong>{p.email && <small>{p.email}</small>}</td>
                <td>{idade != null ? `${idade} anos` : "—"}</td>
                <td>{formatDate(p.created_at)}</td>
                <td><button onClick={(e) => { e.stopPropagation(); toggleStatus(p); }} className={`statusBadge ${p.status === "ativo" ? "statusAtivo" : "statusConcluida"}`} style={{ border: 0, cursor: "pointer" }}>{p.status === "ativo" ? "Ativo" : "Inativo"}</button></td>
                <td />
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <div className="tablePagination"><span>Mostrando {filtered.length} de {pacientes.length} pacientes</span><div><button disabled>←</button><button className="current">1</button><button disabled>→</button></div></div>
    </section>

    {selectedPaciente && (
      <PacientePopup paciente={selectedPaciente} onClose={() => setSelectedPaciente(null)} onEdit={() => openEdit(selectedPaciente)} />
    )}

    {editingPaciente && (
      <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) { setEditingPaciente(null); setForm(emptyForm); } }}>
        <div className="modalCard">
          <header className="modalHeader"><h2>Editar paciente</h2><button className="iconButton" onClick={() => { setEditingPaciente(null); setForm(emptyForm); }} aria-label="Fechar"><X size={17} /></button></header>
          <div className="modalBody">
            <div className="formGroup">
              <div className="formRow"><label>Nome completo</label><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Maria da Silva" /></div>
              <div className="formRow split">
                <div className="formRow"><label>Telefone</label><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" /></div>
                <div className="formRow"><label>E-mail</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="paciente@email.com" /></div>
              </div>
              <div className="formRow split">
                <div className="formRow"><label>CPF</label><input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
                <div className="formRow"><label>Data de nascimento</label><input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} /></div>
              </div>
              <div className="formRow"><label>Observações</label><textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Alergias, convênio, etc." /></div>
            </div>
            {editError && <div className="onboardingError">{editError}</div>}
          </div>
          <footer className="modalFooter">
            <button className="secondaryButton" onClick={() => { setEditingPaciente(null); setForm(emptyForm); }}>Cancelar</button>
            <button className="primaryButton" disabled={editSaving} onClick={handleEdit}>{editSaving ? "Salvando…" : "Salvar alterações"}</button>
          </footer>
        </div>
      </div>
    )}

    {modalOpen && (
      <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <div className="modalCard">
          <header className="modalHeader"><h2>Novo paciente</h2><button className="iconButton" onClick={() => setModalOpen(false)} aria-label="Fechar"><X size={17} /></button></header>
          <div className="modalBody">
            <div className="formGroup">
              <div className="formRow"><label>Nome completo</label><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Maria da Silva" /></div>
              <div className="formRow split">
                <div className="formRow"><label>Telefone</label><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" /></div>
                <div className="formRow"><label>E-mail</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="paciente@email.com" /></div>
              </div>
              <div className="formRow split">
                <div className="formRow"><label>CPF</label><input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
                <div className="formRow"><label>Data de nascimento</label><input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} /></div>
              </div>
              <div className="formRow"><label>Observações</label><textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Alergias, convênio, etc." /></div>
            </div>
            {error && <div className="onboardingError">{error}</div>}
          </div>
          <footer className="modalFooter">
            <button className="secondaryButton" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="primaryButton" disabled={saving} onClick={handleSave}>{saving ? "Salvando…" : "Cadastrar"}</button>
          </footer>
        </div>
      </div>
    )}
  </>;
}

function PacientePopup({ paciente: p, onClose, onEdit }: { paciente: Paciente; onClose: () => void; onEdit: () => void }) {
  const idade = calcIdade(p.data_nascimento);
  const nascimento = p.data_nascimento ? new Date(p.data_nascimento + "T00:00").toLocaleDateString("pt-BR") : null;
  const isAtivo = p.status === "ativo";
  const [followUp, setFollowUp] = useState(false);
  const [msg, setMsg] = useState(`Olá, ${p.nome.split(" ")[0]}! Tudo bem? Passando para ver se você precisa agendar uma consulta. 😊`);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<"ok" | "erro" | null>(null);

  async function enviarMensagem() {
    if (!p.telefone || !msg.trim()) return;
    setSending(true);
    setSendResult(null);
    const res = await fetch("/api/zapi-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: p.telefone, message: msg }),
    });
    setSendResult(res.ok ? "ok" : "erro");
    setSending(false);
  }

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="ppopup" onClick={(e) => e.stopPropagation()}>
        <button className="iconButton ppopupClose" onClick={onClose} aria-label="Fechar"><X size={15} /></button>

        {/* Perfil centralizado */}
        <div className="ppopupProfile">
          <div className="ppopupAvatar">{initials(p.nome)}</div>
          <h2 className="ppopupName">{p.nome}</h2>
          <span className={`statusBadge ${isAtivo ? "statusAtivo" : "statusConcluida"}`}>{isAtivo ? "Ativo" : "Inativo"}</span>
          {idade != null && <span className="ppopupAge">{idade} anos</span>}
        </div>

        {/* Contatos clicáveis */}
        {(p.telefone || p.email) && (
          <div className="ppopupContacts">
            {p.telefone && (
              <a className="ppopupContact" href={`tel:${p.telefone}`} onClick={(e) => e.stopPropagation()}>
                <Phone size={15} />
                <span>{p.telefone}</span>
              </a>
            )}
            {p.email && (
              <a className="ppopupContact" href={`mailto:${p.email}`} onClick={(e) => e.stopPropagation()}>
                <Mail size={15} />
                <span>{p.email}</span>
              </a>
            )}
          </div>
        )}

        {/* Dados pessoais */}
        <div className="ppopupMeta">
          {nascimento && <div className="ppopupMetaItem"><span>Nascimento</span><strong>{nascimento}</strong></div>}
          {p.cpf && <div className="ppopupMetaItem"><span>CPF</span><strong>{p.cpf}</strong></div>}
          <div className="ppopupMetaItem"><span>Cadastrado</span><strong>{formatDate(p.created_at)}</strong></div>
        </div>

        {p.observacoes && (
          <div className="ppopupObs">
            <FileText size={12} />
            <p>{p.observacoes}</p>
          </div>
        )}

        {/* Follow-up WhatsApp */}
        {followUp ? (
          <div className="ppopupFollowUp">
            <textarea
              className="ppopupMsg"
              rows={3}
              value={msg}
              onChange={(e) => { setMsg(e.target.value); setSendResult(null); }}
              placeholder="Digite a mensagem..."
            />
            {sendResult === "ok" && <p className="ppopupSendOk">✓ Mensagem enviada!</p>}
            {sendResult === "erro" && <p className="ppopupSendErr">Erro ao enviar. Verifique o Z-API.</p>}
            <div className="ppopupFollowUpActions">
              <button className="secondaryButton" onClick={() => { setFollowUp(false); setSendResult(null); }}>Cancelar</button>
              <button className="primaryButton" disabled={sending || !msg.trim()} onClick={enviarMensagem}>
                <Send size={14} /> {sending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="ppopupFooter">
            {p.telefone && (
              <button className="secondaryButton ppopupFollowUpBtn" onClick={() => setFollowUp(true)}>
                <MessageSquare size={14} /> Follow-up
              </button>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="secondaryButton" onClick={onClose}>Fechar</button>
              <button className="primaryButton" onClick={onEdit}>Editar paciente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PacienteField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 14px", background: "rgba(255,255,255,.03)", border: "1px solid var(--border-soft)", borderRadius: 10 }}>
      <span style={{ fontSize: 9, color: "var(--text-subtle)", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

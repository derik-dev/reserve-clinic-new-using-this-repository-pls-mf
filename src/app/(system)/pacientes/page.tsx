"use client";

import { Download, Filter, Plus, Search, UsersRound, X } from "lucide-react";
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
              return <tr key={p.id}>
                <td><div className="patientCell"><div className="tableAvatar">{initials(p.nome)}</div><div><strong>{p.nome}</strong>{p.cpf && <small>CPF {p.cpf}</small>}</div></div></td>
                <td><strong>{p.telefone ?? "—"}</strong>{p.email && <small>{p.email}</small>}</td>
                <td>{idade != null ? `${idade} anos` : "—"}</td>
                <td>{formatDate(p.created_at)}</td>
                <td><button onClick={() => toggleStatus(p)} className={`statusBadge ${p.status === "ativo" ? "statusAtivo" : "statusConcluida"}`} style={{ border: 0, cursor: "pointer" }}>{p.status === "ativo" ? "Ativo" : "Inativo"}</button></td>
                <td />
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <div className="tablePagination"><span>Mostrando {filtered.length} de {pacientes.length} pacientes</span><div><button disabled>←</button><button className="current">1</button><button disabled>→</button></div></div>
    </section>

    {modalOpen && (
      <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <div className="modalCard">
          <header className="modalHeader"><h2>Novo paciente</h2><button className="iconButton" onClick={() => setModalOpen(false)} aria-label="Fechar"><X size={17} /></button></header>
          <div className="modalBody">
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

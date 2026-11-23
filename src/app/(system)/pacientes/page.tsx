"use client";

import { Download, Plus, Send, X, Phone, Mail, FileText } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminDialog, ConfirmDialog, OperationNotice, Pagination, RecordAvatar, RowActions, SearchInput, TableState, TableToolbar, type Confirmation } from "@/components/AdminTable";
import { recordsQuery, useAdminRecords } from "@/components/useAdminRecords";
import { downloadHTML } from "@/lib/adminTable";
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
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [editingPaciente, setEditingPaciente] = useState<Paciente | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const { records: pacientes, total, loading, loadError, load } = useAdminRecords<Paciente>({ table: "pacientes", query, status, page, onPageChange: setPage });
  const hasFilters = !!query || status !== "todos";
  function clearFilters() { setQuery(""); setStatus("todos"); setPage(1); }

  async function handleSave() {
    if (!form.nome.trim()) { setError("Informe o nome do paciente."); return; }
    setError(null);
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) throw new Error("Sessão expirada. Entre novamente.");
      const { error: err } = await supabase.from("pacientes").insert({
        perfil_id: session.user.id,
        nome: form.nome.trim(),
        telefone: form.telefone || null,
        email: form.email || null,
        cpf: form.cpf || null,
        data_nascimento: form.data_nascimento || null,
        observacoes: form.observacoes || null,
      });
      if (err) throw err;
      setForm(emptyForm);
      setModalOpen(false);
      setNotice({ ok: true, message: "Paciente cadastrado." });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível cadastrar o paciente."); }
    finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!form.nome.trim() || !editingPaciente) { setEditError("Informe o nome do paciente."); return; }
    setEditError(null);
    setEditSaving(true);
    try {
      const { error: err } = await supabase.from("pacientes").update({
        nome: form.nome.trim(),
        telefone: form.telefone || null,
        email: form.email || null,
        cpf: form.cpf || null,
        data_nascimento: form.data_nascimento || null,
        observacoes: form.observacoes || null,
      }).eq("id", editingPaciente.id);
      if (err) throw err;
      setEditingPaciente(null);
      setForm(emptyForm);
      setNotice({ ok: true, message: "Paciente atualizado." });
      await load();
    } catch (err) { setEditError(err instanceof Error ? err.message : "Não foi possível atualizar o paciente."); }
    finally { setEditSaving(false); }
  }

  function openEdit(p: Paciente) {
    setForm({ nome: p.nome, telefone: p.telefone ?? "", email: p.email ?? "", cpf: p.cpf ?? "", data_nascimento: p.data_nascimento ?? "", observacoes: p.observacoes ?? "" });
    setEditingPaciente(p);
    setSelectedPaciente(null);
    setEditError(null);
  }

  async function toggleStatus(p: Paciente) {
    setBusy(true);
    try {
      const next = p.status === "ativo" ? "inativo" : "ativo";
      const { error } = await supabase.from("pacientes").update({ status: next }).eq("id", p.id);
      if (error) throw error;
      setNotice({ ok: true, message: next === "ativo" ? "Paciente ativado." : "Paciente desativado." }); await load();
    } catch { setNotice({ ok: false, message: "Não foi possível alterar o status do paciente." }); }
    finally { setBusy(false); setConfirmation(null); }
  }
  function requestStatus(p: Paciente) {
    if (p.status === "ativo") setConfirmation({ title: "Desativar paciente?", description: "O cadastro de " + p.nome + " será marcado como inativo.", label: "Desativar paciente", onConfirm: () => toggleStatus(p) });
    else void toggleStatus(p);
  }
  async function exportCSV() {
    setExporting(true);
    try {
      const records: Paciente[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await recordsQuery({ table: "pacientes", query, status }).range(offset, offset + 499).abortSignal(AbortSignal.timeout(15000));
        if (error) throw error;
        const batch = (data ?? []) as Paciente[];
        records.push(...batch); if (batch.length < 500) break;
      }
      downloadHTML("pacientes.html", "Pacientes", [["Paciente", "Telefone", "E-mail", "CPF", "Cadastro", "Status"], ...records.map(p => [p.nome, p.telefone ?? "", p.email ?? "", p.cpf ?? "", formatDate(p.created_at), p.status])]);
      setNotice({ ok: true, message: records.length + " paciente(s) exportado(s)." });
    } catch { setNotice({ ok: false, message: "Não foi possível exportar os pacientes." }); }
    finally { setExporting(false); }
  }

  return <div className="adminPage">
    <PageHeader title="Pacientes" actions={<button className="primaryButton" onClick={() => { setForm(emptyForm); setError(null); setModalOpen(true); }}><Plus size={17} /> Novo paciente</button>} />
    <OperationNotice notice={notice} />
    <section className="panel dataPanel adminPanel" aria-label="Listagem de pacientes">
      <TableToolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nome, telefone ou CPF" />
        <select aria-label="Filtrar pacientes por status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="todos">Todos os status</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option></select>
        <button className="secondaryButton adminExport" onClick={exportCSV} disabled={exporting || loading || loadError || total === 0}><Download size={16} />{exporting ? "Exportando…" : "Exportar"}</button>
      </TableToolbar>
      <div className="tableScroll adminTableScroll" tabIndex={0} role="region" aria-label="Tabela de pacientes. Role horizontalmente para ver todas as colunas." aria-busy={loading}>
        <table className="adminTable adminPacientesTable">
          <thead><tr><th scope="col">Paciente</th><th scope="col">Contato</th><th scope="col">Data de cadastro</th><th scope="col">Status</th><th scope="col" className="adminActionsHeading">Ações</th></tr></thead>
          <tbody>{loading || loadError || pacientes.length === 0 ? <TableState columns={5} loading={loading} error={loadError} empty={hasFilters ? "Nenhum paciente encontrado." : "Nenhum paciente cadastrado."} onRetry={load} onClear={hasFilters ? clearFilters : undefined} /> : pacientes.map(p => {
            const idade = calcIdade(p.data_nascimento);
            return <tr key={p.id} className="rowClickable" onClick={() => setSelectedPaciente(p)}>
              <td><div className="patientCell"><RecordAvatar name={p.nome} /><div><button className="adminName" onClick={(e) => { e.stopPropagation(); setSelectedPaciente(p); }}>{p.nome}</button>{idade != null && <small>{idade} anos</small>}</div></div></td>
              <td><div className="adminContact">{p.telefone && <span>{p.telefone}</span>}{p.email && <span>{p.email}</span>}{!p.telefone && !p.email && "—"}</div></td>
              <td className="adminDate">{formatDate(p.created_at)}</td>
              <td><StatusBadge status={p.status === "ativo" ? "Ativo" : "Inativo"} /></td>
              <td onClick={(e) => e.stopPropagation()}><div className="adminRowActions"><RowActions name={p.nome} disabled={busy} actions={[
                { label: "Abrir cadastro", onClick: () => setSelectedPaciente(p) }, { label: "Editar paciente", onClick: () => openEdit(p) },
                { label: p.status === "ativo" ? "Desativar paciente" : "Ativar paciente", danger: p.status === "ativo", onClick: () => requestStatus(p) },
              ]} /></div></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      {!loadError && <Pagination page={page} total={total} onChange={setPage} disabled={loading} />}
    </section>
    {confirmation && <ConfirmDialog confirmation={confirmation} busy={busy} onClose={() => setConfirmation(null)} />}

    {selectedPaciente && (
      <PacientePopup paciente={selectedPaciente} onClose={() => setSelectedPaciente(null)} onEdit={() => openEdit(selectedPaciente)} />
    )}

    {editingPaciente && (
      <AdminDialog title="Editar paciente" busy={editSaving} onClose={() => { setEditingPaciente(null); setForm(emptyForm); }}>
          <header className="modalHeader"><h2>Editar paciente</h2><button className="iconButton" disabled={editSaving} onClick={() => { setEditingPaciente(null); setForm(emptyForm); }} aria-label="Fechar"><X size={17} /></button></header>
          <div className="modalBody">
            <div className="formGroup">
              <div className="formRow"><label htmlFor="admin-nome-completo">Nome completo</label><input id="admin-nome-completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Maria da Silva" /></div>
              <div className="formRow split">
                <div className="formRow"><label htmlFor="admin-telefone">Telefone</label><input id="admin-telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" /></div>
                <div className="formRow"><label htmlFor="admin-e-mail">E-mail</label><input id="admin-e-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="paciente@email.com" /></div>
              </div>
              <div className="formRow split">
                <div className="formRow"><label htmlFor="admin-cpf">CPF</label><input id="admin-cpf" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
                <div className="formRow"><label htmlFor="admin-data-de-nascimento">Data de nascimento</label><input id="admin-data-de-nascimento" type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} /></div>
              </div>
              <div className="formRow"><label htmlFor="admin-observacoes">Observações</label><textarea id="admin-observacoes" rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Alergias, convênio, etc." /></div>
            </div>
            {editError && <div className="onboardingError">{editError}</div>}
          </div>
          <footer className="modalFooter">
            <button className="secondaryButton" disabled={editSaving} onClick={() => { setEditingPaciente(null); setForm(emptyForm); }}>Cancelar</button>
            <button className="primaryButton" disabled={editSaving} onClick={handleEdit}>{editSaving ? "Salvando…" : "Salvar alterações"}</button>
          </footer>
      </AdminDialog>
    )}

    {modalOpen && (
      <AdminDialog title="Novo paciente" busy={saving} onClose={() => setModalOpen(false)}>
          <header className="modalHeader"><h2>Novo paciente</h2><button className="iconButton" disabled={saving} onClick={() => setModalOpen(false)} aria-label="Fechar"><X size={17} /></button></header>
          <div className="modalBody">
            <div className="formGroup">
              <div className="formRow"><label htmlFor="admin-nome-completo">Nome completo</label><input id="admin-nome-completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Maria da Silva" /></div>
              <div className="formRow split">
                <div className="formRow"><label htmlFor="admin-telefone">Telefone</label><input id="admin-telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" /></div>
                <div className="formRow"><label htmlFor="admin-e-mail">E-mail</label><input id="admin-e-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="paciente@email.com" /></div>
              </div>
              <div className="formRow split">
                <div className="formRow"><label htmlFor="admin-cpf">CPF</label><input id="admin-cpf" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
                <div className="formRow"><label htmlFor="admin-data-de-nascimento">Data de nascimento</label><input id="admin-data-de-nascimento" type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} /></div>
              </div>
              <div className="formRow"><label htmlFor="admin-observacoes">Observações</label><textarea id="admin-observacoes" rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Alergias, convênio, etc." /></div>
            </div>
            {error && <div className="onboardingError">{error}</div>}
          </div>
          <footer className="modalFooter">
            <button className="secondaryButton" disabled={saving} onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="primaryButton" disabled={saving} onClick={handleSave}>{saving ? "Salvando…" : "Cadastrar"}</button>
          </footer>
      </AdminDialog>
    )}
  </div>;
}

function PacientePopup({ paciente: p, onClose, onEdit }: { paciente: Paciente; onClose: () => void; onEdit: () => void }) {
  const idade = calcIdade(p.data_nascimento);
  const nascimento = p.data_nascimento ? new Date(p.data_nascimento + "T00:00").toLocaleDateString("pt-BR") : null;
  const isAtivo = p.status === "ativo";
  const [followUp, setFollowUp] = useState(false);
  const [msg, setMsg] = useState(`Olá, ${p.nome.split(" ")[0]}! Tudo bem? Passando para ver se você precisa agendar uma consulta. 😊`);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  async function enviarMensagem() {
    if (!p.telefone || !msg.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setSendResult({ ok: false, msg: "Sessão expirada. Entre novamente." });
        setSending(false);
        return;
      }
      const res = await fetch("/api/zapi-send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ phone: p.telefone, message: msg }),
      });
      const data = await res.json().catch(() => ({}));
      setSendResult(res.ok ? { ok: true, msg: "Mensagem enviada!" } : { ok: false, msg: data.error ?? "Erro desconhecido." });
    } catch {
      setSendResult({ ok: false, msg: "Sem conexão com o servidor." });
    }
    setSending(false);
  }

  return (
    <AdminDialog title={"Cadastro de " + p.nome} className="ppopup" onClose={onClose} busy={sending}>
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
            {sendResult && (
              <p className={sendResult.ok ? "ppopupSendOk" : "ppopupSendErr"}>
                {sendResult.ok ? "✓ " : ""}{sendResult.msg}
              </p>
            )}
            <div className="ppopupFollowUpActions">
              <button className="secondaryButton" onClick={() => { setFollowUp(false); setSendResult(null); setSending(false); }}>Cancelar</button>
              <button className="primaryButton" disabled={sending || !msg.trim()} onClick={enviarMensagem}>
                <Send size={14} /> {sending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="ppopupFooter">
            {p.telefone && (
              <button className="ppopupFollowUpBtn" onClick={() => setFollowUp(true)}>
                <WhatsAppIcon /> Follow-up
              </button>
            )}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button className="secondaryButton" onClick={onClose}>Fechar</button>
              <button className="primaryButton" onClick={onEdit}>Editar paciente</button>
            </div>
          </div>
        )}
    </AdminDialog>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

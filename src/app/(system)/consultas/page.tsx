"use client";

import { CalendarDays, Download, Plus, Trash2, X, Clock, User, Stethoscope, BanknoteIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminDialog, ConfirmDialog, OperationNotice, Pagination, RecordAvatar, RowActions, SearchInput, TableState, TableToolbar, TABLE_PAGE_SIZE, type Confirmation } from "@/components/AdminTable";
import { downloadHTML, searchFilter } from "@/lib/adminTable";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, formatTime, initials, STATUS_LABEL, type Consulta, type ConsultaStatus, type Paciente } from "@/lib/db";

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


type Periodo = "todos" | "hoje" | "semana" | "mes";
const PERIODO_LABEL: Record<Periodo, string> = { todos: "Todos os períodos", hoje: "Hoje", semana: "Esta semana", mes: "Este mês" };
const STATUS_TABS: { value: ConsultaStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todas" }, { value: "aguardando", label: "Aguardando" },
  { value: "confirmada", label: "Confirmadas" }, { value: "concluida", label: "Concluídas" }, { value: "cancelada", label: "Canceladas" },
];

function consultaQuery(query: string, periodo: Periodo, head = false) {
  let request = supabase.from("consultas").select(head ? "id" : "*", { count: "exact", head });
  if (query.trim()) request = request.or(searchFilter(["paciente_nome", "servico", "profissional"], query));
  if (periodo !== "todos") {
    const from = new Date(); from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    if (periodo === "semana") {
      from.setDate(from.getDate() - ((from.getDay() + 6) % 7));
      to.setTime(from.getTime()); to.setDate(to.getDate() + 7);
    } else if (periodo === "mes") {
      from.setDate(1); to.setTime(from.getTime()); to.setMonth(to.getMonth() + 1);
    } else to.setDate(to.getDate() + 1);
    request = request.gte("data_hora", from.toISOString()).lt("data_hora", to.toISOString());
  }
  return request;
}

export default function ConsultasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>("todos");
  const [statusFiltro, setStatusFiltro] = useState<ConsultaStatus | "todos">("todos");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [originalStatus, setOriginalStatus] = useState<ConsultaStatus | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const requestId = useRef(0);
  const today = useMemo(() => new Date().toLocaleDateString("pt-BR"), []);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(query); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true); setLoadError(false);
    try {
      let request = consultaQuery(search, periodo);
      if (statusFiltro !== "todos") request = request.eq("status", statusFiltro);
      const [result, counts] = await Promise.all([
        request.order("created_at", { ascending: sortOrder === "asc" }).order("id").range((page - 1) * TABLE_PAGE_SIZE, page * TABLE_PAGE_SIZE - 1).abortSignal(AbortSignal.timeout(10000)),
        Promise.all(STATUS_TABS.map((tab) => {
          const count = consultaQuery(search, periodo, true);
          return (tab.value === "todos" ? count : count.eq("status", tab.value)).abortSignal(AbortSignal.timeout(10000));
        })),
      ]);
      if (result.error) throw result.error;
      for (const count of counts) if (count.error) throw count.error;
      if (id !== requestId.current) return;
      const lastPage = Math.max(1, Math.ceil((result.count ?? 0) / TABLE_PAGE_SIZE));
      if (page > lastPage) { setPage(lastPage); return; }
      setConsultas((result.data ?? []) as unknown as Consulta[]);
      setTotal(result.count ?? 0);
      setTabCounts(Object.fromEntries(STATUS_TABS.map((tab, index) => [tab.value, counts[index].count ?? 0])));
    } catch {
      if (id === requestId.current) { setLoadError(true); setConsultas([]); }
    } finally { if (id === requestId.current) setLoading(false); }
  }, [search, periodo, statusFiltro, sortOrder, page]);

  useEffect(() => { void load(); return () => { requestId.current++; }; }, [load]);
  useEffect(() => { try { localStorage.setItem("consultas-seen-at", new Date().toISOString()); } catch {} }, []);

  useEffect(() => {
    if (!modalOpen) return;
    let active = true;
    Promise.all([
      supabase.from("pacientes").select("id, nome, telefone, email").eq("status", "ativo").order("nome").abortSignal(AbortSignal.timeout(10000)),
      supabase.from("profissionais").select("id, nome, especialidade").eq("ativo", true).order("nome").abortSignal(AbortSignal.timeout(10000)),
    ]).then(([ps, pr]) => {
      if (!active) return;
      if (ps.error || pr.error) { setError("Não foi possível carregar pacientes e profissionais. Feche e tente novamente."); return; }
      setPacientes((ps.data ?? []) as Paciente[]); setProfissionais(pr.data ?? []);
    }).catch(() => { if (active) setError("Não foi possível carregar pacientes e profissionais."); });
    return () => { active = false; };
  }, [modalOpen]);

  useEffect(() => {
    if (searchParams.get("nova") === "1") {
      setEditingId(null); setForm({ ...emptyForm, data: searchParams.get("data") ?? "", hora: searchParams.get("hora") ?? "" });
      setError(null); setModalOpen(true); router.replace("/consultas"); return;
    }
    const id = searchParams.get("editar");
    if (!id) return;
    let active = true;
    supabase.from("consultas").select("*").eq("id", id).abortSignal(AbortSignal.timeout(10000)).single().then(({ data, error }) => {
      if (!active) return;
      if (error || !data) setNotice({ ok: false, message: "Não foi possível abrir a consulta." });
      else openEdit(data as Consulta);
      router.replace("/consultas");
    });
    return () => { active = false; };
  }, [searchParams, router]);

  function openEdit(c: Consulta) {
    setOriginalStatus(c.status);
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
    if (editingId && originalStatus !== "cancelada" && form.status === "cancelada" && !window.confirm("Cancelar a consulta de " + nome + "?")) return;
    setError(null);
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) throw new Error("Sessão expirada. Entre novamente.");
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
      if (err) throw err;
      closeModal();
      setNotice({ ok: true, message: editingId ? "Consulta atualizada." : "Consulta criada." });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar a consulta.");
    } finally { setSaving(false); }
  }


  async function runOperation(action: () => Promise<void>, message: string) {
    setBusy(true); setNotice(null);
    try { await action(); setSelectedConsulta(null); setNotice({ ok: true, message }); await load(); }
    catch (err) { setNotice({ ok: false, message: err instanceof Error ? err.message : "Não foi possível concluir a operação." }); }
    finally { setBusy(false); setConfirmation(null); }
  }

  async function updateStatus(c: Consulta, status: ConsultaStatus) {
    await runOperation(async () => {
      let pacienteId = c.paciente_id;
      if (status === "confirmada" && !c.paciente_id) {
        const { data: session, error: sessionError } = await supabase.auth.getUser();
        if (sessionError || !session.user) throw new Error("Sessão expirada. Entre novamente.");
        const { data: existente, error: lookupError } = await supabase.from("pacientes").select("id").eq("perfil_id", session.user.id).ilike("nome", c.paciente_nome).maybeSingle();
        if (lookupError) throw lookupError;
        if (existente) pacienteId = existente.id;
        else {
          const { data: novo, error: patientError } = await supabase.from("pacientes").insert({ perfil_id: session.user.id, nome: c.paciente_nome, telefone: c.paciente_telefone ?? null, email: c.paciente_email ?? null }).select("id").single();
          if (patientError) throw patientError;
          pacienteId = novo.id;
        }
      }
      const { error } = await supabase.from("consultas").update({ status, paciente_id: pacienteId }).eq("id", c.id);
      if (error) throw error;
    }, "Consulta " + STATUS_LABEL[status].toLowerCase() + ".");
  }

  function requestStatus(c: Consulta, status: ConsultaStatus) {
    setSelectedConsulta(null);
    if (status === "cancelada") setConfirmation({ title: "Cancelar consulta?", description: "A consulta de " + c.paciente_nome + " será marcada como cancelada.", label: "Cancelar consulta", onConfirm: () => updateStatus(c, status) });
    else void updateStatus(c, status);
  }

  function requestDelete(c: Consulta) {
    setSelectedConsulta(null);
    setConfirmation({ title: "Excluir consulta?", description: "A consulta de " + c.paciente_nome + " será excluída permanentemente. Esta ação não pode ser desfeita.", label: "Excluir consulta", onConfirm: () => runOperation(async () => {
      const { error } = await supabase.from("consultas").delete().eq("id", c.id);
      if (error) throw error;
    }, "Consulta excluída.") });
  }

  async function exportCSV() {
    setExporting(true);
    try {
      const records: Consulta[] = [];
      for (let offset = 0; ; offset += 500) {
        let request = consultaQuery(search, periodo);
        if (statusFiltro !== "todos") request = request.eq("status", statusFiltro);
        const { data, error } = await request.order("created_at", { ascending: sortOrder === "asc" }).order("id").range(offset, offset + 499).abortSignal(AbortSignal.timeout(15000));
        if (error) throw error;
        const batch = (data ?? []) as unknown as Consulta[];
        records.push(...batch);
        if (batch.length < 500) break;
      }
      downloadHTML("consultas_" + new Date().toISOString().slice(0, 10) + ".html", "Consultas", [
        ["Data", "Hora", "Paciente", "Serviço", "Profissional", "Valor (R$)", "Status"],
        ...records.map(c => [formatDate(c.data_hora), formatTime(c.data_hora), c.paciente_nome, c.servico ?? "", c.profissional ?? "", c.valor ?? "", STATUS_LABEL[c.status]]),
      ]);
      setNotice({ ok: true, message: records.length + " consulta(s) exportada(s)." });
    } catch { setNotice({ ok: false, message: "Não foi possível exportar as consultas. Tente novamente." }); }
    finally { setExporting(false); }
  }

  function clearFilters() { setQuery(""); setSearch(""); setPeriodo("todos"); setStatusFiltro("todos"); setPage(1); }
  const hasFilters = !!query || periodo !== "todos" || statusFiltro !== "todos";

  return <div className="adminPage">
    <PageHeader title="Consultas" actions={<button className="primaryButton" onClick={() => { setEditingId(null); setForm(emptyForm); setError(null); setModalOpen(true); }}><Plus size={17} /> Nova consulta</button>} />
    <OperationNotice notice={notice} />
    <section className="panel dataPanel adminPanel" aria-label="Listagem de consultas">
      <TableToolbar tabs={STATUS_TABS.map(tab => <button key={tab.value} aria-pressed={statusFiltro === tab.value} className={statusFiltro === tab.value ? "isSelected" : ""} onClick={() => { setStatusFiltro(tab.value); setPage(1); }}>{tab.label}<span>{loading ? "—" : tabCounts[tab.value] ?? 0}</span></button>)}>
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar paciente, serviço ou profissional" />
        <select aria-label="Ordenar consultas" value={sortOrder} onChange={(e) => { setSortOrder(e.target.value as "asc" | "desc"); setPage(1); }}><option value="desc">Cadastro: mais recente</option><option value="asc">Cadastro: mais antigo</option></select>
        <select aria-label="Filtrar por período" value={periodo} onChange={(e) => { setPeriodo(e.target.value as Periodo); setPage(1); }}>{Object.entries(PERIODO_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <button className="secondaryButton adminExport" disabled={exporting || loading || loadError || total === 0} onClick={exportCSV}><Download size={16} />{exporting ? "Exportando…" : "Exportar"}</button>
      </TableToolbar>
      <div className="tableScroll adminTableScroll" tabIndex={0} role="region" aria-label="Tabela de consultas. Role horizontalmente para ver todas as colunas." aria-busy={loading}>
        <table className="adminTable adminConsultasTable">
          <thead><tr><th scope="col">Data e horário</th><th scope="col">Paciente</th><th scope="col">Serviço</th><th scope="col">Profissional</th><th scope="col" className="adminNumeric">Valor</th><th scope="col">Status</th><th scope="col" className="adminActionsHeading">Ações</th></tr></thead>
          <tbody>{loading || loadError || consultas.length === 0 ? <TableState columns={7} loading={loading} error={loadError} empty={hasFilters ? "Nenhuma consulta encontrada." : "Nenhuma consulta registrada."} onRetry={load} onClear={hasFilters ? clearFilters : undefined} /> : consultas.map(c => <tr key={c.id} onClick={() => setSelectedConsulta(c)} className="rowClickable">
            <td className="adminDate"><strong>{new Date(c.data_hora).toLocaleDateString("pt-BR") === today ? "Hoje" : formatDate(c.data_hora)} · {formatTime(c.data_hora)}</strong><small>{c.duracao_min} min</small></td>
            <td><div className="patientCell"><RecordAvatar name={c.paciente_nome} /><button className="adminName" onClick={(e) => { e.stopPropagation(); setSelectedConsulta(c); }}>{c.paciente_nome}</button></div></td>
            <td>{c.servico ?? "—"}</td><td>{c.profissional ?? "—"}</td><td className="adminNumeric">{formatCurrency(c.valor)}</td>
            <td><StatusBadge status={c.status === "aguardando" ? "Aguardando confirmação" : STATUS_LABEL[c.status]} /></td>
            <td onClick={(e) => e.stopPropagation()}><div className="adminRowActions">{c.status === "aguardando" && <button className="adminQuickAction" disabled={busy} onClick={() => requestStatus(c, "confirmada")}>Confirmar</button>}<RowActions name={c.paciente_nome} disabled={busy} actions={[
              { label: "Ver detalhes", onClick: () => setSelectedConsulta(c) }, { label: "Editar consulta", onClick: () => openEdit(c) },
              ...(["aguardando", "confirmada", "concluida", "cancelada"] as ConsultaStatus[]).filter(s => s !== c.status).map(s => ({ label: s === "aguardando" ? "Aguardar confirmação" : s === "confirmada" ? "Confirmar consulta" : s === "concluida" ? "Concluir consulta" : "Cancelar consulta", danger: s === "cancelada", onClick: () => requestStatus(c, s) })),
              { label: "Excluir consulta", danger: true, onClick: () => requestDelete(c) },
            ]} /></div></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!loadError && <Pagination page={page} total={total} onChange={setPage} disabled={loading} />}
    </section>
    {confirmation && <ConfirmDialog confirmation={confirmation} busy={busy} onClose={() => setConfirmation(null)} />}
    {selectedConsulta && <ConsultaDetalhePopup consulta={selectedConsulta} onClose={() => setSelectedConsulta(null)} onEdit={() => { openEdit(selectedConsulta); setSelectedConsulta(null); }} onStatusChange={(s) => requestStatus(selectedConsulta, s)} onDelete={() => requestDelete(selectedConsulta)} />}

    {modalOpen && (
      <AdminDialog title={editingId ? "Editar consulta" : "Nova consulta"} onClose={closeModal} busy={saving}>
          <header className="modalHeader"><h2>{editingId ? "Editar consulta" : "Nova consulta"}</h2><button className="iconButton" disabled={saving} onClick={closeModal} aria-label="Fechar"><X size={17} /></button></header>
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
                <div className="formRow"><label htmlFor="admin-data">Data</label><input id="admin-data" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                <div className="formRow"><label htmlFor="admin-horario">Horário</label><input id="admin-horario" type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></div>
              </div>
              <div className="formRow split">
                <div className="formRow"><label htmlFor="admin-duracao-min-">Duração (min)</label><input id="admin-duracao-min-" type="number" value={form.duracao_min} onChange={(e) => setForm({ ...form, duracao_min: e.target.value })} /></div>
                <div className="formRow"><label htmlFor="admin-valor-r-">Valor (R$)</label><input id="admin-valor-r-" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="150,00" /></div>
              </div>
            </div>
            <div className="formGroup">
              <span className="formGroupLabel">Detalhes</span>
              <div className="formRow split">
                <div className="formRow"><label htmlFor="admin-servico">Serviço</label><input id="admin-servico" value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })} placeholder="Consulta clínica" /></div>
                <div className="formRow"><label>Profissional</label>
                  {profissionais.length > 0 ? (
                    <select value={form.profissional_id} onChange={(e) => setForm({ ...form, profissional_id: e.target.value })}>
                      <option value="">— Selecionar —</option>
                      {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}{p.especialidade ? ` — ${p.especialidade}` : ""}</option>)}
                    </select>
                  ) : (
                    <input value={form.profissional} onChange={(e) => setForm({ ...form, profissional: e.target.value })} placeholder="Nome do profissional" />
                  )}
                </div>
              </div>
            </div>
            <div className="formGroup">
              <span className="formGroupLabel">Status & observações</span>
              <div className="formRow"><label htmlFor="admin-status">Status</label>
                <select id="admin-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ConsultaStatus })}>
                  {(Object.keys(STATUS_LABEL) as ConsultaStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div className="formRow"><label htmlFor="admin-observacoes">Observações</label><textarea id="admin-observacoes" rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Notas internas sobre este atendimento" /></div>
            </div>
            {error && <div className="onboardingError">{error}</div>}
          </div>
          <footer className="modalFooter">
            <button className="secondaryButton" disabled={saving} onClick={closeModal}>Cancelar</button>
            <button className="primaryButton" disabled={saving} onClick={handleSave}>{saving ? "Salvando…" : editingId ? "Salvar alterações" : "Agendar"}</button>
          </footer>
      </AdminDialog>
    )}
  </div>;
}
function ConsultaDetalhePopup({ consulta: c, onClose, onEdit, onStatusChange, onDelete }: {
  consulta: Consulta;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (s: ConsultaStatus) => void;
  onDelete: () => void;
}) {
  const dt = new Date(c.data_hora);
  const data = dt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const outrosStatus = (Object.keys(STATUS_LABEL) as ConsultaStatus[]).filter(s => s !== c.status);

  return (
    <AdminDialog title={"Consulta de " + c.paciente_nome} className="cpopup" onClose={onClose}>

        {/* Close */}
        <button className="iconButton cpopupClose" onClick={onClose} aria-label="Fechar"><X size={16} /></button>

        {/* Header centralizado */}
        <div className="cpopupHead">
          <div className="cpopupAvatar">
            {initials(c.paciente_nome)}
          </div>
          <h2 className="cpopupName">{c.paciente_nome}</h2>
          <StatusBadge status={c.status === "aguardando" ? "Aguardando confirmação" : STATUS_LABEL[c.status]} />
        </div>

        {/* Info */}
        <div className="cpopupInfo">
          <div className="cpopupInfoRow">
            <CalendarDays size={14} />
            <span>{data[0].toUpperCase() + data.slice(1)}</span>
          </div>
          <div className="cpopupInfoRow">
            <Clock size={14} />
            <span>{hora} · {c.duracao_min} min</span>
          </div>
          {c.profissional && (
            <div className="cpopupInfoRow">
              <User size={14} />
              <span>{c.profissional}</span>
            </div>
          )}
          {c.servico && (
            <div className="cpopupInfoRow">
              <Stethoscope size={14} />
              <span>{c.servico}</span>
            </div>
          )}
          {c.valor != null && (
            <div className="cpopupInfoRow">
              <BanknoteIcon size={14} />
              <span style={{ color: "var(--success)", fontWeight: 600 }}>{formatCurrency(c.valor)}</span>
            </div>
          )}
          {c.observacoes && (
            <div className="cpopupObs">{c.observacoes}</div>
          )}
        </div>

        {/* Alterar status */}
        {outrosStatus.length > 0 && (
          <div className="cpopupStatusBar">
            <span className="cpopupStatusLabel">Alterar para</span>
            <div className="cpopupStatusBtns">
              {outrosStatus.map(s => (
                <button key={s} className="cpopupStatusBtn" onClick={() => onStatusChange(s)}>
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="cpopupFooter">
          <button className="iconButton" onClick={onDelete} aria-label="Excluir consulta"><Trash2 size={15} /></button>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}><button className="secondaryButton" onClick={onClose}>Fechar</button><button className="primaryButton" onClick={onEdit}>Editar</button></div>
        </div>
    </AdminDialog>
  );
}

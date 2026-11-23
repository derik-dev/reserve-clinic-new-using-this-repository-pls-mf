"use client";

import { Award, Camera, Check, ChevronDown, Copy, Link2, Phone, Plus, X, BarChart3 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { AdminDialog, ConfirmDialog, OperationNotice, Pagination, RecordAvatar, RowActions, SearchInput, TableState, TableToolbar, type Confirmation } from "@/components/AdminTable";
import { useAdminRecords } from "@/components/useAdminRecords";
import { supabase } from "@/lib/supabase";
import { initials } from "@/lib/db";

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

type FormState = {
  nome: string;
  especialidade: string;
  whatsapp: string;
  cpf: string;
  orgao: string;
  registro: string;
  anos_experiencia: string;
};

const ORGAOS_PROFISSIONAIS = [
  { profissao: "Medicina", federal: "CFM", registro: "CRM" },
  { profissao: "Psicologia", federal: "CFP", registro: "CRP" },
  { profissao: "Odontologia", federal: "CFO", registro: "CRO" },
  { profissao: "Enfermagem", federal: "COFEN", registro: "COREN" },
  { profissao: "Farmácia", federal: "CFF", registro: "CRF" },
  { profissao: "Fisioterapia", federal: "COFFITO", registro: "CREFITO" },
  { profissao: "Terapia Ocupacional", federal: "COFFITO", registro: "CREFITO" },
  { profissao: "Nutrição", federal: "CFN", registro: "CRN" },
  { profissao: "Fonoaudiologia", federal: "CFFa", registro: "CREFONO / CRFa" },
  { profissao: "Biomedicina", federal: "CFBM", registro: "CRBM" },
  { profissao: "Biologia", federal: "CFBio", registro: "CRBio" },
  { profissao: "Educação Física", federal: "CONFEF", registro: "CREF" },
  { profissao: "Medicina Veterinária", federal: "CFMV", registro: "CRMV" },
  { profissao: "Serviço Social", federal: "CFESS", registro: "CRESS" },
  { profissao: "Técnico em Radiologia", federal: "CONTER", registro: "CRTR" },
] as const;

const emptyForm: FormState = { nome: "", especialidade: "", whatsapp: "", cpf: "", orgao: "Medicina|CRM", registro: "", anos_experiencia: "" };
const SAVE_TIMEOUT_MS = 15000;

async function withTimeout<T>(promise: PromiseLike<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), SAVE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default function ProfissionaisPage() {
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profissional | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedProf, setSelectedProf] = useState<Profissional | null>(null);
  const [perfilSlug, setPerfilSlug] = useState<string | null>(null);
  const [councilOpen, setCouncilOpen] = useState(false);
  const [councilQuery, setCouncilQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const councilSelectRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState("todos");
  const [specialty, setSpecialty] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const { records: profissionais, total, loading, loadError, load } = useAdminRecords<Profissional>({ table: "profissionais", query, status, specialty, page, onPageChange: setPage });
  const hasFilters = !!query || status !== "todos" || !!specialty;
  function clearFilters() { setQuery(""); setStatus("todos"); setSpecialty(""); setPage(1); }

  useEffect(() => {
    let active = true;
    async function loadMetadata() {
      const values = new Set<string>();
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("profissionais").select("especialidade").order("id").range(offset, offset + 499).abortSignal(AbortSignal.timeout(10000));
        if (!active || error) return;
        for (const item of data ?? []) if (item.especialidade) values.add(item.especialidade);
        if ((data?.length ?? 0) < 500) break;
      }
      if (active) setSpecialties(Array.from(values).sort((a, b) => a.localeCompare(b, "pt-BR")));
    }
    void loadMetadata();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from("perfis").select("slug").eq("id", user.id).maybeSingle().then(({ data }) => { if (active) setPerfilSlug(data?.slug ?? null); });
    });
    return () => { active = false; };
  }, [saving]);

  useEffect(() => {
    if (!councilOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (!councilSelectRef.current?.contains(event.target as Node)) {
        setCouncilOpen(false);
        setCouncilQuery("");
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [councilOpen]);

  const selectedCouncil = ORGAOS_PROFISSIONAIS.find((option) => `${option.profissao}|${option.registro}` === form.orgao) ?? ORGAOS_PROFISSIONAIS[0];
  const filteredCouncils = useMemo(() => {
    const query = councilQuery.trim().toLowerCase();
    if (!query) return ORGAOS_PROFISSIONAIS;
    return ORGAOS_PROFISSIONAIS.filter((option) => `${option.profissao} ${option.federal} ${option.registro}`.toLowerCase().includes(query));
  }, [councilQuery]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFotoFile(null);
    setFotoPreview(null);
    setError(null);
    setCouncilOpen(false);
    setCouncilQuery("");
    setModalOpen(true);
  }

  function openEdit(p: Profissional) {
    setEditing(p);
    const savedCouncil = p.crm?.trim() ?? "";
    const selectedCouncil = ORGAOS_PROFISSIONAIS.find((option) => savedCouncil.toUpperCase().startsWith(option.registro.toUpperCase())) ?? ORGAOS_PROFISSIONAIS[0];
    const savedRegistration = savedCouncil
      ? savedCouncil.slice(selectedCouncil.registro.length).replace(/^[\s-]+/, "")
      : "";
    setForm({
      nome: p.nome,
      especialidade: p.especialidade ?? "",
      whatsapp: p.whatsapp ?? "",
      cpf: p.cpf ?? "",
      orgao: `${selectedCouncil.profissao}|${selectedCouncil.registro}`,
      registro: savedRegistration,
      anos_experiencia: p.anos_experiencia != null ? String(p.anos_experiencia) : "",
    });
    setFotoFile(null);
    setFotoPreview(p.foto_url);
    setError(null);
    setCouncilOpen(false);
    setCouncilQuery("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFotoFile(null);
    if (fotoPreview && !editing?.foto_url) URL.revokeObjectURL(fotoPreview ?? "");
    setFotoPreview(null);
    setCouncilOpen(false);
    setCouncilQuery("");
  }

  function handleFoto(file: File | null) {
    setFotoFile(file);
    if (fotoPreview && !editing?.foto_url) URL.revokeObjectURL(fotoPreview ?? "");
    setFotoPreview(file ? URL.createObjectURL(file) : (editing?.foto_url ?? null));
  }

  async function handleSave() {
    if (!form.nome.trim()) { setError("Informe o nome do profissional."); return; }
    setError(null);
    setSaving(true);
    try {
      const { data: session } = await withTimeout(supabase.auth.getUser(), "A sessão demorou para responder. Entre novamente e tente de novo.");
      if (!session.user) throw new Error("Sua sessão expirou. Entre novamente para cadastrar o profissional.");

      let foto_url = editing?.foto_url ?? null;
      if (fotoFile) {
        const fd = new FormData();
        fd.append("file", fotoFile);
        fd.append("userId", session.user.id);
        fd.append("bucket", "profissional-fotos");
        const res = await withTimeout(fetch("/api/upload-logo", { method: "POST", body: fd }), "O envio da foto demorou demais. Tente novamente sem a foto ou escolha outro arquivo.");
        const data = await withTimeout(res.json().catch(() => null), "A resposta do upload ficou incompleta. Tente novamente.");
        if (!res.ok) throw new Error(data?.error ?? "Falha ao enviar foto.");
        foto_url = data?.url ?? null;
      }

      const payload = {
        perfil_id: session.user.id,
        nome: form.nome.trim(),
        especialidade: form.especialidade || null,
        whatsapp: form.whatsapp || null,
        cpf: form.cpf || null,
        crm: form.registro.trim() ? `${form.orgao.split("|")[1] ?? form.orgao} ${form.registro.trim()}` : null,
        anos_experiencia: form.anos_experiencia ? Number(form.anos_experiencia) : null,
        foto_url,
      };

      const result = editing
        ? await withTimeout(supabase.from("profissionais").update(payload).eq("id", editing.id), "O banco demorou para salvar. Tente novamente.")
        : await withTimeout(supabase.from("profissionais").insert(payload), "O banco demorou para salvar. Tente novamente.");
      if (result.error) throw new Error(result.error.message);

      closeModal();
      setNotice({ ok: true, message: editing ? "Profissional atualizado." : "Profissional cadastrado." });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível completar o cadastro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id); setBusy(true);
    try {
      const { error } = await supabase.from("profissionais").delete().eq("id", id);
      if (error) throw error;
      setNotice({ ok: true, message: "Profissional excluído." }); await load();
    } catch { setNotice({ ok: false, message: "Não foi possível excluir o profissional. Verifique os vínculos existentes e tente novamente." }); }
    finally { setDeleting(null); setBusy(false); setConfirmation(null); }
  }

  async function toggleAtivo(p: Profissional) {
    setBusy(true);
    try {
      const { error } = await supabase.from("profissionais").update({ ativo: !p.ativo }).eq("id", p.id);
      if (error) throw error;
      setNotice({ ok: true, message: p.ativo ? "Profissional desativado." : "Profissional ativado." }); await load();
    } catch { setNotice({ ok: false, message: "Não foi possível alterar o status do profissional." }); }
    finally { setBusy(false); setConfirmation(null); }
  }

  function requestStatus(p: Profissional) {
    if (p.ativo) setConfirmation({ title: "Desativar profissional?", description: p.nome + " será marcado como inativo.", label: "Desativar profissional", onConfirm: () => toggleAtivo(p) });
    else void toggleAtivo(p);
  }

  async function copyLink(p: Profissional) {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/agendamento/" + perfilSlug + "?p=" + p.id);
      setNotice({ ok: true, message: "Link de agendamento copiado." });
    } catch { setNotice({ ok: false, message: "Não foi possível copiar o link. Tente novamente." }); }
  }

  return <div className="adminPage">
    <PageHeader title="Profissionais" actions={<button className="primaryButton" onClick={openCreate}><Plus size={17} /> Novo profissional</button>} />
    <OperationNotice notice={notice} />
    <section className="panel dataPanel adminPanel" aria-label="Listagem de profissionais">
      <TableToolbar>
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nome ou especialidade" />
        <select aria-label="Filtrar por especialidade" value={specialty} onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}><option value="">Todas as especialidades</option>{specialties.map(value => <option key={value} value={value}>{value}</option>)}<option value="__sem__">Sem especialidade</option></select>
        <select aria-label="Filtrar profissionais por status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="todos">Todos os status</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option></select>
      </TableToolbar>
      <div className="tableScroll adminTableScroll" tabIndex={0} role="region" aria-label="Tabela de profissionais. Role horizontalmente para ver todas as colunas." aria-busy={loading}>
        <table className="adminTable adminProfissionaisTable">
          <thead><tr><th scope="col">Profissional</th><th scope="col">Especialidade</th><th scope="col">Status</th><th scope="col" className="adminActionsHeading">Ações</th></tr></thead>
          <tbody>{loading || loadError || profissionais.length === 0 ? <TableState columns={4} loading={loading} error={loadError} empty={hasFilters ? "Nenhum profissional encontrado." : "Nenhum profissional cadastrado."} onRetry={load} onClear={hasFilters ? clearFilters : undefined} /> : profissionais.map(p => <tr key={p.id} className="rowClickable" onClick={() => setSelectedProf(p)}>
            <td><div className="patientCell"><RecordAvatar name={p.nome} src={p.foto_url} /><div><button className="adminName" onClick={(e) => { e.stopPropagation(); setSelectedProf(p); }}>{p.nome}</button>{p.crm && <small>{p.crm}</small>}</div></div></td>
            <td>{p.especialidade || "Não informada"}</td>
            <td><StatusBadge status={p.ativo ? "Ativo" : "Inativo"} /></td>
            <td onClick={(e) => e.stopPropagation()}><div className="adminRowActions"><RowActions name={p.nome} disabled={busy || deleting === p.id} actions={[
              { label: "Ver cadastro", onClick: () => setSelectedProf(p) },
              { label: "Editar profissional", onClick: () => openEdit(p) },
              { label: "Ver relatório", href: "/profissionais/" + p.id },
              ...(perfilSlug ? [{ label: "Copiar link de agendamento", onClick: () => { void copyLink(p); } }] : []),
              { label: p.ativo ? "Desativar profissional" : "Ativar profissional", danger: p.ativo, onClick: () => requestStatus(p) },
              { label: "Excluir profissional", danger: true, onClick: () => setConfirmation({ title: "Excluir profissional?", description: "O cadastro de " + p.nome + " será excluído permanentemente. Esta ação não pode ser desfeita.", label: "Excluir profissional", onConfirm: () => handleDelete(p.id) }) },
            ]} /></div></td>
          </tr>)}</tbody>
        </table>
      </div>
      {!loadError && <Pagination page={page} total={total} onChange={setPage} disabled={loading} />}
    </section>
    {confirmation && <ConfirmDialog confirmation={confirmation} busy={busy} onClose={() => setConfirmation(null)} />}

    {/* Detail popup */}
    {selectedProf && (
      <ProfissionalPopup
        prof={selectedProf}
        perfilSlug={perfilSlug}
        onClose={() => setSelectedProf(null)}
        onEdit={() => { openEdit(selectedProf); setSelectedProf(null); }}
      />
    )}

    {/* Create / Edit modal */}
    {modalOpen && (
      <AdminDialog title={editing ? "Editar profissional" : "Novo profissional"} onClose={closeModal} busy={saving}>
          <header className="modalHeader">
            <h2>{editing ? "Editar profissional" : "Novo profissional"}</h2>
            <button className="iconButton" disabled={saving} onClick={closeModal} aria-label="Fechar"><X size={17} /></button>
          </header>
          <div className="modalBody">
            <div className="formGroup">
              <div className="professionalPhotoField">
                <button className="professionalPhotoPicker" type="button" onClick={() => fileRef.current?.click()} aria-label={fotoPreview ? "Trocar foto do profissional" : "Adicionar foto do profissional"}>
                  {fotoPreview ? <Image unoptimized width={64} height={64} src={fotoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (form.nome ? initials(form.nome) : <Camera size={22} />)}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="visuallyHiddenInput" onChange={(e) => handleFoto(e.target.files?.[0] ?? null)} />
                <div>
                  <small style={{ display: "block", color: "#858d9f", fontSize: 11, marginTop: 5 }}>JPG, PNG ou WebP. Recomendado 400×400.</small>
                </div>
              </div>
              <div className="formRow"><label htmlFor="admin-nome-completo">Nome completo</label><input id="admin-nome-completo" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Dr. Carlos Souza" /></div>
              <div className="formRow"><label htmlFor="admin-especialidade">Especialidade</label><input id="admin-especialidade" value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} placeholder="Ex.: Fisioterapeuta, Psicólogo…" /></div>
              <div className="formRow split">
                <div className="formRow"><label htmlFor="admin-whatsapp">WhatsApp</label><input id="admin-whatsapp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-9999" /></div>
                <div className="formRow"><label htmlFor="admin-cpf">CPF</label><input id="admin-cpf" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
              </div>
              <div className="formRow split">
                <div className="formRow">
                  <label>Órgão profissional</label>
                  <div className="councilSelect" ref={councilSelectRef} onKeyDown={(e) => { if (e.key === "Escape" && councilOpen) { e.stopPropagation(); setCouncilOpen(false); setCouncilQuery(""); } }}>
                    <button type="button" className="councilSelectTrigger" onClick={() => { setCouncilOpen((open) => !open); setCouncilQuery(""); }} onKeyDown={(e) => {
                      if (e.key === "Escape") { setCouncilOpen(false); setCouncilQuery(""); return; }
                      if (e.key.length === 1 && /\S/.test(e.key)) { e.preventDefault(); setCouncilOpen(true); setCouncilQuery((query) => query + e.key); }
                    }} aria-haspopup="listbox" aria-expanded={councilOpen}>
                      <span><strong>{selectedCouncil.profissao}</strong><small>{selectedCouncil.registro} · {selectedCouncil.federal}</small></span>
                      <ChevronDown size={17} />
                    </button>
                    {councilOpen && <div className="councilSelectMenu" role="listbox" aria-label="Órgão profissional">
                      <input autoFocus className="councilSearchInput" value={councilQuery} onChange={(e) => setCouncilQuery(e.target.value)} placeholder="Digite profissão, CRM, CRP..." aria-label="Buscar órgão profissional" />
                      {filteredCouncils.map((option) => {
                        const value = `${option.profissao}|${option.registro}`;
                        const selected = value === form.orgao;
                        return <button key={value} type="button" role="option" aria-selected={selected} className={`councilOption ${selected ? "selected" : ""}`} onClick={() => { setForm({ ...form, orgao: value }); setCouncilOpen(false); }}>
                          <span><strong>{option.profissao}</strong><small>{option.registro} · Conselho federal {option.federal}</small></span>
                          {selected && <Check size={16} />}
                        </button>;
                      })}
                      {!filteredCouncils.length && <span className="councilNoResults">Nenhum órgão encontrado.</span>}
                    </div>}
                  </div>
                </div>
                <div className="formRow">
                  <label htmlFor="admin-numero-do-registro">Número do registro</label>
                  <input id="admin-numero-do-registro" type="text" value={form.registro} onChange={(e) => setForm({ ...form, registro: e.target.value })} placeholder={`Ex.: ${form.orgao.split("|")[1] ?? form.orgao}-SP 123456`} />
                </div>
              </div>
            </div>
            {error && <div className="onboardingError">{error}</div>}
          </div>
          <footer className="modalFooter">
            <button className="secondaryButton" disabled={saving} onClick={closeModal}>Cancelar</button>
            <button className="primaryButton" disabled={saving} onClick={handleSave}>{saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar"}</button>
          </footer>
      </AdminDialog>
    )}
  </div>;
}

function ProfissionalPopup({ prof: p, perfilSlug, onClose, onEdit }: { prof: Profissional; perfilSlug: string | null; onClose: () => void; onEdit: () => void }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const bookingPath = perfilSlug ? `/agendamento/${perfilSlug}?p=${p.id}` : null;

  return (
    <AdminDialog title={"Cadastro de " + p.nome} className="profpopup" onClose={onClose}>
        {/* Close button */}
        <button className="iconButton ppopupClose" onClick={onClose} aria-label="Fechar"><X size={17} /></button>

        {/* Header: avatar + name + specialty + status */}
        <div className="profpopupProfile">
          <RecordAvatar name={p.nome} src={p.foto_url} />
          <p className="profpopupName">{p.nome}</p>
          {p.especialidade && <span className="profpopupSpec">{p.especialidade}</span>}
          <span className={`statusBadge ${p.ativo ? "statusAtivo" : "statusConcluida"}`}>
            {p.ativo ? "Ativo" : "Inativo"}
          </span>
        </div>

        {/* Info rows */}
        <div className="profpopupInfo">
          {p.whatsapp && (
            <a className="profpopupInfoRow" href={`tel:${p.whatsapp}`}>
              <Phone size={15} />
              <span>{p.whatsapp}</span>
            </a>
          )}
          {p.cpf && (
            <div className="profpopupInfoRow">
              <Copy size={15} />
              <span>CPF {p.cpf}</span>
            </div>
          )}
          {p.anos_experiencia != null && (
            <div className="profpopupInfoRow">
              <Award size={15} />
              <span>{p.anos_experiencia} anos de experiência</span>
            </div>
          )}

          {p.crm && (
            <div className="profpopupInfoRow">
              <Award size={15} />
              <span>{p.crm}</span>
            </div>
          )}

          {/* Booking link row */}
          {bookingPath && (
            <div className="profpopupLink">
              <Link2 size={14} style={{ flexShrink: 0, color: "var(--text-subtle)" }} />
              <span className="profpopupLinkLabel">Link de agendamento do profissional</span>
              <button
                className="iconButton"
                aria-label="Copiar link"
                title="Copiar link de agendamento"
                style={{ flexShrink: 0, color: copiedLink ? "#15967e" : undefined }}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + bookingPath);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 1600);
                }}
              >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="profpopupFooter">
          <Link href={`/profissionais/${p.id}`} className="secondaryButton" style={{ textDecoration: "none" }} onClick={onClose}>
            <BarChart3 size={14} /> Relatório
          </Link>
          <button className="primaryButton" style={{ flex: 1 }} onClick={onEdit}>Editar profissional</button>
        </div>
    </AdminDialog>
  );
}

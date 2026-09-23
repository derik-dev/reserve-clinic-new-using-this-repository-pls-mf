"use client";

import { Award, Camera, Check, ChevronDown, Copy, Link2, Pencil, Phone, Plus, Search, Stethoscope, Trash2, X, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
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
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
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
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [councilOpen, setCouncilOpen] = useState(false);
  const [councilQuery, setCouncilQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const councilSelectRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const { data } = await Promise.race([
        supabase.from("profissionais").select("*").order("nome"),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
      ]);
      setProfissionais((data as Profissional[] | null) ?? []);
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) supabase.from("perfis").select("slug").eq("id", user.id).maybeSingle().then(({ data: perf }) => setPerfilSlug((perf as { slug: string } | null)?.slug ?? null));
      });
    } catch {
      setLoadError(true);
      setProfissionais([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

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

  const filtered = useMemo(() => {
    if (!query.trim()) return profissionais;
    const q = query.toLowerCase();
    return profissionais.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      (p.especialidade ?? "").toLowerCase().includes(q) ||
      (p.cpf ?? "").includes(q)
    );
  }, [profissionais, query]);

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
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível completar o cadastro. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await supabase.from("profissionais").delete().eq("id", id);
    setDeleting(null);
    load();
  }

  async function toggleAtivo(p: Profissional) {
    await supabase.from("profissionais").update({ ativo: !p.ativo }).eq("id", p.id);
    load();
  }

  return <>
    <PageHeader
      title="Profissionais"
      description="Gerencie os profissionais da sua clínica."
    />

    <section className="panel dataPanel">
      {/* Toolbar */}
      <div className="profToolbar">
        <label className="pacientesSearch">
          <Search size={15} />
          <input
            placeholder="Buscar por nome ou especialidade"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <span className="pacientesCount">
          {filtered.length} de {profissionais.length} profissional{profissionais.length !== 1 ? "is" : ""}
        </span>
        <button className="primaryButton" onClick={openCreate}><Plus size={17} /> Novo profissional</button>
      </div>

      {/* Card grid or empty/loading states */}
      {loading ? (
        <div className="tableEmpty">
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Carregando…</span>
        </div>
      ) : loadError ? (
        <div className="tableEmpty">
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Não foi possível carregar os profissionais.{" "}
            <button className="linkButton" onClick={load}>Tentar novamente</button>
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="tableEmpty">
          <Stethoscope size={38} strokeWidth={1.4} />
          <div>
            <strong>{profissionais.length === 0 ? "Nenhum profissional cadastrado ainda" : "Nenhum profissional encontrado"}</strong>
            <small>{profissionais.length === 0 ? "Cadastre a sua equipe para associar profissionais a horários e consultas." : "Ajuste a busca para encontrar outros profissionais."}</small>
            {profissionais.length === 0 && (
              <button className="primaryButton emptyStateAction" onClick={openCreate}>
                <Plus size={16} /> Cadastrar profissional
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="profGrid">
          {filtered.map(p => (
            <div
              key={p.id}
              className="profCard"
              style={{ borderTop: `3px solid ${p.ativo ? "var(--success)" : "rgba(255,255,255,.10)"}` }}
              onClick={() => setSelectedProf(p)}
            >
              <div className="profCardTop">
                <div className="profCardAvatar">
                  {p.foto_url
                    ? <img src={p.foto_url} alt={p.nome} />
                    : initials(p.nome)}
                </div>
                <p className="profCardName">{p.nome}</p>
                {p.especialidade && <span className="profCardSpec">{p.especialidade}</span>}
                <button
                  className={`statusBadge ${p.ativo ? "statusAtivo" : "statusConcluida"}`}
                  style={{ border: 0, cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); toggleAtivo(p); }}
                >
                  {p.ativo ? "Ativo" : "Inativo"}
                </button>
              </div>

              <div className="profCardActions">
                {perfilSlug && (
                  <button
                    className="iconButton"
                    title="Copiar link de agendamento"
                    aria-label="Copiar link de agendamento"
                    style={{ color: copiedLinkId === p.id ? "#15967e" : undefined }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${window.location.origin}/agendamento/${perfilSlug}?p=${p.id}`);
                      setCopiedLinkId(p.id);
                      setTimeout(() => setCopiedLinkId(null), 1600);
                    }}
                  >
                    {copiedLinkId === p.id ? <Check size={15} /> : <Link2 size={15} />}
                  </button>
                )}
                <Link
                  href={`/profissionais/${p.id}`}
                  className="iconButton"
                  title="Ver relatório"
                  aria-label="Ver relatório"
                  onClick={(e) => e.stopPropagation()}
                  style={{ textDecoration: "none" }}
                >
                  <BarChart3 size={15} />
                </Link>
                <button
                  className="iconButton"
                  onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                  aria-label="Editar"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="iconButton"
                  onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                  disabled={deleting === p.id}
                  aria-label="Excluir"
                  style={{ color: "#e5484d" }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>

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
      <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modalCard">
          <header className="modalHeader">
            <h2>{editing ? "Editar profissional" : "Novo profissional"}</h2>
            <button className="iconButton" onClick={closeModal} aria-label="Fechar"><X size={17} /></button>
          </header>
          <div className="modalBody">
            <div className="formGroup">
              <div className="professionalPhotoField">
                <button className="professionalPhotoPicker" type="button" onClick={() => fileRef.current?.click()} aria-label={fotoPreview ? "Trocar foto do profissional" : "Adicionar foto do profissional"}>
                  {fotoPreview ? <img src={fotoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (form.nome ? initials(form.nome) : <Camera size={22} />)}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="visuallyHiddenInput" onChange={(e) => handleFoto(e.target.files?.[0] ?? null)} />
                <div>
                  <small style={{ display: "block", color: "#858d9f", fontSize: 11, marginTop: 5 }}>JPG, PNG ou WebP. Recomendado 400×400.</small>
                </div>
              </div>
              <div className="formRow"><label>Nome completo</label><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Dr. Carlos Souza" /></div>
              <div className="formRow"><label>Especialidade</label><input value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} placeholder="Ex.: Fisioterapeuta, Psicólogo…" /></div>
              <div className="formRow split">
                <div className="formRow"><label>WhatsApp</label><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-9999" /></div>
                <div className="formRow"><label>CPF</label><input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
              </div>
              <div className="formRow split">
                <div className="formRow">
                  <label>Órgão profissional</label>
                  <div className="councilSelect" ref={councilSelectRef}>
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
                  <label>Número do registro</label>
                  <input type="text" value={form.registro} onChange={(e) => setForm({ ...form, registro: e.target.value })} placeholder={`Ex.: ${form.orgao.split("|")[1] ?? form.orgao}-SP 123456`} />
                </div>
              </div>
            </div>
            {error && <div className="onboardingError">{error}</div>}
          </div>
          <footer className="modalFooter">
            <button className="secondaryButton" onClick={closeModal}>Cancelar</button>
            <button className="primaryButton" disabled={saving} onClick={handleSave}>{saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar"}</button>
          </footer>
        </div>
      </div>
    )}
  </>;
}

function ProfissionalPopup({ prof: p, perfilSlug, onClose, onEdit }: { prof: Profissional; perfilSlug: string | null; onClose: () => void; onEdit: () => void }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const bookingPath = perfilSlug ? `/agendamento/${perfilSlug}?p=${p.id}` : null;

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="profpopup" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="iconButton ppopupClose" onClick={onClose} aria-label="Fechar"><X size={17} /></button>

        {/* Header: avatar + name + specialty + status */}
        <div className="profpopupProfile">
          <div className="profpopupAvatar">
            {p.foto_url
              ? <img src={p.foto_url} alt={p.nome} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials(p.nome)}
          </div>
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
              <span>CRM {p.crm}</span>
            </div>
          )}

          {/* Booking link row */}
          {bookingPath && (
            <div className="profpopupLink">
              <Link2 size={14} style={{ flexShrink: 0, color: "var(--text-subtle)" }} />
              <code>{bookingPath}</code>
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
          <button className="secondaryButton" onClick={onClose}>Fechar</button>
          <Link href={`/profissionais/${p.id}`} className="secondaryButton" style={{ textDecoration: "none" }} onClick={onClose}>
            <BarChart3 size={14} /> Relatório
          </Link>
          <button className="primaryButton" onClick={onEdit}>Editar profissional</button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Camera, Check, Copy, Link2, Pencil, Plus, Search, Stethoscope, Trash2, X } from "lucide-react";
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
  anos_experiencia: string;
};

const emptyForm: FormState = { nome: "", especialidade: "", whatsapp: "", cpf: "", anos_experiencia: "" };

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
  const fileRef = useRef<HTMLInputElement>(null);

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

  const filtered = useMemo(() => {
    if (!query.trim()) return profissionais;
    const q = query.toLowerCase();
    return profissionais.filter(p =>
      p.nome.toLowerCase().includes(q) ||
      (p.especialidade ?? "").toLowerCase().includes(q) ||
      (p.cpf ?? "").includes(q)
    );
  }, [profissionais, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFotoFile(null);
    setFotoPreview(null);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(p: Profissional) {
    setEditing(p);
    setForm({
      nome: p.nome,
      especialidade: p.especialidade ?? "",
      whatsapp: p.whatsapp ?? "",
      cpf: p.cpf ?? "",
      anos_experiencia: p.anos_experiencia != null ? String(p.anos_experiencia) : "",
    });
    setFotoFile(null);
    setFotoPreview(p.foto_url);
    setError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFotoFile(null);
    if (fotoPreview && !editing?.foto_url) URL.revokeObjectURL(fotoPreview ?? "");
    setFotoPreview(null);
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
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) { setSaving(false); return; }

    let foto_url = editing?.foto_url ?? null;
    if (fotoFile) {
      const fd = new FormData();
      fd.append("file", fotoFile);
      fd.append("userId", session.user.id);
      fd.append("bucket", "profissional-fotos");
      const res = await fetch("/api/upload-logo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? "Falha ao enviar foto."); setSaving(false); return; }
      foto_url = data.url;
    }

    const payload = {
      perfil_id: session.user.id,
      nome: form.nome.trim(),
      especialidade: form.especialidade || null,
      whatsapp: form.whatsapp || null,
      cpf: form.cpf || null,
      anos_experiencia: form.anos_experiencia ? Number(form.anos_experiencia) : null,
      foto_url,
    };

    if (editing) {
      const { error: err } = await supabase.from("profissionais").update(payload).eq("id", editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from("profissionais").insert(payload);
      if (err) { setError(err.message); setSaving(false); return; }
    }

    setSaving(false);
    closeModal();
    load();
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
      actions={<button className="primaryButton" onClick={openCreate}><Plus size={17} /> Novo profissional</button>}
    />

    <section className="panel dataPanel">
      <div className="tableToolbar">
        <label><Search size={17} /><input placeholder="Buscar por nome ou especialidade" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      </div>
      <div className="tableScroll">
        <table>
          <thead>
            <tr>
              <th>PROFISSIONAL</th>
              <th>ESPECIALIDADE</th>
              <th>WHATSAPP</th>
              <th>EXPERIÊNCIA</th>
              <th>STATUS</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: "72px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Carregando…</td></tr>
            ) : loadError ? (
              <tr><td colSpan={6} style={{ padding: "72px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Não foi possível carregar os profissionais. <button className="linkButton" onClick={load}>Tentar novamente</button></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "72px 24px", color: "var(--text-muted)", textAlign: "center" }}>
                  <Stethoscope size={38} strokeWidth={1.4} style={{ color: "var(--text-subtle)", opacity: .7 }} />
                  <div>
                    <strong style={{ display: "block", font: "600 16px var(--font-space)", color: "var(--text)", letterSpacing: "-.01em", marginBottom: 6 }}>{profissionais.length === 0 ? "Nenhum profissional cadastrado ainda" : "Nenhum profissional encontrado"}</strong>
                    <small style={{ display: "block", fontSize: 12, color: "var(--text-muted)", maxWidth: 340 }}>{profissionais.length === 0 ? "Cadastre a sua equipe para associar profissionais a horários e consultas." : "Ajuste a busca para encontrar outros profissionais."}</small>
                  </div>
                </div>
              </td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="rowClickable" onClick={() => setSelectedProf(p)}>
                <td>
                  <div className="patientCell">
                    <div className="tableAvatar" style={{ overflow: "hidden" }}>
                      {p.foto_url ? <img src={p.foto_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(p.nome)}
                    </div>
                    <div><strong>{p.nome}</strong>{p.cpf && <small>CPF {p.cpf}</small>}</div>
                  </div>
                </td>
                <td>{p.especialidade ?? "—"}</td>
                <td>{p.whatsapp ?? "—"}</td>
                <td>{p.anos_experiencia != null ? `${p.anos_experiencia} anos` : "—"}</td>
                <td>
                  <button onClick={(e) => { e.stopPropagation(); toggleAtivo(p); }} className={`statusBadge ${p.ativo ? "statusAtivo" : "statusConcluida"}`} style={{ border: 0, cursor: "pointer" }}>
                    {p.ativo ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
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
                      >{copiedLinkId === p.id ? <Check size={15} /> : <Link2 size={15} />}</button>
                    )}
                    <button className="iconButton" onClick={(e) => { e.stopPropagation(); openEdit(p); }} aria-label="Editar"><Pencil size={15} /></button>
                    <button className="iconButton" onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} disabled={deleting === p.id} aria-label="Excluir" style={{ color: "#e5484d" }}><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="tablePagination">
        <span>Mostrando {filtered.length} de {profissionais.length} profissionais</span>
      </div>
    </section>

    {selectedProf && (
      <ProfissionalPopup
        prof={selectedProf}
        perfilSlug={perfilSlug}
        onClose={() => setSelectedProf(null)}
        onEdit={() => { openEdit(selectedProf); setSelectedProf(null); }}
      />
    )}

    {modalOpen && (
      <div className="modalBackdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modalCard">
          <header className="modalHeader">
            <h2>{editing ? "Editar profissional" : "Novo profissional"}</h2>
            <button className="iconButton" onClick={closeModal} aria-label="Fechar"><X size={17} /></button>
          </header>
          <div className="modalBody">
            <div className="formGroup">
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 14, background: "#eef0f6", overflow: "hidden", display: "grid", placeItems: "center", fontSize: 18, fontWeight: 700, color: "#858d9f", flexShrink: 0 }}>
                  {fotoPreview ? <img src={fotoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (form.nome ? initials(form.nome) : <Camera size={22} />)}
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFoto(e.target.files?.[0] ?? null)} />
                  <button className="secondaryButton" type="button" onClick={() => fileRef.current?.click()} style={{ height: 34, fontSize: 12 }}>
                    <Camera size={14} /> {fotoFile ? "Trocar foto" : "Adicionar foto"}
                  </button>
                  <small style={{ display: "block", color: "#858d9f", fontSize: 11, marginTop: 5 }}>JPG, PNG ou WebP. Recomendado 400×400.</small>
                </div>
              </div>
              <div className="formRow"><label>Nome completo</label><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex.: Dr. Carlos Souza" /></div>
              <div className="formRow"><label>Especialidade</label><input value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} placeholder="Ex.: Fisioterapeuta, Psicólogo…" /></div>
              <div className="formRow split">
                <div className="formRow"><label>WhatsApp</label><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-9999" /></div>
                <div className="formRow"><label>CPF</label><input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
              </div>
              <div className="formRow" style={{ maxWidth: 180 }}>
                <label>Anos de experiência</label>
                <input type="number" min={0} max={60} value={form.anos_experiencia} onChange={(e) => setForm({ ...form, anos_experiencia: e.target.value })} placeholder="Ex.: 5" />
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
      <div className="modalCard" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <header className="modalHeader">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className="tableAvatar" style={{ width: 48, height: 48, borderRadius: 14, fontSize: 14, overflow: "hidden" }}>
              {p.foto_url ? <img src={p.foto_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(p.nome)}
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{p.nome}</h2>
              {p.especialidade && <small style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 3, display: "block" }}>{p.especialidade}</small>}
              <div style={{ marginTop: 6 }}>
                <span className={`statusBadge ${p.ativo ? "statusAtivo" : "statusConcluida"}`}>{p.ativo ? "Ativo" : "Inativo"}</span>
              </div>
            </div>
          </div>
          <button className="iconButton" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
        </header>
        <div className="modalBody">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {p.whatsapp && <ProfField label="WhatsApp" value={p.whatsapp} />}
            {p.cpf && <ProfField label="CPF" value={p.cpf} />}
            {p.anos_experiencia != null && <ProfField label="Experiência" value={`${p.anos_experiencia} anos`} />}
            {p.especialidade && <ProfField label="Especialidade" value={p.especialidade} />}
          </div>
          {bookingPath && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(255,255,255,.03)", border: "1px solid var(--border-soft)", borderRadius: 10 }}>
              <span style={{ fontSize: 9, color: "var(--text-subtle)", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Link de agendamento</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <code style={{ fontSize: 11, color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bookingPath}</code>
                <button
                  className="iconButton"
                  aria-label="Copiar link"
                  title="Copiar link"
                  style={{ flexShrink: 0, color: copiedLink ? "#15967e" : undefined }}
                  onClick={() => { navigator.clipboard.writeText(window.location.origin + bookingPath); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 1600); }}
                >{copiedLink ? <Check size={14} /> : <Copy size={14} />}</button>
              </div>
            </div>
          )}
        </div>
        <footer className="modalFooter">
          <button className="secondaryButton" onClick={onClose}>Fechar</button>
          <button className="primaryButton" onClick={onEdit}>Editar profissional</button>
        </footer>
      </div>
    </div>
  );
}

function ProfField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 14px", background: "rgba(255,255,255,.03)", border: "1px solid var(--border-soft)", borderRadius: 10 }}>
      <span style={{ fontSize: 9, color: "var(--text-subtle)", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

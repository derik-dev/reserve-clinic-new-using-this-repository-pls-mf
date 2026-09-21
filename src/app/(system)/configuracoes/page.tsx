"use client";

import { Building2, Camera, Check, Image, MapPin, Plus, Trash2, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

function slugify(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 40);
}

function formatCep(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function formatCpfCnpj(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})$/, "$1.$2.$3-$4")
            .replace(/(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3")
            .replace(/(\d{3})(\d{1,3})$/, "$1.$2");
  }
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})$/, "$1.$2.$3/$4-$5")
          .replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})$/, "$1.$2.$3/$4")
          .replace(/(\d{2})(\d{3})(\d{1,3})$/, "$1.$2.$3")
          .replace(/(\d{2})(\d{1,3})$/, "$1.$2");
}

type Form = {
  nome: string; slug: string; telefone: string; email_contato: string;
  site: string; instagram: string; tiktok: string;
  cpf_cnpj: string;
  endereco_cep: string; endereco_rua: string; endereco_numero: string;
  endereco_bairro: string; endereco_cidade: string; endereco_uf: string;
  pix_chave: string; valor_consulta: string;
};

const emptyForm: Form = {
  nome: "", slug: "", telefone: "", email_contato: "",
  site: "", instagram: "", tiktok: "",
  cpf_cnpj: "",
  endereco_cep: "", endereco_rua: "", endereco_numero: "",
  endereco_bairro: "", endereco_cidade: "", endereco_uf: "",
  pix_chave: "", valor_consulta: "",
};

type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
type DayConfig = { aberto: boolean; inicio: string; fim: string };
type ProfDisponibilidade = { dias: Record<DayKey, DayConfig>; feriados: string[] };
type AgendaConfig = {
  dias: Record<DayKey, DayConfig>;
  feriados: string[];
  duracao_min: number;
  disponibilidade: Record<string, ProfDisponibilidade>;
};
type ProfissionalItem = { id: string; nome: string; valor_consulta: number | null };

const DAY_ORDER: DayKey[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const DAY_LABEL_FULL: Record<DayKey, string> = { seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo" };

const DEFAULT_AGENDA: AgendaConfig = {
  dias: {
    seg: { aberto: true, inicio: "08:00", fim: "18:00" },
    ter: { aberto: true, inicio: "08:00", fim: "18:00" },
    qua: { aberto: true, inicio: "08:00", fim: "18:00" },
    qui: { aberto: true, inicio: "08:00", fim: "18:00" },
    sex: { aberto: true, inicio: "08:00", fim: "18:00" },
    sab: { aberto: false, inicio: "08:00", fim: "13:00" },
    dom: { aberto: false, inicio: "08:00", fim: "13:00" },
  },
  feriados: [],
  duracao_min: 60,
  disponibilidade: {},
};

function mergeAgendaConfig(raw: unknown): AgendaConfig {
  const r = (raw ?? {}) as Partial<AgendaConfig>;
  return {
    dias: { ...DEFAULT_AGENDA.dias, ...(r.dias ?? {}) },
    feriados: Array.isArray(r.feriados) ? r.feriados : [],
    duracao_min: typeof r.duracao_min === "number" && r.duracao_min > 0 ? r.duracao_min : DEFAULT_AGENDA.duracao_min,
    disponibilidade: (r.disponibilidade && typeof r.disponibilidade === "object") ? r.disponibilidade as Record<string, ProfDisponibilidade> : {},
  };
}

type Tab = "empresa" | "visual" | "endereco" | "disponibilidade";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "empresa",        label: "Empresa",        icon: <Building2 size={15} /> },
  { id: "visual",         label: "Visual",          icon: <Image size={15} /> },
  { id: "endereco",       label: "Endereço",        icon: <MapPin size={15} /> },
  { id: "disponibilidade",label: "Disponibilidade", icon: <Users size={15} /> },
];

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState<Tab>("empresa");
  const [form, setForm] = useState<Form>(emptyForm);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profissionais, setProfissionais] = useState<ProfissionalItem[]>([]);
  const [agendaConfig, setAgendaConfig] = useState<AgendaConfig>(DEFAULT_AGENDA);
  const [profSelecionado, setProfSelecionado] = useState<string | null>(null);
  const [novoFeriadoProf, setNovoFeriadoProf] = useState("");
  const [valorConsultaProf, setValorConsultaProf] = useState<Record<string, string>>({});
  const [agendaSaving, setAgendaSaving] = useState(false);
  const [agendaSaved, setAgendaSaved] = useState(false);
  const [agendaError, setAgendaError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const up = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      try {
        const { data: session } = await Promise.race([
          supabase.auth.getUser(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
        ]);
        if (!session.user) { setLoading(false); return; }
        setUserId(session.user.id);

        const [perfilResult, profsResult, configResult] = await Promise.all([
          supabase.from("perfis")
            .select("nome, slug, telefone, email_contato, site, instagram, tiktok, cpf_cnpj, endereco_cep, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, pix_chave, valor_consulta, logo_url")
            .eq("id", session.user.id).maybeSingle(),
          supabase.from("profissionais").select("id, nome, valor_consulta").eq("perfil_id", session.user.id).order("nome"),
          supabase.from("configuracoes").select("agenda_config").eq("perfil_id", session.user.id).maybeSingle(),
        ]);

        const raw = perfilResult.data ?? (perfilResult.error
          ? (await supabase.from("perfis")
              .select("nome, slug, telefone, email_contato, endereco_cep, endereco_rua, endereco_numero, endereco_cidade, endereco_uf, pix_chave, logo_url")
              .eq("id", session.user.id).maybeSingle()).data
          : null);

        if (raw) {
          const d = raw as Form & { logo_url: string | null; valor_consulta: number | null };
          setForm({
            nome: d.nome ?? "", slug: d.slug ?? "", telefone: d.telefone ?? "", email_contato: d.email_contato ?? "",
            site: d.site ?? "", instagram: d.instagram ?? "", tiktok: d.tiktok ?? "",
            cpf_cnpj: d.cpf_cnpj ?? "",
            endereco_cep: d.endereco_cep ?? "", endereco_rua: d.endereco_rua ?? "", endereco_numero: d.endereco_numero ?? "",
            endereco_bairro: d.endereco_bairro ?? "", endereco_cidade: d.endereco_cidade ?? "", endereco_uf: d.endereco_uf ?? "",
            pix_chave: d.pix_chave ?? "",
            valor_consulta: d.valor_consulta != null ? String(d.valor_consulta) : "",
          });
          setLogoPreview(d.logo_url);
        }

        const profsList = (profsResult.data as ProfissionalItem[] | null) ?? [];
        setProfissionais(profsList);
        if (profsList.length > 0) setProfSelecionado(profsList[0].id);
        const valMap: Record<string, string> = {};
        profsList.forEach(p => { valMap[p.id] = p.valor_consulta != null ? String(p.valor_consulta) : ""; });
        setValorConsultaProf(valMap);

        if (configResult.data?.agenda_config) {
          setAgendaConfig(mergeAgendaConfig(configResult.data.agenda_config));
        }
      } catch {
        setError("Não foi possível carregar as configurações. Recarregue a página.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateProfDia(profId: string, key: DayKey, patch: Partial<DayConfig>) {
    setAgendaConfig(c => {
      const prev = c.disponibilidade[profId] ?? { dias: { ...c.dias }, feriados: [] };
      return { ...c, disponibilidade: { ...c.disponibilidade, [profId]: { ...prev, dias: { ...prev.dias, [key]: { ...prev.dias[key], ...patch } } } } };
    });
  }

  function addFeriadoProf(profId: string) {
    if (!novoFeriadoProf) return;
    setAgendaConfig(c => {
      const prev = c.disponibilidade[profId] ?? { dias: { ...c.dias }, feriados: [] };
      if (prev.feriados.includes(novoFeriadoProf)) return c;
      return { ...c, disponibilidade: { ...c.disponibilidade, [profId]: { ...prev, feriados: [...prev.feriados, novoFeriadoProf].sort() } } };
    });
    setNovoFeriadoProf("");
  }

  function removeFeriadoProf(profId: string, f: string) {
    setAgendaConfig(c => {
      const prev = c.disponibilidade[profId] ?? { dias: { ...c.dias }, feriados: [] };
      return { ...c, disponibilidade: { ...c.disponibilidade, [profId]: { ...prev, feriados: prev.feriados.filter(x => x !== f) } } };
    });
  }

  function resetProfDisp(profId: string) {
    setAgendaConfig(c => {
      const { [profId]: _, ...rest } = c.disponibilidade;
      return { ...c, disponibilidade: rest };
    });
  }

  async function handleCepChange(raw: string) {
    const masked = formatCep(raw);
    up("endereco_cep", masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data && !data.erro) setForm(f => ({
        ...f,
        endereco_rua: data.logradouro || f.endereco_rua,
        endereco_bairro: data.bairro || f.endereco_bairro,
        endereco_cidade: data.localidade || f.endereco_cidade,
        endereco_uf: data.uf || f.endereco_uf,
      }));
    } catch { /* silencioso */ } finally { setCepLoading(false); }
  }

  async function handleLogoChange(file: File | null) {
    if (!file || !userId) return;
    setLogoPreview(URL.createObjectURL(file));
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file); fd.append("userId", userId);
    const res = await fetch("/api/upload-logo", { method: "POST", body: fd });
    const data = await res.json();
    setLogoUploading(false);
    if (res.ok) await supabase.from("perfis").update({ logo_url: data.url }).eq("id", userId!);
  }

  async function handleSave() {
    if (!userId || !form.nome.trim()) { setError("O nome é obrigatório."); return; }
    setError(null); setSaving(true);
    const { error: err } = await supabase.from("perfis").update({
      nome: form.nome.trim(), slug: form.slug.trim() || null,
      telefone: form.telefone || null, email_contato: form.email_contato || null,
      ...(form.site !== undefined ? { site: form.site.trim() || null } : {}),
      ...(form.instagram !== undefined ? { instagram: form.instagram.trim() || null } : {}),
      ...(form.tiktok !== undefined ? { tiktok: form.tiktok.trim() || null } : {}),
      cpf_cnpj: form.cpf_cnpj.replace(/\D/g, "") || null,
      endereco_cep: form.endereco_cep || null, endereco_rua: form.endereco_rua || null,
      endereco_numero: form.endereco_numero || null,
      endereco_bairro: form.endereco_bairro || null,
      endereco_cidade: form.endereco_cidade || null,
      endereco_uf: form.endereco_uf || null, pix_chave: form.pix_chave.trim() || null,
      ...(form.valor_consulta !== undefined ? { valor_consulta: form.valor_consulta ? Number(form.valor_consulta.replace(",", ".")) : null } : {}),
    }).eq("id", userId);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function handleSaveAgenda() {
    if (!userId) return;
    setAgendaError(null);
    setAgendaSaving(true);

    const { error: err1 } = await supabase.from("configuracoes").upsert(
      { perfil_id: userId, agenda_config: agendaConfig },
      { onConflict: "perfil_id" }
    );
    if (err1) { setAgendaError(err1.message); setAgendaSaving(false); return; }

    for (const prof of profissionais) {
      const val = valorConsultaProf[prof.id];
      const numVal = val ? Number(val.replace(",", ".")) : null;
      await supabase.from("profissionais").update({ valor_consulta: numVal }).eq("id", prof.id);
    }

    setAgendaSaving(false);
    setAgendaSaved(true);
    setTimeout(() => setAgendaSaved(false), 2000);
  }

  if (loading) return (
    <>
      <PageHeader title="Configurações" description="Gerencie os dados da sua conta." />
      <section className="panel" style={{ padding: 72, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Carregando…</section>
    </>
  );

  return <>
    <PageHeader title="Configurações" description="Gerencie os dados da sua conta e clínica." />

    <div className="cfgLayout">
      {/* Sidebar */}
      <nav className="cfgSidebar panel">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`cfgSidebarBtn${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="cfgContent panel">

        {tab === "empresa" && (
          <div className="cfgSection">
            <div className="cfgSectionHead">
              <strong>Dados da empresa</strong>
              <small>Informações exibidas na página pública de agendamento.</small>
            </div>
            <div className="formGrid">
              <div className="formRow"><label>Nome da clínica / profissional</label><input value={form.nome} onChange={e => up("nome", e.target.value)} placeholder="Ex.: Clínica Vida Nova" /></div>
              <div className="formRow split">
                <div className="formRow"><label>Telefone / WhatsApp</label><input value={form.telefone} onChange={e => up("telefone", e.target.value)} placeholder="(11) 99999-9999" /></div>
                <div className="formRow"><label>E-mail de contato</label><input type="email" value={form.email_contato} onChange={e => up("email_contato", e.target.value)} placeholder="contato@clinica.com.br" /></div>
              </div>
              <div className="formRow split">
                <div className="formRow">
                  <label>CPF / CNPJ</label>
                  <input value={form.cpf_cnpj} onChange={e => up("cpf_cnpj", formatCpfCnpj(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
                  <small style={{ color: "#858d9f" }}>Necessário para receber pagamentos via Asaas.</small>
                </div>
                <div className="formRow">
                  <label>Valor padrão da consulta (R$)</label>
                  <input value={form.valor_consulta} onChange={e => up("valor_consulta", e.target.value)} placeholder="150,00" inputMode="decimal" />
                  <small style={{ color: "#858d9f" }}>Usado quando o profissional não tem valor próprio.</small>
                </div>
              </div>
              <div className="formRow">
                <label>Link personalizado</label>
                <input value={form.slug} onChange={e => up("slug", slugify(e.target.value))} placeholder="sua-clinica" />
                <small style={{ color: "#858d9f" }}>reserveclinic.com/agendamento/{form.slug || "sua-clinica"} — alterar quebra links já compartilhados.</small>
              </div>
              <div className="formRow">
                <label>Site</label>
                <input value={form.site} onChange={e => up("site", e.target.value)} placeholder="https://suaclinica.com.br" type="url" />
              </div>
              <div className="formRow split">
                <div className="formRow">
                  <label>Instagram</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#858d9f", fontSize: 13, pointerEvents: "none" }}>@</span>
                    <input value={form.instagram} onChange={e => up("instagram", e.target.value.replace(/^@/, ""))} placeholder="suaclinica" style={{ paddingLeft: 24 }} />
                  </div>
                </div>
                <div className="formRow">
                  <label>TikTok</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#858d9f", fontSize: 13, pointerEvents: "none" }}>@</span>
                    <input value={form.tiktok} onChange={e => up("tiktok", e.target.value.replace(/^@/, ""))} placeholder="suaclinica" style={{ paddingLeft: 24 }} />
                  </div>
                </div>
              </div>
            </div>
            {error && <div className="onboardingError" style={{ marginTop: 16 }}>{error}</div>}
            <div className="cfgFooter">
              <button className="primaryButton" disabled={saving} onClick={handleSave}>
                {saved ? <><Check size={15} /> Alterações salvas</> : saving ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          </div>
        )}

        {tab === "visual" && (
          <div className="cfgSection">
            <div className="cfgSectionHead">
              <strong>Identidade visual</strong>
              <small>Logo exibida no painel e no link de agendamento.</small>
            </div>
            <div className="formGrid">
              <div className="formRow">
                <label>Logo</label>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div className="cfgLogoPreview">
                    {logoPreview ? <img src={logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera size={28} />}
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0] ?? null; if (f) handleLogoChange(f); }} />
                    <button className="secondaryButton" type="button" style={{ height: 36, fontSize: 13 }} onClick={() => fileRef.current?.click()}>
                      {logoUploading ? "Enviando…" : <><Camera size={14} /> {logoPreview ? "Trocar logo" : "Enviar logo"}</>}
                    </button>
                    <small style={{ display: "block", color: "#858d9f", fontSize: 11, marginTop: 6 }}>PNG, JPG ou SVG · 512×512 recomendado.</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="cfgFooter">
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>A logo é salva automaticamente ao fazer o upload.</span>
            </div>
          </div>
        )}

        {tab === "endereco" && (
          <div className="cfgSection">
            <div className="cfgSectionHead">
              <strong>Endereço</strong>
              <small>Aparece na página pública abaixo do nome da clínica.</small>
            </div>
            <div className="formGrid">
              <div className="formRow split">
                <div className="formRow">
                  <label>CEP</label>
                  <input value={form.endereco_cep} onChange={e => handleCepChange(e.target.value)} placeholder="00000-000" inputMode="numeric" />
                  {cepLoading && <small style={{ color: "#858d9f" }}>Buscando…</small>}
                </div>
                <div className="formRow"><label>Cidade</label><input value={form.endereco_cidade} onChange={e => up("endereco_cidade", e.target.value)} placeholder="São Paulo" /></div>
              </div>
              <div className="formRow"><label>Rua / avenida</label><input value={form.endereco_rua} onChange={e => up("endereco_rua", e.target.value)} placeholder="Av. Paulista" /></div>
              <div className="formRow split">
                <div className="formRow"><label>Número</label><input value={form.endereco_numero} onChange={e => up("endereco_numero", e.target.value)} placeholder="1200" /></div>
                <div className="formRow"><label>Bairro</label><input value={form.endereco_bairro} onChange={e => up("endereco_bairro", e.target.value)} placeholder="Centro" /></div>
                <div className="formRow"><label>UF</label><input value={form.endereco_uf} onChange={e => up("endereco_uf", e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} /></div>
              </div>
            </div>
            {error && <div className="onboardingError" style={{ marginTop: 16 }}>{error}</div>}
            <div className="cfgFooter">
              <button className="primaryButton" disabled={saving} onClick={handleSave}>
                {saved ? <><Check size={15} /> Alterações salvas</> : saving ? "Salvando…" : "Salvar endereço"}
              </button>
            </div>
          </div>
        )}

        {tab === "disponibilidade" && (
          <div className="cfgSection">
            <div className="cfgSectionHead">
              <strong>Profissionais e disponibilidade</strong>
              <small>Configure os horários de atendimento e o valor da consulta de cada profissional.</small>
            </div>

            {profissionais.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
                Nenhum profissional cadastrado ainda. Acesse <strong>Profissionais</strong> no menu para cadastrar.
              </p>
            ) : (
              <>
                <div className="ajustesProfSelect">
                  {profissionais.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={`ajustesProfTab${profSelecionado === p.id ? " active" : ""}${agendaConfig.disponibilidade[p.id] ? " hasCustom" : ""}`}
                      onClick={() => setProfSelecionado(p.id)}
                    >
                      {p.nome}
                    </button>
                  ))}
                </div>

                {profSelecionado && (() => {
                  const profAtual = agendaConfig.disponibilidade[profSelecionado] ?? { dias: { ...agendaConfig.dias }, feriados: [] };
                  const temCustom = !!agendaConfig.disponibilidade[profSelecionado];
                  return (
                    <div className="ajustesProfBody">
                      <div className="formRow" style={{ maxWidth: 220, marginBottom: 20 }}>
                        <label>Valor da consulta (R$)</label>
                        <input
                          value={valorConsultaProf[profSelecionado] ?? ""}
                          onChange={e => setValorConsultaProf(v => ({ ...v, [profSelecionado]: e.target.value }))}
                          placeholder="150,00"
                          inputMode="decimal"
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <small style={{ color: "var(--text-muted)" }}>
                          {temCustom ? "Horário personalizado ativo" : "Usando horários padrão da clínica"}
                        </small>
                        {temCustom && (
                          <button className="secondaryButton" style={{ fontSize: 12, padding: "4px 10px" }} onClick={() => resetProfDisp(profSelecionado)}>
                            Restaurar padrão
                          </button>
                        )}
                      </div>

                      <div className="ajustesDias">
                        {DAY_ORDER.map(k => {
                          const d = profAtual.dias[k];
                          return (
                            <div className={`ajustesDia ${d.aberto ? "isOpen" : ""}`} key={k}>
                              <label className="ajustesSwitch">
                                <input type="checkbox" checked={d.aberto} onChange={e => updateProfDia(profSelecionado, k, { aberto: e.target.checked })} />
                                <span>{DAY_LABEL_FULL[k]}</span>
                              </label>
                              <div className="ajustesHoras">
                                <input type="time" value={d.inicio} disabled={!d.aberto} onChange={e => updateProfDia(profSelecionado, k, { inicio: e.target.value })} />
                                <em>até</em>
                                <input type="time" value={d.fim} disabled={!d.aberto} onChange={e => updateProfDia(profSelecionado, k, { fim: e.target.value })} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <p className="ajustesHint" style={{ marginTop: 16 }}>Folgas exclusivas deste profissional (somam-se aos feriados gerais).</p>
                      <div className="ajustesAddRow">
                        <input type="date" value={novoFeriadoProf} onChange={e => setNovoFeriadoProf(e.target.value)} />
                        <button className="secondaryButton" onClick={() => addFeriadoProf(profSelecionado)} disabled={!novoFeriadoProf}>
                          <Plus size={15} /> Adicionar folga
                        </button>
                      </div>
                      {profAtual.feriados.length === 0 ? (
                        <p className="ajustesEmpty">Nenhuma folga individual.</p>
                      ) : (
                        <ul className="ajustesLista">
                          {profAtual.feriados.map(f => (
                            <li key={f}>
                              <span>{new Date(f + "T00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
                              <button className="iconButton" onClick={() => removeFeriadoProf(profSelecionado, f)} aria-label="Remover"><Trash2 size={15} /></button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })()}

                {agendaError && <div className="onboardingError" style={{ marginTop: 16 }}>{agendaError}</div>}
                <div className="cfgFooter">
                  <button className="primaryButton" disabled={agendaSaving} onClick={handleSaveAgenda}>
                    {agendaSaved ? <><Check size={15} /> Configurações salvas</> : agendaSaving ? "Salvando…" : "Salvar disponibilidade"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  </>;
}

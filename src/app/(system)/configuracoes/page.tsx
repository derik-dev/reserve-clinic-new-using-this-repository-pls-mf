"use client";

import { Camera, Check, Copy } from "lucide-react";
import QRCode from "react-qr-code";
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

function pixField(id: string, v: string) { return `${id}${String(v.length).padStart(2, "0")}${v}`; }
function crc16(s: string) { let c = 0xffff; for (let i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) c = (c & 0x8000) ? (c << 1) ^ 0x1021 : c << 1; } return ((c & 0xffff).toString(16).toUpperCase().padStart(4, "0")); }
function gerarPix(chave: string, nome: string, cidade: string) { const mai = pixField("00", "BR.GOV.BCB.PIX") + pixField("01", chave); const body = [pixField("00", "01"), pixField("26", mai), pixField("52", "0000"), pixField("53", "986"), pixField("58", "BR"), pixField("59", nome.slice(0, 25)), pixField("60", (cidade || "Brasil").slice(0, 15)), pixField("62", pixField("05", "***")), "6304"].join(""); return body + crc16(body); }

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

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<Form>(emptyForm);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const { data, error: fetchErr } = await supabase.from("perfis")
          .select("nome, slug, telefone, email_contato, site, instagram, tiktok, cpf_cnpj, endereco_cep, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, pix_chave, valor_consulta, logo_url")
          .eq("id", session.user.id).maybeSingle();

        const raw = data ?? (fetchErr
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
      } catch {
        setError("Não foi possível carregar as configurações. Recarregue a página.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const pixPayload = form.pix_chave.trim() && form.nome ? gerarPix(form.pix_chave.trim(), form.nome, form.endereco_cidade) : null;

  if (loading) return <><PageHeader title="Configurações" description="Gerencie os dados da sua conta." /><section className="panel" style={{ padding: 72, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Carregando…</section></>;

  return <>
    <PageHeader title="Configurações" description="Gerencie os dados da sua conta e clínica." actions={
      <button className="primaryButton" disabled={saving} onClick={handleSave} style={{ minWidth: 160 }}>
        {saved ? <><Check size={15} /> Alterações salvas</> : saving ? "Salvando…" : "Salvar alterações"}
      </button>
    } />

    <div className="settingsGrid">
      {/* Dados da empresa */}
      <section className="panel settingsSection">
        <div className="settingsSectionHead"><strong>Dados da empresa</strong><small>Informações exibidas na página pública de agendamento.</small></div>
        <div className="formGrid">
          <div className="formRow"><label>Nome da clínica / profissional</label><input value={form.nome} onChange={e => up("nome", e.target.value)} placeholder="Ex.: Clínica Vida Nova" /></div>
          <div className="formRow split">
            <div className="formRow"><label>Telefone / WhatsApp</label><input value={form.telefone} onChange={e => up("telefone", e.target.value)} placeholder="(11) 99999-9999" /></div>
            <div className="formRow"><label>E-mail de contato</label><input type="email" value={form.email_contato} onChange={e => up("email_contato", e.target.value)} placeholder="contato@clinica.com.br" /></div>
          </div>
          <div className="formRow split">
            <div className="formRow" style={{ maxWidth: 240 }}>
              <label>CPF / CNPJ</label>
              <input
                value={form.cpf_cnpj}
                onChange={e => up("cpf_cnpj", formatCpfCnpj(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
              <small style={{ color: "#858d9f" }}>Necessário para receber pagamentos via Asaas.</small>
            </div>
            <div className="formRow" style={{ maxWidth: 240 }}>
              <label>Valor da consulta (R$)</label>
              <input value={form.valor_consulta} onChange={e => up("valor_consulta", e.target.value)} placeholder="150,00" inputMode="decimal" />
              <small style={{ color: "#858d9f" }}>Exibido no link de agendamento.</small>
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
      </section>

      {/* Identidade visual */}
      <section className="panel settingsSection">
        <div className="settingsSectionHead"><strong>Identidade visual</strong><small>Logo exibida no painel e no link de agendamento.</small></div>
        <div className="formGrid">
          <div className="formRow">
            <label>Logo</label>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: "#eef0f6", overflow: "hidden", display: "grid", placeItems: "center", flexShrink: 0, color: "#858d9f" }}>
                {logoPreview ? <img src={logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Camera size={24} />}
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0] ?? null; if (f) handleLogoChange(f); }} />
                <button className="secondaryButton" type="button" style={{ height: 34, fontSize: 12 }} onClick={() => fileRef.current?.click()}>
                  {logoUploading ? "Enviando…" : <><Camera size={13} /> {logoPreview ? "Trocar logo" : "Enviar logo"}</>}
                </button>
                <small style={{ display: "block", color: "#858d9f", fontSize: 11, marginTop: 5 }}>PNG, JPG ou SVG · 512×512 recomendado.</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Endereço */}
      <section className="panel settingsSection">
        <div className="settingsSectionHead"><strong>Endereço</strong><small>Aparece na página pública abaixo do nome da clínica.</small></div>
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
      </section>

      {/* Pagamento */}
      <section className="panel settingsSection">
        <div className="settingsSectionHead"><strong>Pagamento via PIX</strong><small>QR Code exibido ao paciente após confirmar o agendamento.</small></div>
        <div className="formGrid">
          <div className="formRow">
            <label>Chave PIX</label>
            <input value={form.pix_chave} onChange={e => up("pix_chave", e.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" />
          </div>
          {pixPayload && (
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ background: "#f9fafb", border: "1px solid #e5e8ef", borderRadius: 12, padding: 12, flexShrink: 0 }}>
                <QRCode value={pixPayload} size={120} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 5px", fontSize: 11, color: "#7d8597" }}>Prévia do QR Code:</p>
                <code style={{ display: "block", fontSize: 11, background: "#f5f7fb", border: "1px solid #e0e4eb", borderRadius: 8, padding: "7px 10px", wordBreak: "break-all", color: "#2a3244" }}>{form.pix_chave.trim()}</code>
                <button className="secondaryButton" style={{ marginTop: 8, height: 30, fontSize: 11 }} onClick={async () => { await navigator.clipboard.writeText(form.pix_chave.trim()); setCopiedPix(true); setTimeout(() => setCopiedPix(false), 1600); }}>
                  {copiedPix ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar chave</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

    </div>

    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      {error && <div className="onboardingError">{error}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
        <button className="primaryButton" disabled={saving} onClick={handleSave} style={{ minWidth: 160 }}>
          {saved ? <><Check size={15} /> Alterações salvas</> : saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </div>

  </>;
}

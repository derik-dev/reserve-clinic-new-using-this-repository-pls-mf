"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Building2, Stethoscope, Upload, UserCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { reportarErroCliente } from "@/lib/reportarErroCliente";

type Tipo = "autonomo" | "clinica";

type Form = {
  tipo: Tipo;
  nome: string;
  slug: string;
  telefone: string;
  email_contato: string;
  endereco_cep: string;
  endereco_rua: string;
  endereco_numero: string;
  endereco_cidade: string;
  endereco_uf: string;
};

const initial: Form = {
  tipo: "clinica",
  nome: "",
  slug: "",
  telefone: "",
  email_contato: "",
  endereco_cep: "",
  endereco_rua: "",
  endereco_numero: "",
  endereco_cidade: "",
  endereco_uf: "",
};

function slugify(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 40);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(initial);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUserId(data.user.id);
      setUserEmail(data.user.email ?? null);
      setForm((f) => ({ ...f, email_contato: data.user!.email ?? "" }));
    });
  }, [router]);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleLogo(file: File | null) {
    setLogoFile(file);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  function formatCep(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  }

  async function handleCepChange(raw: string) {
    const masked = formatCep(raw);
    update("endereco_cep", masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data && !data.erro) {
        setForm((f) => ({
          ...f,
          endereco_rua: data.logradouro || f.endereco_rua,
          endereco_cidade: data.localidade || f.endereco_cidade,
          endereco_uf: data.uf || f.endereco_uf,
        }));
      }
    } catch {
      // silencioso — usuário pode preencher manualmente
    } finally {
      setCepLoading(false);
    }
  }

  const canAdvance = (() => {
    if (step === 0) return form.nome.trim() && form.slug.trim() && form.email_contato.trim();
    if (step === 1) return form.endereco_cep && form.endereco_rua && form.endereco_cidade && form.endereco_uf;
    return true;
  })();

  async function handleFinish() {
    if (!userId) return;
    setError(null);
    setLoading(true);
    try {
      let logo_url: string | null = null;
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        fd.append("userId", userId);
        const res = await fetch("/api/upload-logo", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Falha ao enviar logo.");
        logo_url = data.url;
      }

      const { error: perfilError } = await supabase.from("perfis").upsert({
        id: userId,
        tipo: form.tipo,
        nome: form.nome.trim(),
        slug: form.slug.trim(),
        telefone: form.telefone || null,
        email_contato: form.email_contato || null,
        endereco_cep: form.endereco_cep || null,
        endereco_rua: form.endereco_rua || null,
        endereco_numero: form.endereco_numero || null,
        endereco_cidade: form.endereco_cidade || null,
        endereco_uf: form.endereco_uf || null,
        logo_url,
        onboarding_concluido: true,
      });
      if (perfilError) throw perfilError;

      await supabase.from("configuracoes").upsert({ perfil_id: userId });

      router.replace("/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "Erro desconhecido";
      console.error("[onboarding] handleFinish falhou", e);
      const isUserError = msg.includes("duplicate") || msg.includes("unique");
      if (!isUserError) {
        void reportarErroCliente("onboarding.finish", msg);
      }
      setError(isUserError ? "Esse link personalizado já está em uso. Escolha outro." : `Não foi possível salvar: ${msg}`);
      setLoading(false);
    }
  }

  if (!userId) return <main className="onboardingPage"><div className="onboardingWrap"><p style={{ color: "#858d9f" }}>Carregando…</p></div></main>;

  return <main className="onboardingPage">
    <header className="onboardingTop">
      <div className="brand"><span><Stethoscope size={17} /></span>Reserve Clinic</div>
      <small>{userEmail}</small>
    </header>
    <div className="onboardingWrap">
      <section className="onboardingCard">
        <div className="onboardingSteps">
          <div className={step === 0 ? "active" : "done"} />
          <div className={step === 1 ? "active" : step > 1 ? "done" : ""} />
          <div className={step === 2 ? "active" : ""} />
        </div>

        {step === 0 && <>
          <h1>Vamos começar</h1>
          <p>Como você vai usar o Reserve Clinic? Isso personaliza o sistema para você.</p>
          <div className="tipoSelect">
            <button type="button" className={form.tipo === "autonomo" ? "active" : ""} onClick={() => update("tipo", "autonomo")}>
              <UserCircle2 size={28} />
              <strong>Profissional autônomo</strong>
              <span>Você atende sozinho, sem equipe</span>
            </button>
            <button type="button" className={form.tipo === "clinica" ? "active" : ""} onClick={() => update("tipo", "clinica")}>
              <Building2 size={28} />
              <strong>Clínica / empresa</strong>
              <span>Você tem uma equipe ou espaço compartilhado</span>
            </button>
          </div>
          <div className="formGrid" style={{ marginTop: 20 }}>
            <div className="formRow">
              <label>{form.tipo === "autonomo" ? "Seu nome" : "Nome da clínica"}</label>
              <input value={form.nome} onChange={(e) => { update("nome", e.target.value); if (!form.slug) update("slug", slugify(e.target.value)); }} placeholder={form.tipo === "autonomo" ? "Ex.: Dra. Ana Lima" : "Ex.: Clínica Vida Nova"} />
            </div>
            <div className="formRow">
              <label>Link personalizado</label>
              <input value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} placeholder={form.tipo === "autonomo" ? "ana-lima" : "vida-nova"} />
              <small>reserveclinic.com/agendamento/{form.slug || (form.tipo === "autonomo" ? "seu-nome" : "sua-clinica")}</small>
            </div>
            <div className="formRow split">
              <div className="formRow"><label>{form.tipo === "autonomo" ? "Seu telefone" : "Telefone"}</label><input value={form.telefone} onChange={(e) => update("telefone", e.target.value)} placeholder="(11) 99999-9999" /></div>
              <div className="formRow"><label>{form.tipo === "autonomo" ? "Seu e-mail" : "E-mail de contato"}</label><input type="email" value={form.email_contato} onChange={(e) => update("email_contato", e.target.value)} placeholder={form.tipo === "autonomo" ? "voce@email.com.br" : "contato@clinica.com.br"} /></div>
            </div>
          </div>
        </>}

        {step === 1 && <>
          <h1>{form.tipo === "autonomo" ? "Onde você atende?" : "Onde sua clínica fica?"}</h1>
          <p>Esse endereço aparece na página pública de agendamento.</p>
          <div className="formGrid">
            <div className="formRow split"><div className="formRow"><label>CEP</label><input value={form.endereco_cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" inputMode="numeric" /><small>{cepLoading ? "Buscando endereço…" : "Preenchemos rua, cidade e UF automaticamente."}</small></div><div className="formRow"><label>Cidade</label><input value={form.endereco_cidade} onChange={(e) => update("endereco_cidade", e.target.value)} placeholder="São Paulo" /></div></div>
            <div className="formRow"><label>Rua / avenida</label><input value={form.endereco_rua} onChange={(e) => update("endereco_rua", e.target.value)} placeholder="Av. Paulista" /></div>
            <div className="formRow split"><div className="formRow"><label>Número</label><input value={form.endereco_numero} onChange={(e) => update("endereco_numero", e.target.value)} placeholder="1200" /></div><div className="formRow"><label>UF</label><input value={form.endereco_uf} onChange={(e) => update("endereco_uf", e.target.value.toUpperCase().slice(0,2))} placeholder="SP" maxLength={2} /></div></div>
          </div>
        </>}

        {step === 2 && <>
          <h1>{form.tipo === "autonomo" ? "Deixe com a sua cara" : "Deixe com a cara da sua marca"}</h1>
          <p>{form.tipo === "autonomo" ? "Adicione sua foto ou logo de perfil." : "Faça o upload da sua logo para personalizar o painel e o link de agendamento."}</p>
          <div className="formGrid">
            <div className="formRow">
              <label>{form.tipo === "autonomo" ? "Foto ou logo" : "Logo"}</label>
              <div className="logoUpload">
                <div className="preview">{logoPreview ? <img src={logoPreview} alt="Prévia da logo" /> : "Logo"}</div>
                <div style={{ flex: 1 }}>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleLogo(e.target.files?.[0] ?? null)} />
                  <button type="button" onClick={() => fileRef.current?.click()}><Upload size={13} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />{logoFile ? "Trocar imagem" : "Enviar imagem"}</button>
                  <small style={{ display: "block", color: "#858d9f", fontSize: 11, marginTop: 6 }}>PNG, JPG ou SVG. Recomendado 512×512.</small>
                </div>
              </div>
            </div>
          </div>
        </>}

        {error && <div className="onboardingError">{error}</div>}

        <div className="onboardingNav">
          {step > 0 ? <button type="button" className="back" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Voltar</button> : <span />}
          {step < 2 ? <button type="button" className="next" disabled={!canAdvance} onClick={() => setStep(step + 1)}>Continuar <ArrowRight size={15} /></button> : <button type="button" className="next" disabled={loading} onClick={handleFinish}>{loading ? "Salvando…" : <>Concluir <Check size={15} /></>}</button>}
        </div>
      </section>
    </div>
  </main>;
}

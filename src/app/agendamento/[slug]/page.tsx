"use client";

import Link from "next/link";
import { MapPin, Stethoscope, Check } from "lucide-react";
import { useEffect, useMemo, useState, use } from "react";
import { supabase } from "@/lib/supabase";

type PerfilPublic = {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  cor_primaria: string | null;
  cor_secundaria: string | null;
  telefone: string | null;
  email_contato: string | null;
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
};

type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
type DayConfig = { aberto: boolean; inicio: string; fim: string };
type AgendaConfig = {
  dias: Record<DayKey, DayConfig>;
  feriados: string[];
  profissionais: { id: string; nome: string; dias: DayKey[] }[];
  duracao_min: number;
};

const DAY_ORDER: DayKey[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const DEFAULT_CONFIG: AgendaConfig = {
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
  profissionais: [],
  duracao_min: 60,
};

type Form = {
  nome: string;
  telefone: string;
  email: string;
  data: string;
  hora: string;
  servico: string;
  observacoes: string;
};

const emptyForm: Form = { nome: "", telefone: "", email: "", data: "", hora: "", servico: "", observacoes: "" };

function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function minToLabel(min: number) { return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`; }
function jsDayToKey(d: Date): DayKey { return DAY_ORDER[(d.getDay() + 6) % 7]; }
function mergeConfig(raw: unknown): AgendaConfig {
  const r = (raw ?? {}) as Partial<AgendaConfig>;
  return {
    dias: { ...DEFAULT_CONFIG.dias, ...(r.dias ?? {}) },
    feriados: Array.isArray(r.feriados) ? r.feriados : [],
    profissionais: Array.isArray(r.profissionais) ? r.profissionais : [],
    duracao_min: typeof r.duracao_min === "number" && r.duracao_min > 0 ? r.duracao_min : 60,
  };
}

export default function AgendamentoPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [perfil, setPerfil] = useState<PerfilPublic | null>(null);
  const [config, setConfig] = useState<AgendaConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm);
  const [busyRanges, setBusyRanges] = useState<{ inicio: number; fim: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("perfis").select("id, nome, slug, logo_url, cor_primaria, cor_secundaria, telefone, email_contato, endereco_rua, endereco_numero, endereco_cidade, endereco_uf").eq("slug", slug).maybeSingle();
      setPerfil(data as PerfilPublic | null);
      if (data) {
        const { data: conf } = await supabase.from("configuracoes").select("agenda_config").eq("perfil_id", (data as PerfilPublic).id).maybeSingle();
        setConfig(mergeConfig(conf?.agenda_config));
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    (async () => {
      if (!perfil || !form.data) { setBusyRanges([]); return; }
      const inicio = new Date(`${form.data}T00:00:00`);
      const fim = new Date(`${form.data}T23:59:59`);
      const { data } = await supabase.from("consultas").select("data_hora, duracao_min").eq("perfil_id", perfil.id).gte("data_hora", inicio.toISOString()).lte("data_hora", fim.toISOString());
      const ranges = ((data as { data_hora: string; duracao_min: number }[] | null) ?? []).map(c => {
        const dt = new Date(c.data_hora);
        const start = dt.getHours() * 60 + dt.getMinutes();
        return { inicio: start, fim: start + c.duracao_min };
      });
      setBusyRanges(ranges);
    })();
  }, [perfil, form.data]);

  const endereco = useMemo(() => {
    if (!perfil) return "";
    const parts = [perfil.endereco_rua, perfil.endereco_numero, perfil.endereco_cidade, perfil.endereco_uf].filter(Boolean);
    return parts.join(", ");
  }, [perfil]);

  const primary = perfil?.cor_primaria ?? "#4c6fff";

  const diaInfo = useMemo(() => {
    if (!form.data) return null;
    const d = new Date(`${form.data}T00:00:00`);
    const key = jsDayToKey(d);
    const feriado = config.feriados.includes(form.data);
    return { key, dayConfig: config.dias[key], feriado };
  }, [form.data, config]);

  const slots = useMemo(() => {
    if (!diaInfo || !diaInfo.dayConfig.aberto || diaInfo.feriado) return [];
    const inicioMin = timeToMin(diaInfo.dayConfig.inicio);
    const fimMin = timeToMin(diaInfo.dayConfig.fim);
    const dur = config.duracao_min;
    const arr: { hora: string; ocupado: boolean }[] = [];
    for (let m = inicioMin; m + dur <= fimMin; m += dur) {
      const slotStart = m;
      const slotEnd = m + dur;
      const ocupado = busyRanges.some(r => slotStart < r.fim && r.inicio < slotEnd);
      arr.push({ hora: minToLabel(m), ocupado });
    }
    return arr;
  }, [diaInfo, config.duracao_min, busyRanges]);

  const minDataAtendida = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function handleConfirm() {
    if (!perfil) return;
    if (!form.nome.trim() || !form.data || !form.hora) { setError("Preencha nome, data e horário."); return; }
    setError(null);
    setSaving(true);
    const dataIso = new Date(`${form.data}T${form.hora}:00`).toISOString();
    const { error: err } = await supabase.from("consultas").insert({
      perfil_id: perfil.id,
      paciente_nome: form.nome.trim(),
      paciente_telefone: form.telefone || null,
      paciente_email: form.email || null,
      data_hora: dataIso,
      duracao_min: config.duracao_min,
      servico: form.servico || null,
      status: "aguardando",
      observacoes: form.observacoes || null,
      origem: "publico",
    });
    setSaving(false);
    if (err) { setError("Não foi possível confirmar. Tente novamente."); return; }
    setDone(true);
  }

  if (loading) {
    return <main className="bookingPage"><div style={{ padding: 40, textAlign: "center", color: "#858d9f" }}>Carregando…</div></main>;
  }
  if (!perfil) {
    return <main className="bookingPage"><div style={{ padding: 40, textAlign: "center", color: "#858d9f" }}>Clínica não encontrada.</div></main>;
  }

  const diaMensagem = diaInfo && (!diaInfo.dayConfig.aberto ? "Não atendemos nesse dia da semana." : diaInfo.feriado ? "Esse dia é feriado — sem atendimento." : slots.length === 0 ? "Nenhum horário disponível." : null);

  return <main className="bookingPage" style={{ ["--brand-primary" as string]: primary }}>
    <header className="bookingHeader">
      <Link href="/" className="bookingBrand"><span style={{ background: primary }}><Stethoscope size={18} /></span>Reserve Clinic</Link>
      <small>Agendamento seguro</small>
    </header>
    <div className="bookingContainer">
      <section className="bookingClinic">
        <div className="clinicLogo" style={{ background: primary, color: "#fff", overflow: "hidden" }}>{perfil.logo_url ? <img src={perfil.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : perfil.nome.slice(0, 1)}</div>
        <div><h1>{perfil.nome}</h1>{endereco && <p><MapPin size={15} /> {endereco}</p>}</div>
      </section>

      {done ? (
        <section className="panel" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e8f8f3", color: "#15967e", display: "grid", placeItems: "center", margin: "0 auto 14px" }}><Check size={26} /></div>
          <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Solicitação enviada!</h2>
          <p style={{ margin: 0, color: "#7d8597", fontSize: 13 }}>A clínica vai confirmar em breve pelo contato informado.</p>
        </section>
      ) : (
        <>
          <div className="bookingSteps">
            <div className={step === 0 ? "active" : step > 0 ? "done" : ""}><span>1</span><strong>Data e horário</strong></div>
            <i />
            <div className={step === 1 ? "active" : ""}><span>2</span><strong>Seus dados</strong></div>
            <i />
            <div><span>3</span><strong>Confirmação</strong></div>
          </div>
          <section className="panel" style={{ padding: 22 }}>
            {step === 0 && (
              <div className="formGrid">
                <div className="formRow split">
                  <div className="formRow"><label>Data</label><input type="date" value={form.data} min={minDataAtendida} onChange={(e) => setForm({ ...form, data: e.target.value, hora: "" })} /></div>
                  <div className="formRow"><label>Serviço (opcional)</label><input value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })} placeholder="Consulta clínica" /></div>
                </div>
                {form.data && (
                  <div className="formRow">
                    <label>Horários disponíveis <small style={{ fontWeight: 500 }}>({config.duracao_min} min cada)</small></label>
                    {diaMensagem ? (
                      <p style={{ padding: 14, background: "#fafbfc", border: "1px solid #eceef3", borderRadius: 8, color: "#7d8597", fontSize: 12, margin: 0 }}>{diaMensagem}</p>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {slots.map(s => {
                          const active = form.hora === s.hora;
                          return (
                            <button type="button" key={s.hora} disabled={s.ocupado} onClick={() => setForm({ ...form, hora: s.hora })} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${active ? primary : "#dfe3eb"}`, background: active ? primary : s.ocupado ? "#f3f5f9" : "#fff", color: active ? "#fff" : s.ocupado ? "#b3b8c4" : "#394155", fontSize: 12, fontWeight: 600, cursor: s.ocupado ? "not-allowed" : "pointer", textDecoration: s.ocupado ? "line-through" : "none" }}>{s.hora}</button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                  <button className="primaryButton" disabled={!form.data || !form.hora} onClick={() => setStep(1)} style={{ background: primary }}>Continuar</button>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="formGrid">
                <div className="formRow"><label>Nome completo</label><input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome" /></div>
                <div className="formRow split">
                  <div className="formRow"><label>Telefone</label><input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" /></div>
                  <div className="formRow"><label>E-mail</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" /></div>
                </div>
                <div className="formRow"><label>Observações (opcional)</label><textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Convênio, sintomas, etc." /></div>
                {error && <div className="onboardingError">{error}</div>}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <button className="secondaryButton" onClick={() => setStep(0)}>Voltar</button>
                  <button className="primaryButton" disabled={saving} onClick={handleConfirm} style={{ background: primary }}>{saving ? "Enviando…" : "Confirmar agendamento"}</button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
    <footer className="bookingFooter">Agendamento protegido pela <strong>Reserve Clinic</strong> · Seus dados estão seguros</footer>
  </main>;
}

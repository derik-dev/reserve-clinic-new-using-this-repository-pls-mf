"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, Copy, MapPin, MessageCircle, Stethoscope, Check } from "lucide-react";
import QRCode from "react-qr-code";
import { useEffect, useMemo, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { PixCheckout } from "@/components/PixCheckout";

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
  pix_chave: string | null;
  valor_consulta: number | null;
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
  cpf: string;
  telefone: string;
  email: string;
  data: string;
  hora: string;
  servico: string;
  observacoes: string;
  profissional_id: string;
  profissional_nome: string;
};

const emptyForm: Form = { nome: "", cpf: "", telefone: "", email: "", data: "", hora: "", servico: "", observacoes: "", profissional_id: "", profissional_nome: "" };

type ProfissionalPublic = { id: string; nome: string; especialidade: string | null; foto_url: string | null };

type PendingBooking = { nome: string; data: string; hora: string; servico: string; profissional: string; clinicNome: string };

function buildWhatsapp(telefone: string | null, b: PendingBooking): string {
  if (!telefone) return "#";
  const digits = telefone.replace(/\D/g, "");
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  const dateStr = new Date(`${b.data}T12:00:00`).toLocaleDateString("pt-BR");
  const msg = `Olá! Me chamo ${b.nome} e agendei${b.servico ? ` ${b.servico}` : " uma consulta"}${b.profissional ? ` com ${b.profissional}` : ""} em ${b.clinicNome} para ${dateStr} às ${b.hora}. Segue o comprovante do pagamento PIX.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

function pixField(id: string, value: string) { return `${id}${String(value.length).padStart(2, "0")}${value}`; }
function crc16(str: string) { let c = 0xffff; for (let i = 0; i < str.length; i++) { c ^= str.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) c = (c & 0x8000) ? (c << 1) ^ 0x1021 : c << 1; } return ((c & 0xffff).toString(16).toUpperCase().padStart(4, "0")); }
function gerarPix(chave: string, nome: string, cidade: string) { const mai = pixField("00", "BR.GOV.BCB.PIX") + pixField("01", chave); const body = [pixField("00", "01"), pixField("26", mai), pixField("52", "0000"), pixField("53", "986"), pixField("58", "BR"), pixField("59", nome.slice(0, 25)), pixField("60", (cidade || "Brasil").slice(0, 15)), pixField("62", pixField("05", "***")), "6304"].join(""); return body + crc16(body); }

function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function minToLabel(min: number) { return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`; }
function jsDayToKey(d: Date): DayKey { return DAY_ORDER[(d.getDay() + 6) % 7]; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function toIsoDate(d: Date) { return d.toISOString().slice(0, 10); }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function monthGrid(view: Date) { const first = startOfMonth(view); const start = addDays(first, -first.getDay()); return Array.from({ length: 42 }, (_, i) => addDays(start, i)); }

const WEEKDAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
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
  const [profissionais, setProfissionais] = useState<ProfissionalPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm);
  const [busyRanges, setBusyRanges] = useState<{ inicio: number; fim: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [agendamentoId, setAgendamentoId] = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()));

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("perfis").select("id, nome, slug, logo_url, cor_primaria, cor_secundaria, telefone, email_contato, endereco_rua, endereco_numero, endereco_cidade, endereco_uf, pix_chave, valor_consulta").eq("slug", slug).maybeSingle();
      setPerfil(data as PerfilPublic | null);
      if (data) {
        const perfilId = (data as PerfilPublic).id;
        const [conf, profs] = await Promise.all([
          supabase.from("configuracoes").select("agenda_config").eq("perfil_id", perfilId).maybeSingle(),
          supabase.from("profissionais").select("id, nome, especialidade, foto_url").eq("perfil_id", perfilId).eq("ativo", true).order("nome"),
        ]);
        setConfig(mergeConfig(conf.data?.agenda_config));
        setProfissionais((profs.data as ProfissionalPublic[] | null) ?? []);
      }
      try {
        const stored = localStorage.getItem(`rc_booking_${slug}`);
        if (stored) setPendingBooking(JSON.parse(stored));
      } catch { /* ignorar */ }
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

  const selectedProf = useMemo(
    () => config.profissionais.find(p => p.id === form.profissional_id) ?? null,
    [config.profissionais, form.profissional_id]
  );

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
    const now = new Date();
    const isToday = form.data === toIsoDate(now);
    const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() : -1;
    const arr: { hora: string; ocupado: boolean }[] = [];
    for (let m = inicioMin; m + dur <= fimMin; m += dur) {
      const slotEnd = m + dur;
      const passado = isToday && slotEnd <= nowMin;
      const ocupado = passado || busyRanges.some(r => m < r.fim && r.inicio < slotEnd);
      arr.push({ hora: minToLabel(m), ocupado });
    }
    return arr;
  }, [diaInfo, config.duracao_min, busyRanges, form.data]);

  const hoje = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const calDias = useMemo(() => monthGrid(viewMonth), [viewMonth]);

  async function handleConfirm() {
    if (!perfil) return;
    if (!form.nome.trim() || !form.data || !form.hora) { setError("Preencha nome, data e horário."); return; }
    if (perfil.valor_consulta) {
      if (!form.email.trim()) { setError("Informe seu e-mail para realizar o pagamento PIX."); return; }
      if (!form.cpf.trim()) { setError("Informe seu CPF para realizar o pagamento PIX."); return; }
    }
    setError(null);
    setSaving(true);

    const dataIso = new Date(`${form.data}T${form.hora}:00`).toISOString();

    // 1. Cria consulta no dashboard
    const { error: err } = await supabase.from("consultas").insert({
      perfil_id: perfil.id,
      paciente_nome: form.nome.trim(),
      paciente_telefone: form.telefone || null,
      paciente_email: form.email || null,
      data_hora: dataIso,
      duracao_min: config.duracao_min,
      servico: form.servico || null,
      profissional: form.profissional_nome || null,
      status: "aguardando",
      observacoes: form.observacoes || null,
    });
    if (err) { setSaving(false); setError("Não foi possível confirmar. Tente novamente."); return; }

    // 2. Se há valor_consulta, cria agendamento via API (service role, sem RLS)
    let agId: string | null = null;
    if (perfil.valor_consulta) {
      try {
        const res = await fetch("/api/criar-agendamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            perfilId: perfil.id,
            clienteNome: form.nome.trim(),
            clienteTelefone: form.telefone || undefined,
            clienteEmail: form.email || undefined,
            data: form.data,
            hora: form.hora,
          }),
        });
        const data = await res.json() as { id?: string; error?: string };
        if (res.ok && data.id) agId = data.id;
        else setError(`Erro ao criar agendamento: ${data.error ?? "desconhecido"}`);
      } catch {
        setError("Erro de conexão ao criar agendamento.");
      }
    }

    setSaving(false);
    const bookingData: PendingBooking = { nome: form.nome.trim(), data: form.data, hora: form.hora, servico: form.servico, profissional: form.profissional_nome, clinicNome: perfil.nome };
    try { localStorage.setItem(`rc_booking_${slug}`, JSON.stringify(bookingData)); } catch { /* ignorar */ }
    setAgendamentoId(agId);
    setDone(true);
  }

  if (loading) {
    return <main className="bookingPage"><div style={{ padding: 40, textAlign: "center", color: "#858d9f" }}>Carregando…</div></main>;
  }
  if (!perfil) {
    return <main className="bookingPage"><div style={{ padding: 40, textAlign: "center", color: "#858d9f" }}>Clínica não encontrada.</div></main>;
  }

  // Fluxo PIX Asaas: substitui a página inteira pelo checkout
  if (done && agendamentoId && perfil.valor_consulta) {
    return (
      <PixCheckout
        agendamentoId={agendamentoId}
        clienteNome={form.nome}
        clienteCpf={form.cpf || undefined}
        clienteEmail={form.email || undefined}
        valor={perfil.valor_consulta}
      />
    );
  }

  const diaMensagem = diaInfo && (!diaInfo.dayConfig.aberto ? "Não atendemos nesse dia da semana." : diaInfo.feriado ? "Esse dia é feriado — sem atendimento." : slots.length === 0 || slots.every(s => s.ocupado) ? "Nenhum horário disponível." : null);

  return <main className="bookingPage" style={{ ["--brand-primary" as string]: primary }}>
    <header className="bookingHeader">
      <Link href="/" className="bookingBrand"><span style={{ background: primary }}><Stethoscope size={18} /></span>Reserve Clinic</Link>
      <small>Agendamento seguro</small>
    </header>
    <div className="bookingContainer">
      <section className="bookingClinic">
        <div className="clinicLogo" style={{ background: primary, color: "#fff", overflow: "hidden" }}>{perfil.logo_url ? <img src={perfil.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : perfil.nome.slice(0, 1)}</div>
        <div>
          <h1>{perfil.nome}</h1>
          {endereco && <p><MapPin size={15} /> {endereco}</p>}
          {perfil.valor_consulta != null && (
            <p style={{ margin: "6px 0 0", display: "inline-flex", alignItems: "center", gap: 6, background: "#f0f4ff", color: primary, borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>
              Consulta: {perfil.valor_consulta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          )}
        </div>
      </section>

      {pendingBooking && !done ? (
        /* Tela de aguardando confirmação — aparece ao voltar ao link */
        <section className="panel bookingPendingCard">
          <div className="bookingPendingIcon"><Clock size={26} /></div>
          <h2>Aguardando confirmação</h2>
          <p>Assim que a clínica confirmar o PIX, você receberá uma mensagem confirmando sua consulta.</p>
          <div className="bookingPendingDetails">
            <span><strong>Paciente:</strong> {pendingBooking.nome}</span>
            <span><strong>Data:</strong> {new Date(`${pendingBooking.data}T12:00:00`).toLocaleDateString("pt-BR")} às {pendingBooking.hora}</span>
            {pendingBooking.servico && <span><strong>Serviço:</strong> {pendingBooking.servico}</span>}
            {pendingBooking.profissional && <span><strong>Profissional:</strong> {pendingBooking.profissional}</span>}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 20 }}>
            {perfil.telefone && (
              <a className="bookingWhatsappBtn" href={buildWhatsapp(perfil.telefone, pendingBooking)} target="_blank" rel="noreferrer">
                <MessageCircle size={16} /> Reenviar comprovante
              </a>
            )}
            <button className="secondaryButton" onClick={() => {
              try { localStorage.removeItem(`rc_booking_${slug}`); } catch { /* ignorar */ }
              setPendingBooking(null);
              setForm(emptyForm);
              setStep(0);
            }}>
              Novo agendamento
            </button>
          </div>
        </section>
      ) : done ? (
        <>
          <section className="panel" style={{ padding: 28, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#e8f8f3", color: "#15967e", display: "grid", placeItems: "center", margin: "0 auto 12px" }}><Check size={24} /></div>
            <h2 style={{ margin: "0 0 5px", fontSize: 18 }}>Solicitação enviada!</h2>
            <p style={{ margin: 0, color: "#7d8597", fontSize: 13 }}>Pague via PIX abaixo e envie o comprovante para a clínica pelo WhatsApp.</p>
            {error && <p style={{ margin: "12px 0 0", color: "#dc2626", fontSize: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px" }}>{error}</p>}
          </section>

          {perfil.pix_chave && (() => {
            const pixPayload = gerarPix(perfil.pix_chave, perfil.nome, perfil.endereco_cidade ?? "Brasil");
            const booking: PendingBooking = { nome: form.nome, data: form.data, hora: form.hora, servico: form.servico, profissional: form.profissional_nome, clinicNome: perfil.nome };
            return (
              <section className="panel bookingPixCard">
                <div className="bookingPixHeader">
                  <strong>Pagamento via PIX</strong>
                  <small>Escaneie o QR Code no seu banco para pagar</small>
                </div>
                <div className="bookingPixBody">
                  <div className="bookingPixQr">
                    <QRCode value={pixPayload} size={160} />
                  </div>
                  <div className="bookingPixInfo">
                    <p>Beneficiário</p>
                    <strong>{perfil.nome}</strong>
                    <p style={{ marginTop: 12 }}>Chave PIX</p>
                    <code>{perfil.pix_chave}</code>
                    <button
                      className="secondaryButton"
                      style={{ marginTop: 10, height: 32, fontSize: 12 }}
                      onClick={async () => { await navigator.clipboard.writeText(perfil.pix_chave!); setCopiedPix(true); setTimeout(() => setCopiedPix(false), 1600); }}
                    >
                      {copiedPix ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar chave</>}
                    </button>
                  </div>
                </div>
                {perfil.telefone && (
                  <div style={{ borderTop: "1px solid #eef0f6", marginTop: 20, paddingTop: 18, textAlign: "center" }}>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "#7d8597" }}>Após pagar, envie o comprovante para a clínica confirmar sua consulta:</p>
                    <a className="bookingWhatsappBtn" href={buildWhatsapp(perfil.telefone, booking)} target="_blank" rel="noreferrer">
                      <MessageCircle size={16} /> Enviar comprovante pelo WhatsApp
                    </a>
                  </div>
                )}
              </section>
            );
          })()}

          {!perfil.pix_chave && perfil.telefone && (() => {
            const booking: PendingBooking = { nome: form.nome, data: form.data, hora: form.hora, servico: form.servico, profissional: form.profissional_nome, clinicNome: perfil.nome };
            return (
              <section className="panel" style={{ padding: 24, textAlign: "center" }}>
                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#7d8597" }}>Entre em contato com a clínica para combinar o pagamento:</p>
                <a className="bookingWhatsappBtn" href={buildWhatsapp(perfil.telefone, booking)} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} /> Enviar comprovante pelo WhatsApp
                </a>
              </section>
            );
          })()}
        </>
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
                {profissionais.length > 0 && (
                  <div className="formRow">
                    <label>Profissional</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, profissional_id: "", profissional_nome: "", data: "", hora: "" })}
                        style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${!form.profissional_id ? primary : "#dfe3eb"}`, background: !form.profissional_id ? primary : "#fff", color: !form.profissional_id ? "#fff" : "#394155", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Qualquer um
                      </button>
                      {profissionais.map(p => {
                        const active = form.profissional_id === p.id;
                        return (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => setForm({ ...form, profissional_id: p.id, profissional_nome: p.nome, data: "", hora: "" })}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 8, border: `1px solid ${active ? primary : "#dfe3eb"}`, background: active ? primary : "#fff", color: active ? "#fff" : "#394155", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                          >
                            {p.foto_url ? (
                              <img src={p.foto_url} alt="" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                              <span style={{ width: 26, height: 26, borderRadius: "50%", background: active ? "rgba(255,255,255,0.25)" : "#eef0f6", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, color: active ? "#fff" : "#858d9f" }}>
                                {p.nome.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                            <span>
                              {p.nome}
                              {p.especialidade && <span style={{ display: "block", fontSize: 10, fontWeight: 400, opacity: 0.75 }}>{p.especialidade}</span>}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="formRow"><label>Serviço (opcional)</label><input value={form.servico} onChange={(e) => setForm({ ...form, servico: e.target.value })} placeholder="Consulta clínica" /></div>
                <div className="formRow">
                  <label>Selecione uma data</label>
                  <div className="bookingCalendarWrap">
                    <div className="bookingCalHead">
                      <button type="button" className="iconButton" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} aria-label="Mês anterior"><ChevronLeft size={16} /></button>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#1b2335", textTransform: "capitalize" }}>{viewMonth.toLocaleDateString("pt-BR", { month: "long" })} <small style={{ fontWeight: 400, color: "#7d8597" }}>{viewMonth.getFullYear()}</small></span>
                      <button type="button" className="iconButton" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} aria-label="Próximo mês"><ChevronRight size={16} /></button>
                    </div>
                    <div className="bookingCalWeek">
                      {WEEKDAY_LABELS.map(l => <span key={l}>{l}</span>)}
                    </div>
                    <div className="bookingCalGrid">
                      {calDias.map(d => {
                        const iso = toIsoDate(d);
                        const outroMes = d.getMonth() !== viewMonth.getMonth();
                        const ehHoje = isSameDay(d, hoje);
                        const selected = form.data === iso;
                        const isPast = d < hoje;
                        const key = jsDayToKey(d);
                        const feriado = config.feriados.includes(iso);
                        const fechado = !config.dias[key].aberto || feriado || (selectedProf ? !selectedProf.dias.includes(key) : false);
                        const disabled = isPast || outroMes || fechado;
                        return (
                          <button
                            type="button"
                            key={iso + d.getMonth()}
                            disabled={disabled}
                            onClick={() => setForm({ ...form, data: iso, hora: "" })}
                            className={`bookingCalCell${selected ? " isSelected" : ""}${ehHoje ? " isToday" : ""}${outroMes ? " isOtherMonth" : ""}${fechado && !outroMes ? " isClosed" : ""}`}
                          >
                            {d.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
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
                  <div className="formRow">
                    <label>E-mail {perfil.valor_consulta && <span style={{ color: "#dc2626", fontWeight: 400 }}>*</span>}</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" required={!!perfil.valor_consulta} />
                  </div>
                </div>
                {perfil.valor_consulta && (
                  <div className="formRow" style={{ maxWidth: 240 }}>
                    <label>CPF <span style={{ color: "#dc2626", fontWeight: 400 }}>*</span> <span style={{ color: "#858d9f", fontWeight: 400 }}>(obrigatório para PIX)</span></label>
                    <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" inputMode="numeric" required />
                  </div>
                )}
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

"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Copy, ShieldCheck, CalendarDays, MessageCircle, Check } from "lucide-react";
import QRCode from "react-qr-code";
import { useEffect, useMemo, useRef, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PixCheckout } from "@/components/PixCheckout";
import { reportarErroCliente } from "@/lib/reportarErroCliente";
import { BookingAvatar, BookingClinicSummary, BookingComparison, BookingSteps, type BookingAppearance } from "./BookingPresentation";
import styles from "./booking.module.css";

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
type ProfDisponibilidade = { dias: Record<DayKey, DayConfig>; feriados: string[] };
type AgendaConfig = {
  dias: Record<DayKey, DayConfig>;
  feriados: string[];
  profissionais: { id: string; nome: string; dias: DayKey[] }[];
  duracao_min: number;
  disponibilidade: Record<string, ProfDisponibilidade>;
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
  disponibilidade: {},
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

type ProfissionalPublic = { id: string; nome: string; especialidade: string | null; foto_url: string | null; valor_consulta: number | null };

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
    disponibilidade: (r.disponibilidade && typeof r.disponibilidade === "object") ? r.disponibilidade as Record<string, ProfDisponibilidade> : {},
  };
}

function getProfDisp(config: AgendaConfig, profId: string | null): { dias: Record<DayKey, DayConfig>; feriados: string[] } {
  if (!profId || !config.disponibilidade[profId]) return { dias: config.dias, feriados: [] };
  return { dias: { ...config.dias, ...config.disponibilidade[profId].dias }, feriados: config.disponibilidade[profId].feriados };
}

function isFeriado(config: AgendaConfig, profId: string | null, isoDate: string): boolean {
  return config.feriados.includes(isoDate) || (profId ? (config.disponibilidade[profId]?.feriados ?? []).includes(isoDate) : false);
}

export default function AgendamentoPublicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const appearance: BookingAppearance = searchParams.get("visual") === "premium" ? "premium" : "clean";
  const comparing = searchParams.get("comparar") === "1";
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const profParam = searchParams.get("p");
  const [perfil, setPerfil] = useState<PerfilPublic | null>(null);
  const [config, setConfig] = useState<AgendaConfig>(DEFAULT_CONFIG);
  const [profissionais, setProfissionais] = useState<ProfissionalPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm);
  const [busyRanges, setBusyRanges] = useState<{ inicio: number; fim: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [agendamentoId, setAgendamentoId] = useState<string | null>(null);

  const [copiedPix, setCopiedPix] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()));

  function changeAppearance(value: BookingAppearance) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("visual", value);
    router.replace(`?${next.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (step > 0) stepHeading.current?.focus();
  }, [step]);

  async function loadData() {
    setInitError(false);
    setLoading(true);
    try {
      await Promise.race([
        (async () => {
          const { data } = await supabase.from("perfis").select("id, nome, slug, logo_url, cor_primaria, cor_secundaria, telefone, email_contato, endereco_rua, endereco_numero, endereco_cidade, endereco_uf, pix_chave, valor_consulta").eq("slug", slug).maybeSingle();
          setPerfil(data as PerfilPublic | null);
          if (data) {
            const perfilId = (data as PerfilPublic).id;
            const [conf, profs] = await Promise.all([
              supabase.from("configuracoes").select("agenda_config").eq("perfil_id", perfilId).maybeSingle(),
              supabase.from("profissionais").select("id, nome, especialidade, foto_url, valor_consulta").eq("perfil_id", perfilId).eq("ativo", true).order("nome"),
            ]);
            setConfig(mergeConfig(conf.data?.agenda_config));
            const lista = (profs.data as ProfissionalPublic[] | null) ?? [];
            setProfissionais(lista);
            if (profParam) {
              const fp = lista.find(p => p.id === profParam);
              if (fp) setForm(f => ({ ...f, profissional_id: fp.id, profissional_nome: fp.nome }));
            } else if (lista.length > 0) {
              setForm(f => ({ ...f, profissional_id: lista[0].id, profissional_nome: lista[0].nome }));
            }
          }
        })(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000)),
      ]);
      try { localStorage.removeItem(`rc_booking_${slug}`); } catch { /* ignorar */ }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      void reportarErroCliente(`agendamento/${slug}`, msg);
      setInitError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [slug]);

  useEffect(() => {
    (async () => {
      if (!perfil || !form.data) { setBusyRanges([]); return; }
      const inicio = new Date(`${form.data}T00:00:00`);
      const fim = new Date(`${form.data}T23:59:59`);
      let query = supabase.from("consultas").select("data_hora, duracao_min").eq("perfil_id", perfil.id).gte("data_hora", inicio.toISOString()).lte("data_hora", fim.toISOString());
      if (form.profissional_id) query = query.eq("profissional_id", form.profissional_id);
      const { data } = await query;
      const ranges = ((data as { data_hora: string; duracao_min: number }[] | null) ?? []).map(c => {
        const dt = new Date(c.data_hora);
        const start = dt.getHours() * 60 + dt.getMinutes();
        return { inicio: start, fim: start + c.duracao_min };
      });
      setBusyRanges(ranges);
    })();
  }, [perfil, form.data, form.profissional_nome]);

  const endereco = useMemo(() => {
    if (!perfil) return "";
    const parts = [perfil.endereco_rua, perfil.endereco_numero, perfil.endereco_cidade, perfil.endereco_uf].filter(Boolean);
    return parts.join(", ");
  }, [perfil]);

  const primary = perfil?.cor_primaria ?? "#4c6fff";

  const selectedProf = useMemo(
    () => profissionais.find(p => p.id === form.profissional_id) ?? null,
    [profissionais, form.profissional_id]
  );

  const valorEfetivo = useMemo(
    () => selectedProf?.valor_consulta ?? perfil?.valor_consulta ?? null,
    [selectedProf, perfil]
  );

  const profId = form.profissional_id || null;
  const profDisp = useMemo(() => getProfDisp(config, profId), [config, profId]);

  const diaInfo = useMemo(() => {
    if (!form.data) return null;
    const d = new Date(`${form.data}T00:00:00`);
    const key = jsDayToKey(d);
    const feriado = isFeriado(config, profId, form.data);
    return { key, dayConfig: profDisp.dias[key], feriado };
  }, [form.data, config, profId, profDisp]);

  const slots = useMemo(() => {
    if (!diaInfo || !diaInfo.dayConfig.aberto || diaInfo.feriado) return [];
    const inicioMin = timeToMin(diaInfo.dayConfig.inicio);
    const fimMin = timeToMin(diaInfo.dayConfig.fim);
    const dur = config.duracao_min;
    const now = new Date();
    const isToday = form.data === toIsoDate(now);
    const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() : -1;
    const ANTECEDENCIA = 10;
    const arr: { hora: string; ocupado: boolean }[] = [];
    for (let m = inicioMin; m + dur <= fimMin; m += dur) {
      const slotEnd = m + dur;
      const passado = isToday && m - nowMin <= ANTECEDENCIA;
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
    if (valorEfetivo) {
      if (!form.email.trim()) { setError("Informe seu e-mail para realizar o pagamento PIX."); return; }
      if (!form.cpf.trim()) { setError("Informe seu CPF para realizar o pagamento PIX."); return; }
    }
    setError(null);
    setSaving(true);

    let agId: string | null = null;
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
          duracaoMin: config.duracao_min,
          servico: form.servico || undefined,
          profissional: form.profissional_nome || undefined,
          profissionalId: form.profissional_id || undefined,
          observacoes: form.observacoes || undefined,
        }),
      });
      const json = await res.json() as { id?: string; error?: string };
      if (res.ok && json.id) agId = json.id;
      else { setSaving(false); setError(`Não foi possível confirmar: ${json.error ?? "tente novamente."}`); return; }
    } catch {
      setSaving(false); setError("Erro de conexão. Tente novamente."); return;
    }

    setSaving(false);
    setAgendamentoId(agId);
    setDone(true);
  }

  if (initError) {
    return (
      <main className="bookingPage" style={{ background: "#08101f", color: "#e6ecf8" }}>
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontFamily: "var(--font-space)", fontStyle: "italic", fontWeight: 400, fontSize: 44, lineHeight: 1.1, margin: "0 0 16px", color: "#fff" }}>Algo deu errado.</h1>
            <p style={{ color: "#a4adc7", fontSize: 15, lineHeight: 1.55, margin: "0 0 28px" }}>Não foi possível carregar a agenda no momento. Tenta novamente em instantes.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={loadData} style={{ background: "#4c6fff", color: "#fff", border: 0, borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 24px rgba(76,111,255,.35)" }}>Tentar novamente</button>
              {perfil?.telefone && (() => {
                const digits = perfil.telefone.replace(/\D/g, "");
                const phone = digits.startsWith("55") ? digits : `55${digits}`;
                return (
                  <a href={`https://wa.me/${phone}?text=${encodeURIComponent(`Olá! Estou tentando agendar em ${perfil.nome} mas a página não carregou.`)}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25d366", color: "#fff", border: 0, borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}><MessageCircle size={16} /> Falar com a clínica</a>
                );
              })()}
              <a href="https://wa.me/5524992710003?text=Ol%C3%A1%2C%20estou%20com%20problema%20para%20acessar%20a%20agenda." target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", color: "#e6ecf8", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}><MessageCircle size={16} /> Falar com suporte</a>
            </div>
          </div>
        </div>
      </main>
    );
  }
  if (loading) {
    return <main className="bookingPage"><div style={{ padding: 40, textAlign: "center", color: "#858d9f" }}>Carregando…</div></main>;
  }
  if (!perfil) {
    return <main className="bookingPage"><div style={{ padding: 40, textAlign: "center", color: "#858d9f" }}>Clínica não encontrada.</div></main>;
  }

  // Fluxo PIX Asaas: substitui a página inteira pelo checkout
  if (done && agendamentoId && valorEfetivo) {
    return (
      <PixCheckout
        agendamentoId={agendamentoId}
        clienteNome={form.nome}
        clienteCpf={form.cpf || undefined}
        clienteEmail={form.email || undefined}
        valor={valorEfetivo}
      />
    );
  }

  const diaMensagem = diaInfo && (!diaInfo.dayConfig.aberto ? "Não atendemos nesse dia da semana." : diaInfo.feriado ? "Esse dia é feriado — sem atendimento." : slots.length === 0 || slots.every(s => s.ocupado) ? "Nenhum horário disponível." : null);

  return <main className={`bookingPage ${styles.page}`} data-appearance={appearance} style={{ ["--brand-primary" as string]: primary }}>
    <header className="bookingHeader">
      <Link href="/" className="bookingBrand" aria-label="Reserve Clinic">
        <span className={styles.brandMark}><Image src="/logo.svg" alt="" width={156} height={28} priority /></span><b>Reserve Clinic</b>
      </Link>
      <small><ShieldCheck size={18} aria-hidden="true" /> Agendamento seguro</small>
    </header>
    {comparing && <BookingComparison appearance={appearance} onChange={changeAppearance} />}
    <div className={styles.layout}>
      <BookingClinicSummary name={perfil.nome} photo={perfil.logo_url} address={endereco} price={valorEfetivo} professional={selectedProf} date={form.data} time={form.hora} duration={config.duracao_min} />
      <div className={styles.flow}>
      <BookingSteps current={done ? 2 : step} />
      {profParam && selectedProf && (
        <div className="bookingSelectedProfessional" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
          <BookingAvatar name={selectedProf.nome} photo={selectedProf.foto_url} />
          <div>
            <strong style={{ display: "block", fontSize: 15 }}>{selectedProf.nome}</strong>
            {selectedProf.especialidade && <small style={{ fontSize: 12 }}>{selectedProf.especialidade}</small>}
          </div>
        </div>
      )}
      {profParam && !loading && !selectedProf && (
        <div style={{ padding: "14px 18px", background: "#fff8f0", border: "1px solid #fde8c8", borderRadius: 14, color: "#92400e", fontSize: 13 }}>
          Profissional não disponível para agendamento.
        </div>
      )}

      {done ? (
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
          <section className="panel bookingFormPanel" aria-labelledby="booking-step-title">
            <div className={styles.sectionHeading}><span className={styles.eyebrow}>Etapa {step + 1} de 3</span><h2 id="booking-step-title" ref={stepHeading} tabIndex={-1}>{step === 0 ? "Vamos encontrar o melhor horário?" : "Agora, seus dados"}</h2><p>{step === 0 ? "Escolha com quem e quando você quer se cuidar." : "Confira seu agendamento e preencha seus dados para continuar."}</p></div>
            {step === 0 && (
              <div className="formGrid">
                {profissionais.length > 0 && !profParam && (
                  <div className="formRow bookingProfessionalPicker">
                    <label id="booking-professionals-label">Escolha seu profissional</label>
                    <div className="bookingProfessionalOptions" role="group" aria-labelledby="booking-professionals-label">
                      {profissionais.map(p => {
                        const active = form.profissional_id === p.id;
                        return (
                          <button
                            type="button"
                            className={`bookingProfessionalOption${active ? " isSelected" : ""}`}
                            aria-pressed={active}
                            aria-label={`${p.nome}${p.especialidade ? `, ${p.especialidade}` : ""}`}
                            key={p.id}
                            onClick={() => setForm({ ...form, profissional_id: p.id, profissional_nome: p.nome, data: "", hora: "" })}
                          >
                            <BookingAvatar name={p.nome} photo={p.foto_url} />
                            <span className={styles.professionalText}><strong>{p.nome}</strong>{p.especialidade && <small>{p.especialidade}</small>}</span>
                            <span className={styles.selectionMark} aria-hidden="true">{active && <Check size={14} />}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
<div className={styles.schedule}>
                <div className="formRow">
                  <label id="booking-date-label">Selecione a melhor data</label>
                  <div className="bookingCalendarWrap">
                    <div className="bookingCalHead">
                      <button type="button" className="iconButton" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} aria-label="Mês anterior"><ChevronLeft size={16} /></button>
                      <span aria-live="polite">{viewMonth.toLocaleDateString("pt-BR", { month: "long" })} <small>{viewMonth.getFullYear()}</small></span>
                      <button type="button" className="iconButton" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} aria-label="Próximo mês"><ChevronRight size={16} /></button>
                    </div>
                    <div className="bookingCalWeek">
                      {WEEKDAY_LABELS.map(l => <span key={l}>{l}</span>)}
                    </div>
                    <div className="bookingCalGrid" role="group" aria-labelledby="booking-date-label">
                      {calDias.map(d => {
                        const iso = toIsoDate(d);
                        const outroMes = d.getMonth() !== viewMonth.getMonth();
                        const ehHoje = isSameDay(d, hoje);
                        const selected = form.data === iso;
                        const isPast = d < hoje;
                        const key = jsDayToKey(d);
                        const feriado = isFeriado(config, profId, iso);
                        const fechado = !profDisp.dias[key].aberto || feriado;
                        const disabled = isPast || outroMes || fechado;
                        return (
                          <button
                            type="button"
                            key={iso + d.getMonth()}
                            disabled={disabled}
                            onClick={() => setForm({ ...form, data: iso, hora: "" })}
                            className={`bookingCalCell${selected ? " isSelected" : ""}${ehHoje ? " isToday" : ""}${outroMes ? " isOtherMonth" : ""}${fechado && !outroMes ? " isClosed" : ""}`}
                            aria-label={d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                            aria-pressed={selected}
                            aria-current={ehHoje ? "date" : undefined}
                          >
                            {d.getDate()}{selected && <Check className={styles.dateCheck} size={10} aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                  <div className={`formRow ${styles.times}`} aria-live="polite">
                    <label id="booking-times-label">Escolha o horário <small>({config.duracao_min} min)</small></label>
                    {!form.data ? <div className={styles.timeEmpty}><CalendarDays size={28} /><strong>Qual é o melhor dia para você?</strong><p>Selecione uma data para ver os horários disponíveis.</p></div> : <>
                    <p className={styles.selectedDate}>{new Date(`${form.data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
                    {diaMensagem ? (
                      <p className={styles.timeEmpty}>{diaMensagem}</p>
                    ) : (
                      <div className={styles.timeGrid} role="group" aria-labelledby="booking-times-label">
                        {slots.map(s => {
                          const active = form.hora === s.hora;
                          return <button type="button" key={s.hora} className={`bookingTimeOption${active ? " isSelected" : ""}${s.ocupado ? " isOccupied" : ""}`} aria-pressed={active} disabled={s.ocupado} onClick={() => setForm({ ...form, hora: s.hora })}>{s.hora}{active && <Check size={14} aria-hidden="true" />}</button>;
                        })}
                      </div>
                    )}
                    </>}
                  </div>
                </div>
                <div className={styles.actions}>
                  <p>{form.data && form.hora ? `${new Date(`${form.data}T12:00:00`).toLocaleDateString("pt-BR")} às ${form.hora}` : "Selecione uma data e um horário para continuar."}</p>
                  <button className="primaryButton" disabled={!form.data || !form.hora} onClick={() => setStep(1)}>Continuar <ArrowRight size={18} /></button>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="formGrid">
                <div className={styles.review}><CalendarDays size={22} /><div><strong>{new Date(`${form.data}T12:00:00`).toLocaleDateString("pt-BR")} às {form.hora}</strong><span>{form.profissional_nome}{form.servico ? ` · ${form.servico}` : ""}</span></div><button type="button" className="secondaryButton" onClick={() => setStep(0)}>Alterar</button></div>
                <div className="formRow"><label htmlFor="booking-name">Nome completo</label><input id="booking-name" autoComplete="name" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome" /></div>
                <div className="formRow split">
                  <div className="formRow"><label htmlFor="booking-phone">Telefone</label><input id="booking-phone" type="tel" autoComplete="tel" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" /></div>
                  <div className="formRow">
                    <label htmlFor="booking-email">E-mail {valorEfetivo && <span style={{ color: "#dc2626", fontWeight: 400 }}>*</span>}</label>
                    <input id="booking-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" required={!!valorEfetivo} />
                  </div>
                </div>
                {valorEfetivo && (
                  <div className="formRow" style={{ maxWidth: 240 }}>
                    <label htmlFor="booking-cpf">CPF <span style={{ color: "#dc2626", fontWeight: 400 }}>*</span> <small>(obrigatório para PIX)</small></label>
                    <input id="booking-cpf" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" inputMode="numeric" required />
                  </div>
                )}
                <div className="formRow"><label htmlFor="booking-notes">Observações (opcional)</label><textarea id="booking-notes" rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Convênio, sintomas, etc." /></div>
                {error && <div className="onboardingError" role="alert">{error}</div>}
                <div className={styles.actions}>
                  <button className="secondaryButton" onClick={() => setStep(0)}><ChevronLeft size={18} /> Voltar</button>
                  <button className="primaryButton" disabled={saving} onClick={handleConfirm} style={{ background: primary }}>{saving ? "Enviando…" : "Confirmar agendamento"}</button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
    </div>
    <footer className="bookingFooter">Agendamento protegido pela <strong>Reserve Clinic</strong> · Seus dados estão seguros</footer>
  </main>;
}

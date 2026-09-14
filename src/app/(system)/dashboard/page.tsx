"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Copy, ExternalLink, Plus, UserPlus, Users, Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, initials, STATUS_CLASS, STATUS_LABEL, type Consulta, type ConsultaStatus, type Paciente } from "@/lib/db";
import { reportarErroCliente } from "@/lib/reportarErroCliente";
import AsaasTransfersPanel from "@/components/AsaasTransfersPanel";

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

const WEEKDAY_LABEL = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function minToLabel(min: number) { return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`; }
function jsDayToKey(d: Date): DayKey { return DAY_ORDER[(d.getDay() + 6) % 7]; }
function toIsoDate(d: Date) { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }

function mergeConfig(raw: unknown): AgendaConfig {
  const r = (raw ?? {}) as Partial<AgendaConfig>;
  return {
    dias: { ...DEFAULT_CONFIG.dias, ...(r.dias ?? {}) },
    feriados: Array.isArray(r.feriados) ? r.feriados : [],
    profissionais: Array.isArray(r.profissionais) ? r.profissionais : [],
    duracao_min: typeof r.duracao_min === "number" && r.duracao_min > 0 ? r.duracao_min : 60,
  };
}

function monthGrid(view: Date) {
  const first = startOfMonth(view);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function ProgressRing({ value, size = 148, stroke = 8, label, sub }: { value: number; size?: number; stroke?: number; label: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  const dash = c * pct;
  return (
    <div className="dashRing" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: "drop-shadow(0 0 8px rgba(59,130,246,0.55))", transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="dashRingCenter">
        <strong>{Math.round(pct * 100)}%</strong>
        <span>{label}</span>
        {sub ? <em>{sub}</em> : null}
      </div>
    </div>
  );
}

function StatusRing({ segments, total, size = 148, stroke = 10 }: { segments: { color: string; value: number }[]; total: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const arcs = segments.map((s) => {
    const frac = total > 0 ? s.value / total : 0;
    const len = c * frac;
    const arc = { color: s.color, dash: `${len} ${c - len}`, offset: -acc };
    acc += len;
    return arc;
  });
  return (
    <svg width={size} height={size} className="dashStatusRing">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      {total > 0 && arcs.map((a, i) => (
        <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={a.color} strokeWidth={stroke} strokeLinecap="butt" strokeDasharray={a.dash} strokeDashoffset={a.offset} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      ))}
    </svg>
  );
}

function AreaChart({ data }: { data: { day: number; value: number }[] }) {
  const W = 800, H = 200, padL = 44, padR = 20, padT = 18, padB = 28;
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const rawMax = Math.max(...data.map(d => d.value), 0);
  const max = rawMax > 0 ? rawMax : 1;
  const step = data.length > 1 ? iw / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({ x: padL + i * step, y: padT + ih - (d.value / max) * ih, day: d.day, value: d.value }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = pts.length ? `${linePath} L${pts[pts.length - 1].x.toFixed(1)},${(padT + ih).toFixed(1)} L${pts[0].x.toFixed(1)},${(padT + ih).toFixed(1)} Z` : "";
  const ticks = 4;
  const labelEvery = Math.max(1, Math.floor(data.length / 7));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dashChartSvg" preserveAspectRatio="none" role="img" aria-label="Faturamento diário">
      <defs>
        <linearGradient id="dashChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const y = padT + (ih / ticks) * i;
        return <line key={i} x1={padL} x2={W - padR} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
      })}
      {rawMax > 0 && <path d={areaPath} fill="url(#dashChartFill)" />}
      {rawMax > 0 && <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
      {pts.filter((_, i) => i % labelEvery === 0 || i === pts.length - 1).map(p => (
        <text key={p.day} x={p.x} y={H - 10} fontSize="10" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontFamily="var(--font-space)">{p.day}</text>
      ))}
    </svg>
  );
}

export default function DashboardPage() {
  const [perfilNome, setPerfilNome] = useState("");
  const [perfilSlug, setPerfilSlug] = useState<string | null>(null);
  const [perfilTipo, setPerfilTipo] = useState<"autonomo" | "clinica">("clinica");
  const [config, setConfig] = useState<AgendaConfig>(DEFAULT_CONFIG);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [tab, setTab] = useState<"calendario" | "pacientes">("calendario");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;
      const [{ data: p, error: pErr }, { data: conf }, { data: ps }] = await Promise.all([
        supabase.from("perfis").select("nome, slug, tipo").eq("id", session.user.id).maybeSingle(),
        supabase.from("configuracoes").select("agenda_config").eq("perfil_id", session.user.id).maybeSingle(),
        supabase.from("pacientes").select("*"),
      ]);
      if (p) {
        const pp = p as { nome: string; slug: string; tipo: string };
        setPerfilNome(pp.nome ?? "");
        setPerfilSlug(pp.slug ?? null);
        setPerfilTipo(pp.tipo === "autonomo" ? "autonomo" : "clinica");
      } else if (pErr) {
        // coluna `tipo` pode não existir ainda — busca sem ela para não perder slug e nome
        const { data: pFallback } = await supabase.from("perfis").select("nome, slug").eq("id", session.user.id).maybeSingle();
        if (pFallback) {
          const pf = pFallback as { nome: string; slug: string };
          setPerfilNome(pf.nome ?? "");
          setPerfilSlug(pf.slug ?? null);
        }
      }
      setConfig(mergeConfig(conf?.agenda_config));
      setPacientes((ps as Paciente[] | null) ?? []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        void reportarErroCliente("dashboard.init", msg);
      }
    })();
  }, []);

  const fetchConsultas = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("consultas").select("*").order("data_hora");
      if (error) throw new Error(error.message);
      setConsultas((data as Consulta[] | null) ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      void reportarErroCliente("dashboard.consultas", msg);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchConsultas(); }, [fetchConsultas]);

  useEffect(() => {
    function onFocus() { fetchConsultas(); }
    function onVisibility() { if (document.visibilityState === "visible") fetchConsultas(); }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchConsultas]);

  const linkPublico = useMemo(() => {
    if (!perfilSlug) return "";
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/agendamento/${perfilSlug}`;
  }, [perfilSlug]);

  const faturamentoMes = useMemo(() => {
    const from = startOfMonth(viewMonth).getTime();
    const to = endOfMonth(viewMonth).getTime();
    return consultas
      .filter(c => {
        if (c.status !== "concluida" && c.status !== "confirmada") return false;
        const t = new Date(c.data_hora).getTime();
        return t >= from && t <= to;
      })
      .reduce((s, c) => s + (Number(c.valor) || 0), 0);
  }, [consultas, viewMonth]);

  const consultasPorDia = useMemo(() => {
    const map = new Map<string, Consulta[]>();
    for (const c of consultas) {
      const key = toIsoDate(new Date(c.data_hora));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [consultas]);

  const slotsDoDia = useMemo(() => {
    const key = jsDayToKey(selectedDay);
    const dc = config.dias[key];
    const feriado = config.feriados.includes(toIsoDate(selectedDay));
    const doDia = consultasPorDia.get(toIsoDate(selectedDay)) ?? [];
    if (!dc.aberto) return { fechado: true as const, motivo: "Não atende neste dia da semana.", ocupadas: doDia };
    if (feriado) return { fechado: true as const, motivo: "Feriado — sem atendimento.", ocupadas: doDia };
    const inicioMin = timeToMin(dc.inicio);
    const fimMin = timeToMin(dc.fim);
    const dur = config.duracao_min;
    const arr: { hora: string; horaMin: number; consulta?: Consulta }[] = [];
    for (let m = inicioMin; m + dur <= fimMin; m += dur) {
      const consulta = doDia.find(c => {
        const dt = new Date(c.data_hora);
        const cMin = dt.getHours() * 60 + dt.getMinutes();
        return cMin === m;
      });
      arr.push({ hora: minToLabel(m), horaMin: m, consulta });
    }
    return { fechado: false as const, slots: arr };
  }, [selectedDay, config, consultasPorDia]);

  const dias = useMemo(() => monthGrid(viewMonth), [viewMonth]);
  const hoje = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const ocupacaoAgenda = useMemo(() => {
    let slots = 0;
    const h = new Date(); h.setHours(0, 0, 0, 0);
    const inicio = new Date(h); inicio.setDate(h.getDate() - ((h.getDay() + 6) % 7));
    for (let i = 0; i < 7; i++) {
      const d = addDays(inicio, i);
      const k = jsDayToKey(d);
      const dc = config.dias[k];
      if (!dc.aberto || config.feriados.includes(toIsoDate(d))) continue;
      slots += Math.max(0, Math.floor((timeToMin(dc.fim) - timeToMin(dc.inicio)) / config.duracao_min));
    }
    const ocup = consultas.filter(c => { const dt = new Date(c.data_hora); return dt >= inicio && dt < addDays(inicio, 7); }).length;
    return { pct: slots > 0 ? ocup / slots : 0, ocup, slots };
  }, [config, consultas]);

  const statusCounts = useMemo(() => {
    const m: Record<ConsultaStatus, number> = { aguardando: 0, confirmada: 0, concluida: 0, cancelada: 0 };
    for (const c of consultas) m[c.status]++;
    return m;
  }, [consultas]);
  const statusTotal = statusCounts.aguardando + statusCounts.confirmada + statusCounts.concluida + statusCounts.cancelada;

  const semanaOcup = useMemo(() => {
    const h = new Date(); h.setHours(0, 0, 0, 0);
    const inicio = new Date(h); inicio.setDate(h.getDate() - ((h.getDay() + 6) % 7));
    const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return labels.map((label, i) => {
      const d = addDays(inicio, i);
      const k = jsDayToKey(d);
      const dc = config.dias[k];
      const feriado = config.feriados.includes(toIsoDate(d));
      if (!dc.aberto || feriado) return { label, pct: 0, ocupados: 0, slots: 0, closed: true, isToday: isSameDay(d, h) };
      const total = timeToMin(dc.fim) - timeToMin(dc.inicio);
      const slots = Math.max(1, Math.floor(total / config.duracao_min));
      const ocupados = consultas.filter(c => isSameDay(new Date(c.data_hora), d)).length;
      return { label, pct: Math.min(1, ocupados / slots), ocupados, slots, closed: false, isToday: isSameDay(d, h) };
    });
  }, [config, consultas]);

  const upcomings = useMemo(() => {
    const now = new Date();
    return consultas
      .filter(c => new Date(c.data_hora) >= now && c.status !== "cancelada")
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
      .slice(0, 5);
  }, [consultas]);

  const chartData = useMemo(() => {
    const total = endOfMonth(viewMonth).getDate();
    const arr: { day: number; value: number }[] = [];
    for (let d = 1; d <= total; d++) {
      const iso = toIsoDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
      const doDia = consultasPorDia.get(iso) ?? [];
      const value = doDia
        .filter(c => c.status === "concluida" || c.status === "confirmada")
        .reduce((s, c) => s + (Number(c.valor) || 0), 0);
      arr.push({ day: d, value });
    }
    return arr;
  }, [consultasPorDia, viewMonth]);
  const chartEmpty = chartData.every(d => d.value === 0);

  async function handleCopy() {
    if (!linkPublico) return;
    await navigator.clipboard.writeText(linkPublico);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const primeiroNome = perfilNome.split(" ")[0] || "profissional";
  const greeting = perfilTipo === "autonomo"
    ? `Olá, ${primeiroNome}`
    : `Olá, equipe ${perfilNome}`;

  return <>
    <section className="dashHero">
      <div>
        <h1>{greeting}</h1>
        <p>{perfilTipo === "autonomo" ? "Gerencie sua agenda e acompanhe seus pacientes." : "Gerencie os horários e acompanhe os pacientes da equipe."}</p>
      </div>
      {perfilSlug && (
        <div className="dashLinkCard">
          <div className="dashLinkLabel">Seu link de agendamento</div>
          <div className="dashLinkRow">
            <code>{linkPublico}</code>
            <button className="secondaryButton" onClick={handleCopy}>{copied ? <><Check size={15} /> Copiado</> : <><Copy size={15} /> Copiar</>}</button>
            <a className="iconButton" href={linkPublico} target="_blank" rel="noreferrer" aria-label="Abrir link"><ExternalLink size={15} /></a>
          </div>
        </div>
      )}
    </section>

    <div className="dashOverviewGrid">
      <section className="dashChartCard">
        <header>
          <div>
            <strong>Faturamento em {viewMonth.toLocaleDateString("pt-BR", { month: "long" })}</strong>
            <small>Evolução diária das consultas confirmadas e concluídas</small>
          </div>
          <div className="dashChartTotal">
            <span>Total do mês</span>
            <strong>{formatCurrency(faturamentoMes)}</strong>
            <AsaasTransfersPanel compact />
          </div>
        </header>
        <div className="dashChartBody">
          <AreaChart data={chartData} />
          {chartEmpty && <div className="dashChartEmpty">Sem faturamento registrado neste mês ainda. Os valores aparecerão aqui à medida que as consultas forem confirmadas.</div>}
        </div>
      </section>

      <section className="dashRingCard">
        <header>
          <div>
            <strong>Ocupação da semana</strong>
            <small>Slots preenchidos nos próximos 7 dias</small>
          </div>
        </header>
        <ProgressRing value={ocupacaoAgenda.pct} label="ocupado" sub={`${ocupacaoAgenda.ocup}/${ocupacaoAgenda.slots}`} />
      </section>
    </div>

    <div className="dashSecondaryGrid">
      <section className="dashRingCard">
        <header>
          <div>
            <strong>Status dos agendamentos</strong>
            <small>Distribuição de todas as consultas registradas</small>
          </div>
        </header>
        <div className="dashStatusBody">
          <div className="dashStatusRingWrap">
            <StatusRing
              total={statusTotal}
              segments={[
                { color: "#3b82f6", value: statusCounts.confirmada },
                { color: "rgba(59,130,246,0.6)", value: statusCounts.aguardando },
                { color: "rgba(59,130,246,0.32)", value: statusCounts.concluida },
                { color: "rgba(255,255,255,0.14)", value: statusCounts.cancelada },
              ]}
            />
            <div className="dashStatusRingCenter">
              <strong>{statusTotal}</strong>
              <span>total</span>
            </div>
          </div>
          <ul className="dashStatusLegend">
            <li><i style={{ background: "#3b82f6" }} /> Confirmadas <b>{statusCounts.confirmada}</b></li>
            <li><i style={{ background: "rgba(59,130,246,0.6)" }} /> Aguardando <b>{statusCounts.aguardando}</b></li>
            <li><i style={{ background: "rgba(59,130,246,0.32)" }} /> Concluídas <b>{statusCounts.concluida}</b></li>
            <li><i style={{ background: "rgba(255,255,255,0.14)" }} /> Canceladas <b>{statusCounts.cancelada}</b></li>
          </ul>
        </div>
      </section>

      <section className="dashRingCard">
        <header>
          <div>
            <strong>Ocupação por dia</strong>
            <small>Esta semana</small>
          </div>
        </header>
        <ul className="dashWeekBars">
          {semanaOcup.map((d) => (
            <li key={d.label} className={`${d.isToday ? "isToday" : ""} ${d.closed ? "isClosed" : ""}`}>
              <span className="dashWeekLabel">{d.label}</span>
              <div className="dashWeekTrack">
                <div className="dashWeekFill" style={{ width: `${Math.round(d.pct * 100)}%` }} />
              </div>
              <span className="dashWeekPct">{d.closed ? "—" : `${Math.round(d.pct * 100)}%`}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>

    <div className="dashSectionLabel dashSectionLabelSpaced"><span /> Agenda de hoje</div>
    <div className="dashTabs">
      <button className={tab === "calendario" ? "active" : ""} onClick={() => setTab("calendario")}><CalendarDays size={15} /> Calendário</button>
      <button className={tab === "pacientes" ? "active" : ""} onClick={() => setTab("pacientes")}><Users size={15} /> Pacientes</button>
    </div>

    {tab === "calendario" ? (
      <div className="dashCalendarGrid">
        <section className="panel dashMonth">
          <div className="dashMonthHead">
            <div>
              <strong>{viewMonth.toLocaleDateString("pt-BR", { month: "long" })}</strong>
              <small>{viewMonth.getFullYear()}</small>
            </div>
            <div className="dashMonthNav">
              <button className="iconButton" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))} aria-label="Mês anterior"><ChevronLeft size={16} /></button>
              <button className="todayButton" onClick={() => { const h = new Date(); setViewMonth(startOfMonth(h)); setSelectedDay(new Date(h.getFullYear(), h.getMonth(), h.getDate())); }}>Hoje</button>
              <button className="iconButton" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))} aria-label="Próximo mês"><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="dashMonthWeek">{WEEKDAY_LABEL.map(l => <span key={l}>{l}</span>)}</div>
          <div className="dashMonthGrid">
            {dias.map((d) => {
              const outroMes = d.getMonth() !== viewMonth.getMonth();
              const ehHoje = isSameDay(d, hoje);
              const selected = isSameDay(d, selectedDay);
              const key = jsDayToKey(d);
              const feriado = config.feriados.includes(toIsoDate(d));
              const fechado = !config.dias[key].aberto || feriado;
              const qtd = (consultasPorDia.get(toIsoDate(d)) ?? []).length;
              const fimSemana = d.getDay() === 0 || d.getDay() === 6;
              return (
                <button key={d.toISOString()} onClick={() => setSelectedDay(new Date(d))} className={`dashMonthCell ${selected ? "isSelected" : ""} ${outroMes ? "isOtherMonth" : ""} ${ehHoje ? "isToday" : ""} ${fechado ? "isClosed" : ""} ${fimSemana ? "isWeekend" : ""}`}>
                  <span className="dashMonthNum">{d.getDate()}</span>
                  {qtd > 0 && <span className="dashMonthCount">{qtd}</span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel dashDay">
          <header>
            <div>
              <strong>Dia {selectedDay.getDate()} de {selectedDay.toLocaleDateString("pt-BR", { month: "long" })}</strong>
              <small>{selectedDay.toLocaleDateString("pt-BR", { weekday: "long" })}</small>
            </div>
            <Link href="/consultas" className="secondaryButton"><Plus size={14} /> Nova</Link>
          </header>
          {slotsDoDia.fechado ? (
            <div className="dashDayEmpty">
              <p>{slotsDoDia.motivo}</p>
              {slotsDoDia.ocupadas.length > 0 && (
                <>
                  <small>Há {slotsDoDia.ocupadas.length} consulta(s) marcada(s) neste dia:</small>
                  <ul className="dashSlotList">
                    {slotsDoDia.ocupadas.map(c => (
                      <li key={c.id} className="dashSlot isBooked">
                        <strong>{new Date(c.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong>
                        <span>{c.paciente_nome}{c.servico ? ` · ${c.servico}` : ""}</span>
                        <em className={`statusBadge ${STATUS_CLASS[c.status]}`}>{STATUS_LABEL[c.status]}</em>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="dashDayCount">{slotsDoDia.slots.filter(s => !s.consulta).length} horários livres · {slotsDoDia.slots.filter(s => s.consulta).length} ocupados</div>
              <ul className="dashSlotList">
                {slotsDoDia.slots.length === 0 ? (
                  <li className="dashSlotEmpty">Sem horários dentro do intervalo configurado.</li>
                ) : slotsDoDia.slots.map(s => (
                  <li key={s.hora} className={`dashSlot ${s.consulta ? "isBooked" : "isFree"}`}>
                    <strong>{s.hora}</strong>
                    {s.consulta ? (
                      <>
                        <span>{s.consulta.paciente_nome}{s.consulta.servico ? ` · ${s.consulta.servico}` : ""}</span>
                        <em className={`statusBadge ${STATUS_CLASS[s.consulta.status]}`}>{STATUS_LABEL[s.consulta.status]}</em>
                      </>
                    ) : (
                      <>
                        <span>Livre</span>
                        <Link href="/consultas" className="dashSlotAction">Marcar</Link>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
          {loading && <p className="dashLoading">Atualizando…</p>}
        </section>
      </div>
    ) : (
      <section className="panel dashPacientes">
        <header>
          <div><strong>Pacientes</strong><small>{pacientes.length} cadastrados</small></div>
          <Link href="/pacientes" className="secondaryButton"><UserPlus size={14} /> Gerenciar</Link>
        </header>
        {pacientes.length === 0 ? (
          <p className="dashDayEmpty" style={{ padding: 24 }}>Nenhum paciente cadastrado ainda.</p>
        ) : (
          <ul className="dashPacientesList">
            {pacientes.slice(0, 8).map(p => (
              <li key={p.id}>
                <div className="tableAvatar">{initials(p.nome)}</div>
                <div><strong>{p.nome}</strong><small>{p.telefone ?? p.email ?? "—"}</small></div>
                <em className={`statusBadge ${p.status === "ativo" ? "statusAtivo" : "statusConcluida"}`}>{p.status === "ativo" ? "Ativo" : "Inativo"}</em>
              </li>
            ))}
          </ul>
        )}
      </section>
    )}

    <div className="dashSectionLabel dashSectionLabelSpaced"><span /> Próximos atendimentos</div>
    <section className="dashUpcomingCard">
      {upcomings.length === 0 ? (
        <div className="dashUpcomingEmpty">Nenhum atendimento futuro nos próximos dias. Novas consultas aparecerão aqui automaticamente.</div>
      ) : (
        <table className="dashUpcomingTable">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Data</th>
              <th>Horário</th>
              <th>Serviço</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {upcomings.map((c) => {
              const dt = new Date(c.data_hora);
              return (
                <tr key={c.id}>
                  <td>
                    <div className="dashUpcomingPatient">
                      <div className="dashUpcomingAvatar">{initials(c.paciente_nome)}</div>
                      <div>
                        <strong>{c.paciente_nome}</strong>
                        {c.paciente_telefone ? <small>{c.paciente_telefone}</small> : null}
                      </div>
                    </div>
                  </td>
                  <td>{dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</td>
                  <td className="dashUpcomingTime">{dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td>{c.servico ?? "—"}</td>
                  <td><em className={`statusBadge ${STATUS_CLASS[c.status]}`}>{STATUS_LABEL[c.status]}</em></td>
                  <td className="dashUpcomingAction">
                    <Link href="/consultas" aria-label="Abrir consulta"><ArrowUpRight size={14} /></Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  </>;
}

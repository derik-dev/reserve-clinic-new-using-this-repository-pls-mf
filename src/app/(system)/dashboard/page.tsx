"use client";

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, Copy, ExternalLink, Plus, UserPlus, Users, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, initials, STATUS_CLASS, STATUS_LABEL, type Consulta, type Paciente } from "@/lib/db";
import { reportarErroCliente } from "@/lib/reportarErroCliente";

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

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const from = startOfMonth(viewMonth);
        const to = endOfMonth(viewMonth);
        const { data, error } = await supabase.from("consultas").select("*").gte("data_hora", from.toISOString()).lte("data_hora", to.toISOString()).order("data_hora");
        if (error) throw new Error(error.message);
        setConsultas((data as Consulta[] | null) ?? []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        void reportarErroCliente("dashboard.consultas", msg);
      }
      setLoading(false);
    })();
  }, [viewMonth]);

  const linkPublico = useMemo(() => {
    if (!perfilSlug) return "";
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/agendamento/${perfilSlug}`;
  }, [perfilSlug]);

  const metrics = useMemo(() => {
    const totalMes = consultas.length;
    const faturamentoMes = consultas.filter(c => c.status === "concluida" || c.status === "confirmada").reduce((s, c) => s + (Number(c.valor) || 0), 0);
    let slotsSemana = 0;
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const inicioSemana = new Date(hoje); inicioSemana.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7));
    for (let i = 0; i < 7; i++) {
      const d = addDays(inicioSemana, i);
      const k = jsDayToKey(d);
      const dc = config.dias[k];
      if (!dc.aberto || config.feriados.includes(toIsoDate(d))) continue;
      const total = timeToMin(dc.fim) - timeToMin(dc.inicio);
      slotsSemana += Math.max(0, Math.floor(total / config.duracao_min));
    }
    const ocupadosSemana = consultas.filter(c => { const dt = new Date(c.data_hora); return dt >= inicioSemana && dt < addDays(inicioSemana, 7); }).length;
    return { totalMes, faturamentoMes, livresSemana: Math.max(0, slotsSemana - ocupadosSemana) };
  }, [consultas, config]);

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

    <section className="dashMetrics">
      <article className="dashMetric">
        <div className="dashMetricIcon mint"><CircleDollarSign size={20} /></div>
        <div><span>Faturamento do mês</span><strong>{formatCurrency(metrics.faturamentoMes)}</strong></div>
      </article>
      <article className="dashMetric">
        <div className="dashMetricIcon blue"><CalendarDays size={20} /></div>
        <div><span>Agendamentos no mês</span><strong>{metrics.totalMes}</strong></div>
      </article>
      <article className="dashMetric">
        <div className="dashMetricIcon amber"><Clock3 size={20} /></div>
        <div><span>Horários livres na semana</span><strong>{metrics.livresSemana}</strong></div>
      </article>
    </section>

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
  </>;
}

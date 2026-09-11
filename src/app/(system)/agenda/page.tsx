"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Clock, MoreHorizontal, PieChart, Plus, Settings, TrendingDown, TrendingUp, Users, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { initials, STATUS_CLASS, STATUS_LABEL, type Consulta, type ConsultaStatus } from "@/lib/db";

type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
type DayConfig = { aberto: boolean; inicio: string; fim: string };
type ProfissionalJson = { id: string; nome: string; dias: DayKey[] };
type ProfissionalSql = { id: string; nome: string; especialidade: string | null };
type ProfDisponibilidade = { dias: Record<DayKey, DayConfig>; feriados: string[] };
type AgendaConfig = {
  dias: Record<DayKey, DayConfig>;
  feriados: string[];
  profissionais: ProfissionalJson[];
  duracao_min: number;
  disponibilidade: Record<string, ProfDisponibilidade>;
};

const DAY_ORDER: DayKey[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
const DAY_LABEL: Record<DayKey, string> = { seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom" };
const DAY_LABEL_FULL: Record<DayKey, string> = { seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo" };

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

const STATUS_TO_COLOR: Record<ConsultaStatus, string> = {
  confirmada: "blue",
  aguardando: "amber",
  concluida: "mint",
  cancelada: "gray",
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function toIsoDate(d: Date) { return d.toISOString().slice(0, 10); }
function jsDayToKey(d: Date): DayKey { return DAY_ORDER[(d.getDay() + 6) % 7]; }
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function minToLabel(min: number) { return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`; }
function mergeConfig(raw: unknown): AgendaConfig {
  const r = (raw ?? {}) as Partial<AgendaConfig>;
  return {
    dias: { ...DEFAULT_CONFIG.dias, ...(r.dias ?? {}) },
    feriados: Array.isArray(r.feriados) ? r.feriados : [],
    profissionais: Array.isArray(r.profissionais) ? r.profissionais : [],
    duracao_min: typeof r.duracao_min === "number" && r.duracao_min > 0 ? r.duracao_min : DEFAULT_CONFIG.duracao_min,
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

type ViewMode = "semana" | "dia" | "lista";

export default function AgendaPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [prevWeekConsultas, setPrevWeekConsultas] = useState<Consulta[] | null>(null);
  const [config, setConfig] = useState<AgendaConfig>(DEFAULT_CONFIG);
  const [sqlProfissionais, setSqlProfissionais] = useState<ProfissionalSql[]>([]);
  const [profFiltro, setProfFiltro] = useState<string>("todos");
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("semana");
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [calMonth, setCalMonth] = useState<Date>(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const today = useMemo(() => new Date(), []);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const didInitialScrollRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;
      const [cfgRes, prRes] = await Promise.all([
        supabase.from("configuracoes").select("agenda_config").eq("perfil_id", session.user.id).maybeSingle(),
        supabase.from("profissionais").select("id, nome, especialidade").eq("ativo", true).order("nome"),
      ]);
      setConfig(mergeConfig(cfgRes.data?.agenda_config));
      setSqlProfissionais((prRes.data as ProfissionalSql[] | null) ?? []);
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPrevWeekConsultas(null);
    const from = new Date(weekStart);
    const to = addDays(weekStart, 7);
    const prevFrom = addDays(weekStart, -7);
    const withTimeout = (p: PromiseLike<{ data: unknown }>, ms: number): Promise<{ data: unknown }> =>
      Promise.race([Promise.resolve(p), new Promise<{ data: unknown }>((r) => setTimeout(() => r({ data: null }), ms))]);
    withTimeout(
      supabase.from("consultas").select("*").gte("data_hora", from.toISOString()).lt("data_hora", to.toISOString()).order("data_hora"),
      6000,
    ).then((res) => {
      if (cancelled) return;
      setConsultas((res.data as Consulta[] | null) ?? []);
      setLoading(false);
    });
    withTimeout(
      supabase.from("consultas").select("*").gte("data_hora", prevFrom.toISOString()).lt("data_hora", from.toISOString()),
      6000,
    ).then((res) => {
      if (cancelled) return;
      setPrevWeekConsultas((res.data as Consulta[] | null) ?? []);
    });
    return () => { cancelled = true; };
  }, [weekStart]);

  const profAtivo = profFiltro !== "todos" && profFiltro !== "sem" ? profFiltro : null;
  const profDisp = useMemo(() => getProfDisp(config, profAtivo), [config, profAtivo]);

  const diasVisiveis = useMemo(() => {
    const semana = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map(d => ({ date: d, key: jsDayToKey(d) }));
    const diasComConsulta = new Set(consultas.map(c => toIsoDate(new Date(c.data_hora))));
    return semana.map(d => ({
      ...d,
      aberto: profDisp.dias[d.key].aberto,
      feriado: isFeriado(config, profAtivo, toIsoDate(d.date)),
    })).filter(d => d.aberto || diasComConsulta.has(toIsoDate(d.date)));
  }, [weekStart, config, consultas, profDisp, profAtivo]);
  const diasAbertos = useMemo(() => diasVisiveis.filter(d => d.aberto && !d.feriado), [diasVisiveis]);

  const [minAbertura, maxFechamento] = useMemo(() => {
    if (diasAbertos.length === 0) return [8 * 60, 18 * 60];
    const inicios = diasAbertos.map(d => timeToMin(profDisp.dias[d.key].inicio));
    const fins = diasAbertos.map(d => timeToMin(profDisp.dias[d.key].fim));
    return [Math.min(...inicios), Math.max(...fins)];
  }, [diasAbertos, profDisp]);

  const linhasHora = useMemo(() => {
    const arr: number[] = [];
    for (let m = Math.floor(minAbertura / 60) * 60; m < maxFechamento; m += 60) arr.push(m);
    return arr;
  }, [minAbertura, maxFechamento]);

  const consultasFiltradas = useMemo(() => {
    if (profFiltro === "todos") return consultas;
    if (profFiltro === "sem") return consultas.filter(c => !c.profissional_id);
    return consultas.filter(c => c.profissional_id === profFiltro);
  }, [consultas, profFiltro]);

  const rotuloSemana = useMemo(() => {
    const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
    return `${fmt(weekStart)} — ${fmt(addDays(weekStart, 6))}`;
  }, [weekStart]);

  const weekCapacityMin = useMemo(() => {
    const semana = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return semana.reduce((acc, d) => {
      const key = jsDayToKey(d);
      const cfg = profDisp.dias[key];
      if (!cfg.aberto || isFeriado(config, profAtivo, toIsoDate(d))) return acc;
      return acc + Math.max(0, timeToMin(cfg.fim) - timeToMin(cfg.inicio));
    }, 0);
  }, [weekStart, config, profDisp, profAtivo]);
  const weekUsedMin = useMemo(() => consultas.reduce((acc, c) => acc + c.duracao_min, 0), [consultas]);
  const ocupacaoPct = weekCapacityMin > 0 ? Math.round((weekUsedMin / weekCapacityMin) * 100) : 0;
  const slotsLivres = weekCapacityMin > 0 && config.duracao_min > 0 ? Math.max(0, Math.floor((weekCapacityMin - weekUsedMin) / config.duracao_min)) : 0;

  const prevWeekReady = prevWeekConsultas !== null;
  const consultasDelta = useMemo(() => {
    if (!prevWeekReady) return null;
    const prev = prevWeekConsultas!.length;
    if (prev === 0) return null;
    return Math.round(((consultas.length - prev) / prev) * 100);
  }, [prevWeekReady, prevWeekConsultas, consultas.length]);
  const ocupacaoDelta = useMemo(() => {
    if (!prevWeekReady || weekCapacityMin === 0) return null;
    const prevUsed = prevWeekConsultas!.reduce((a, c) => a + c.duracao_min, 0);
    const prevPct = weekCapacityMin > 0 ? Math.round((prevUsed / weekCapacityMin) * 100) : 0;
    if (prevPct === 0) return null;
    return ocupacaoPct - prevPct;
  }, [prevWeekReady, prevWeekConsultas, weekCapacityMin, ocupacaoPct]);
  const livresDelta = useMemo(() => {
    if (!prevWeekReady || weekCapacityMin === 0 || config.duracao_min <= 0) return null;
    const prevUsed = prevWeekConsultas!.reduce((a, c) => a + c.duracao_min, 0);
    const prevLivres = Math.max(0, Math.floor((weekCapacityMin - prevUsed) / config.duracao_min));
    if (prevLivres === 0) return null;
    return Math.round(((slotsLivres - prevLivres) / prevLivres) * 100);
  }, [prevWeekReady, prevWeekConsultas, weekCapacityMin, config.duracao_min, slotsLivres]);

  const consultasDoDia = useMemo(() => consultas
    .filter(c => isSameDay(new Date(c.data_hora), selectedDay))
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()), [consultas, selectedDay]);
  const diaKey = jsDayToKey(selectedDay);
  const diaCfg = profDisp.dias[diaKey];
  const diaCapacidadeMin = diaCfg.aberto && !isFeriado(config, profAtivo, toIsoDate(selectedDay))
    ? Math.max(0, timeToMin(diaCfg.fim) - timeToMin(diaCfg.inicio)) : 0;
  const diaUsadoMin = consultasDoDia.reduce((a, c) => a + c.duracao_min, 0);
  const diaOcupacaoPct = diaCapacidadeMin > 0 ? Math.round((diaUsadoMin / diaCapacidadeMin) * 100) : 0;
  const diaLivres = diaCapacidadeMin > 0 && config.duracao_min > 0 ? Math.max(0, Math.floor((diaCapacidadeMin - diaUsadoMin) / config.duracao_min)) : 0;
  const diaCancelamentos = consultasDoDia.filter(c => c.status === "cancelada").length;

  const calCells = useMemo(() => {
    const first = new Date(calMonth);
    const startPad = (first.getDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setDate(1 - startPad);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [calMonth]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const isSameWeek = (d: Date) => d >= weekStart && d <= new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate(), 23, 59, 59);

  const HOUR_PX = 62;
  const diasParaGrid = viewMode === "dia"
    ? diasVisiveis.filter(d => isSameDay(d.date, selectedDay))
    : diasVisiveis;
  const gridColumns = `88px repeat(${Math.max(1, diasParaGrid.length)}, minmax(120px, 1fr))`;
  const baseMinGlobal = Math.floor(minAbertura / 60) * 60;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowInRange = nowMinutes >= baseMinGlobal && nowMinutes <= baseMinGlobal + linhasHora.length * 60;
  const nowTop = nowInRange ? ((nowMinutes - baseMinGlobal) / 60) * HOUR_PX : 0;

  useEffect(() => {
    if (didInitialScrollRef.current) return;
    if (!scrollRef.current || linhasHora.length === 0) return;
    if (!diasVisiveis.some(d => isSameDay(d.date, now))) { didInitialScrollRef.current = true; return; }
    const el = scrollRef.current;
    const target = Math.max(0, ((nowMinutes - baseMinGlobal) / 60) * HOUR_PX - el.clientHeight / 2 + 60);
    el.scrollTop = target;
    didInitialScrollRef.current = true;
  }, [linhasHora.length, diasVisiveis, now, nowMinutes, baseMinGlobal]);

  function handleSlotClick(e: MouseEvent<HTMLDivElement>, date: Date, aberto: boolean) {
    if (!aberto) return;
    if ((e.target as HTMLElement).closest(".agendaEvent")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const step = Math.max(5, config.duracao_min);
    const rawMin = baseMinGlobal + (y / HOUR_PX) * 60;
    const snappedMin = Math.max(baseMinGlobal, Math.round(rawMin / step) * step);
    const hh = String(Math.floor(snappedMin / 60)).padStart(2, "0");
    const mm = String(snappedMin % 60).padStart(2, "0");
    const iso = toIsoDate(date);
    router.push(`/consultas?nova=1&data=${iso}&hora=${hh}:${mm}`);
  }

  function layoutOverlaps(eventos: Consulta[]) {
    const items = eventos.map((c) => {
      const dt = new Date(c.data_hora);
      const start = dt.getHours() * 60 + dt.getMinutes();
      return { c, start, end: start + c.duracao_min };
    }).sort((a, b) => a.start - b.start || a.end - b.end);
    const columns: { end: number }[] = [];
    const placements = new Map<string, { col: number }>();
    const groups: { members: string[] }[] = [];
    let currentGroup: string[] = [];
    let currentEnd = -1;
    for (const it of items) {
      let colIdx = columns.findIndex(col => col.end <= it.start);
      if (colIdx === -1) { columns.push({ end: it.end }); colIdx = columns.length - 1; }
      else columns[colIdx].end = it.end;
      placements.set(it.c.id, { col: colIdx });
      if (it.start >= currentEnd) {
        if (currentGroup.length) groups.push({ members: currentGroup });
        currentGroup = [it.c.id];
        currentEnd = it.end;
      } else {
        currentGroup.push(it.c.id);
        currentEnd = Math.max(currentEnd, it.end);
      }
    }
    if (currentGroup.length) groups.push({ members: currentGroup });
    const groupCols = new Map<string, number>();
    for (const g of groups) {
      const maxCol = Math.max(...g.members.map(id => placements.get(id)!.col)) + 1;
      for (const id of g.members) groupCols.set(id, maxCol);
    }
    return items.map(({ c, start, end }) => ({
      c, start, end,
      col: placements.get(c.id)!.col,
      cols: groupCols.get(c.id) ?? 1,
    }));
  }

  return <>
    <PageHeader title="Agenda" description="Visualize e organize sua semana com clareza." actions={<>
      {sqlProfissionais.length > 0 && (
        <div className="agendaFilter">
          <label>Profissional</label>
          <select value={profFiltro} onChange={(e) => setProfFiltro(e.target.value)}>
            <option value="todos">Todos</option>
            {sqlProfissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            <option value="sem">Sem profissional</option>
          </select>
        </div>
      )}
      <button className="secondaryButton" onClick={() => setConfigOpen(true)}><Settings size={16} /> Ajustes</button>
      <button className="primaryButton" onClick={() => router.push("/consultas?nova=1")}><Plus size={17} /> Nova consulta</button>
    </>} />

    <section className="agendaStats">
      <StatCard icon={<CalendarDays size={18} />} label="Consultas da semana" value={String(consultas.length)} delta={consultasDelta} deltaLabel="vs. semana anterior" />
      <StatCard icon={<Users size={18} />} label="Profissionais cadastrados" value={String(sqlProfissionais.length)} />
      <StatCard icon={<PieChart size={18} />} label="Taxa de ocupação" value={weekCapacityMin > 0 ? `${ocupacaoPct}%` : "—"} delta={ocupacaoDelta} deltaSuffix="pp" deltaLabel="vs. semana anterior" />
      <StatCard icon={<Clock size={18} />} label="Horários livres" value={weekCapacityMin > 0 ? String(slotsLivres) : "—"} delta={livresDelta} deltaLabel="vs. semana anterior" />
    </section>

    <div className="agendaLayout">
      <div className="agendaMainCol">
        <div className="agendaToolbar">
          <button className="iconButton" aria-label="Semana anterior" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={17} /></button>
          <button className="iconButton" aria-label="Próxima semana" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={17} /></button>
          <button className="todayButton" onClick={() => { setWeekStart(startOfWeek(new Date())); setSelectedDay(new Date()); }}>Hoje</button>
          <strong>{rotuloSemana}</strong>
          <div className="agendaViewTabs">
            {(["semana", "dia", "lista"] as ViewMode[]).map(v => (
              <button key={v} className={viewMode === v ? "active" : ""} onClick={() => setViewMode(v)}>{v === "semana" ? "Semana" : v === "dia" ? "Dia" : "Lista"}</button>
            ))}
          </div>
        </div>

        {viewMode === "lista" ? (
          <ListaView consultas={consultasFiltradas} onOpen={(c) => router.push(`/consultas?editar=${c.id}`)} />
        ) : diasParaGrid.length === 0 ? (
          <div className="agendaEmpty">Nenhum dia de funcionamento configurado. <button className="linkButton" onClick={() => setConfigOpen(true)}>Ajustar horários</button></div>
        ) : (
      <section className="panel agendaGridPanel">
        <div className="agendaGridScroll" ref={scrollRef}>
          <div className="agendaGridHeader" style={{ gridTemplateColumns: gridColumns }}>
            <span />
            {diasParaGrid.map(({ date, key, aberto, feriado }) => {
              const ehHoje = isSameDay(date, today);
              return (
                <div key={key + date.toISOString()} className={`agendaDayHead ${ehHoje ? "isToday" : ""} ${feriado ? "isHoliday" : ""} ${!aberto ? "isClosed" : ""}`}>
                  <span>{DAY_LABEL[key]}</span>
                  <strong>{String(date.getDate()).padStart(2, "0")}</strong>
                  {feriado ? <em>Feriado</em> : !aberto ? <em className="closedTag">Fechado</em> : null}
                </div>
              );
            })}
          </div>
          <div className="agendaGridBody" style={{ gridTemplateColumns: gridColumns, height: linhasHora.length * HOUR_PX }}>
            <div className="agendaHourCol">
              {linhasHora.map(m => <span key={m} style={{ height: HOUR_PX }}>{minToLabel(m)}</span>)}
            </div>
            {diasParaGrid.map(({ date, key, aberto, feriado }) => {
              const dayConfig = config.dias[key];
              const inicioMin = aberto ? timeToMin(dayConfig.inicio) : 0;
              const fimMin = aberto ? timeToMin(dayConfig.fim) : 0;
              const baseMin = baseMinGlobal;
              const offsetTopFechado = aberto ? ((inicioMin - baseMin) / 60) * HOUR_PX : 0;
              const bottomFechado = aberto ? ((baseMin + linhasHora.length * 60 - fimMin) / 60) * HOUR_PX : 0;
              const eventos = consultasFiltradas.filter(c => isSameDay(new Date(c.data_hora), date));
              const placed = layoutOverlaps(eventos);
              const ehHoje = isSameDay(date, today);
              return (
                <div
                  key={key + date.toISOString()}
                  className={`agendaDayCol ${ehHoje ? "isTodayCol" : ""} ${feriado ? "isHoliday" : ""} ${!aberto ? "isClosedDay" : ""}`}
                  onClick={(e) => handleSlotClick(e, date, aberto && !feriado)}
                >
                  {!aberto && <div className="agendaClosed" style={{ top: 0, bottom: 0 }} />}
                  {aberto && offsetTopFechado > 0 && <div className="agendaClosed" style={{ top: 0, height: offsetTopFechado }} />}
                  {aberto && bottomFechado > 0 && <div className="agendaClosed" style={{ bottom: 0, height: bottomFechado }} />}
                  {ehHoje && nowInRange && (
                    <div className="agendaNow" style={{ top: nowTop }}>
                      <span className="agendaNowDot" />
                      <span className="agendaNowLine" />
                    </div>
                  )}
                  {placed.map(({ c, start, col, cols }) => {
                    const dt = new Date(c.data_hora);
                    const top = ((start - baseMin) / 60) * HOUR_PX;
                    const height = Math.max(24, (c.duracao_min / 60) * HOUR_PX - 4);
                    const cor = STATUS_TO_COLOR[c.status] ?? "blue";
                    const widthPct = 100 / cols;
                    const leftPct = widthPct * col;
                    return (
                      <div
                        key={c.id}
                        className={`agendaEvent ${cor}`}
                        style={{ top, height, left: `calc(${leftPct}% + 4px)`, width: `calc(${widthPct}% - 8px)` }}
                        title={`${c.paciente_nome}${c.servico ? " · " + c.servico : ""}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="agendaEventAvatar">{initials(c.paciente_nome)}</div>
                        <div>
                          <strong>{c.paciente_nome}</strong>
                          <span>{dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}{c.servico ? ` · ${c.servico}` : ""}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        {loading && <div className="agendaLoadingOverlay"><span /></div>}
        {!loading && consultas.length === 0 && (
          <div className="agendaWeekEmpty">Nenhuma consulta agendada nesta semana ainda.</div>
        )}
      </section>
        )}
      </div>

      <aside className="agendaSidebar">
        <MiniCalendar
          month={calMonth}
          cells={calCells}
          today={today}
          selectedDay={selectedDay}
          isSameWeek={isSameWeek}
          onPrev={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() - 1); setCalMonth(d); }}
          onNext={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() + 1); setCalMonth(d); }}
          onPick={(d) => { setSelectedDay(d); setWeekStart(startOfWeek(d)); if (viewMode === "semana") setViewMode("dia"); }}
        />

        <section className="sidePanel">
          <header className="sidePanelHeader">
            <div>
              <b>Agenda do dia</b>
              <small>{selectedDay.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</small>
            </div>
            <span className="sidePanelBadge">{consultasDoDia.length}</span>
          </header>
          {consultasDoDia.length === 0 ? (
            <div className="sidePanelEmpty">Nenhuma consulta neste dia.</div>
          ) : (
            <ul className="agendaDoDiaList">
              {consultasDoDia.map(c => {
                const dt = new Date(c.data_hora);
                const cor = STATUS_TO_COLOR[c.status] ?? "blue";
                return (
                  <li key={c.id} className={`agendaDoDiaItem cor-${cor}`} onClick={() => router.push(`/consultas?editar=${c.id}`)}>
                    <span className="agendaDoDiaHora">{dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    <div className="agendaDoDiaBody">
                      <strong>{c.paciente_nome}</strong>
                      <small>{c.servico ?? "Consulta"}</small>
                    </div>
                    <span className={`statusBadge ${STATUS_CLASS[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                    <button className="iconButton" aria-label="Mais opções" onClick={(e) => { e.stopPropagation(); router.push(`/consultas?editar=${c.id}`); }}><MoreHorizontal size={15} /></button>
                  </li>
                );
              })}
            </ul>
          )}
          <button
            className="sidePanelAction"
            onClick={() => router.push(`/consultas?nova=1&data=${toIsoDate(selectedDay)}`)}
          >
            <Plus size={15} /> Nova consulta no dia
          </button>
        </section>

        <section className="sidePanel">
          <header className="sidePanelHeader"><b>Resumo do dia</b></header>
          <div className="resumoGrid">
            <ResumoCell icon={<CalendarDays size={15} />} value={String(consultasDoDia.length)} label="Consultas agendadas" />
            <ResumoCell icon={<PieChart size={15} />} value={diaCapacidadeMin > 0 ? `${diaOcupacaoPct}%` : "—"} label="Taxa de ocupação" />
            <ResumoCell icon={<Clock size={15} />} value={diaCapacidadeMin > 0 ? String(diaLivres) : "—"} label="Horários livres" />
            <ResumoCell icon={<X size={15} />} value={String(diaCancelamentos)} label="Cancelamentos" />
          </div>
        </section>
      </aside>
    </div>

    {configOpen && <AjustesModal config={config} sqlProfissionais={sqlProfissionais} onClose={() => setConfigOpen(false)} onSaved={(c) => { setConfig(c); setConfigOpen(false); }} />}
  </>;
}

function StatCard({ icon, label, value, delta, deltaSuffix, deltaLabel }: { icon: ReactNode; label: string; value: string; delta?: number | null; deltaSuffix?: string; deltaLabel?: string }) {
  const showDelta = delta !== null && delta !== undefined;
  const isUp = showDelta && delta! >= 0;
  return (
    <article className="statCard">
      <div className="statCardIcon">{icon}</div>
      <div className="statCardBody">
        <small>{label}</small>
        <strong>{value}</strong>
        {showDelta && (
          <div className={`statCardDelta ${isUp ? "up" : "down"}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{isUp ? "+" : ""}{delta}{deltaSuffix ?? "%"}</span>
            {deltaLabel && <em>{deltaLabel}</em>}
          </div>
        )}
      </div>
    </article>
  );
}

function ResumoCell({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="resumoCell">
      <span className="resumoIcon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function MiniCalendar({ month, cells, today, selectedDay, isSameWeek, onPrev, onNext, onPick }: {
  month: Date; cells: Date[]; today: Date; selectedDay: Date;
  isSameWeek: (d: Date) => boolean;
  onPrev: () => void; onNext: () => void; onPick: (d: Date) => void;
}) {
  const monthLabel = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return (
    <section className="sidePanel miniCalPanel">
      <header className="miniCalHeader">
        <button className="iconButton" aria-label="Mês anterior" onClick={onPrev}><ChevronLeft size={14} /></button>
        <b>{monthLabel[0].toUpperCase() + monthLabel.slice(1)}</b>
        <button className="iconButton" aria-label="Próximo mês" onClick={onNext}><ChevronRight size={14} /></button>
      </header>
      <div className="miniCalWeekdays">{["S", "T", "Q", "Q", "S", "S", "D"].map((w, i) => <span key={i}>{w}</span>)}</div>
      <div className="miniCalGrid">
        {cells.map((d) => {
          const outside = d.getMonth() !== month.getMonth();
          const ehHoje = isSameDay(d, today);
          const selecionado = isSameDay(d, selectedDay);
          const naSemana = isSameWeek(d);
          return (
            <button
              key={d.toISOString()}
              className={`miniCalCell ${outside ? "outside" : ""} ${ehHoje ? "today" : ""} ${selecionado ? "selected" : ""} ${naSemana ? "inWeek" : ""}`}
              onClick={() => onPick(d)}
            >{d.getDate()}</button>
          );
        })}
      </div>
    </section>
  );
}

function ListaView({ consultas, onOpen }: { consultas: Consulta[]; onOpen: (c: Consulta) => void }) {
  if (consultas.length === 0) return <div className="agendaWeekEmpty">Nenhuma consulta nesta semana.</div>;
  const grupos = consultas.reduce<Record<string, Consulta[]>>((acc, c) => {
    const iso = new Date(c.data_hora).toISOString().slice(0, 10);
    (acc[iso] ??= []).push(c);
    return acc;
  }, {});
  return (
    <section className="panel agendaListaPanel">
      {Object.entries(grupos).map(([iso, itens]) => {
        const d = new Date(iso + "T00:00");
        return (
          <div key={iso} className="agendaListaGroup">
            <header>{d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</header>
            <ul>
              {itens.map(c => {
                const dt = new Date(c.data_hora);
                return (
                  <li key={c.id} onClick={() => onOpen(c)}>
                    <span className="agendaListaHora">{dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    <div>
                      <strong>{c.paciente_nome}</strong>
                      <small>{c.servico ?? "Consulta"} · {c.duracao_min} min</small>
                    </div>
                    <span className={`statusBadge ${STATUS_CLASS[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}

function AjustesModal({ config, sqlProfissionais, onClose, onSaved }: {
  config: AgendaConfig;
  sqlProfissionais: ProfissionalSql[];
  onClose: () => void;
  onSaved: (c: AgendaConfig) => void;
}) {
  const [local, setLocal] = useState<AgendaConfig>(config);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"horarios" | "feriados" | "profissionais">("horarios");
  const [novoFeriado, setNovoFeriado] = useState("");
  const [profSelecionado, setProfSelecionado] = useState<string | null>(sqlProfissionais[0]?.id ?? null);
  const [novoFeriadoProf, setNovoFeriadoProf] = useState("");

  function updateDia(key: DayKey, patch: Partial<DayConfig>) {
    setLocal({ ...local, dias: { ...local.dias, [key]: { ...local.dias[key], ...patch } } });
  }
  function addFeriado() {
    if (!novoFeriado) return;
    if (local.feriados.includes(novoFeriado)) return;
    setLocal({ ...local, feriados: [...local.feriados, novoFeriado].sort() });
    setNovoFeriado("");
  }
  function removeFeriado(f: string) {
    setLocal({ ...local, feriados: local.feriados.filter(x => x !== f) });
  }

  function getProfLocal(profId: string): ProfDisponibilidade {
    return local.disponibilidade[profId] ?? { dias: { ...local.dias }, feriados: [] };
  }
  function updateProfDia(profId: string, key: DayKey, patch: Partial<DayConfig>) {
    const prev = getProfLocal(profId);
    setLocal({ ...local, disponibilidade: { ...local.disponibilidade, [profId]: { ...prev, dias: { ...prev.dias, [key]: { ...prev.dias[key], ...patch } } } } });
  }
  function addFeriadoProf(profId: string) {
    if (!novoFeriadoProf) return;
    const prev = getProfLocal(profId);
    if (prev.feriados.includes(novoFeriadoProf)) return;
    setLocal({ ...local, disponibilidade: { ...local.disponibilidade, [profId]: { ...prev, feriados: [...prev.feriados, novoFeriadoProf].sort() } } });
    setNovoFeriadoProf("");
  }
  function removeFeriadoProf(profId: string, f: string) {
    const prev = getProfLocal(profId);
    setLocal({ ...local, disponibilidade: { ...local.disponibilidade, [profId]: { ...prev, feriados: prev.feriados.filter(x => x !== f) } } });
  }
  function resetProfDisp(profId: string) {
    const { [profId]: _, ...rest } = local.disponibilidade;
    setLocal({ ...local, disponibilidade: rest });
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) { setSaving(false); return; }
    const { error: err } = await supabase.from("configuracoes").upsert({ perfil_id: session.user.id, agenda_config: local }, { onConflict: "perfil_id" });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(local);
  }

  const profAtual = profSelecionado ? getProfLocal(profSelecionado) : null;
  const temCustom = profSelecionado ? !!local.disponibilidade[profSelecionado] : false;

  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modalCard modalLg" onClick={(e) => e.stopPropagation()}>
        <header className="modalHeader">
          <h2>Ajustes da agenda</h2>
          <button className="iconButton" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
        </header>
        <div className="tabsRow">
          <button className={tab === "horarios" ? "active" : ""} onClick={() => setTab("horarios")}>Horários da clínica</button>
          <button className={tab === "feriados" ? "active" : ""} onClick={() => setTab("feriados")}>Feriados</button>
          <button className={tab === "profissionais" ? "active" : ""} onClick={() => setTab("profissionais")}>Por profissional</button>
        </div>
        <div className="modalBody">
          {tab === "horarios" && (
            <>
              <div className="ajustesDuracao">
                <div>
                  <strong>Duração de cada consulta</strong>
                  <small>Usada para gerar os horários no link público de agendamento.</small>
                </div>
                <div className="ajustesDuracaoInput">
                  <input type="number" min={5} step={5} value={local.duracao_min} onChange={(e) => setLocal({ ...local, duracao_min: Math.max(5, Number(e.target.value) || 60) })} />
                  <span>min</span>
                </div>
              </div>
              <p className="ajustesHint">Horários padrão da clínica — usados para profissionais sem configuração própria.</p>
              <div className="ajustesDias">
                {DAY_ORDER.map(k => {
                  const d = local.dias[k];
                  return (
                    <div className={`ajustesDia ${d.aberto ? "isOpen" : ""}`} key={k}>
                      <label className="ajustesSwitch">
                        <input type="checkbox" checked={d.aberto} onChange={(e) => updateDia(k, { aberto: e.target.checked })} />
                        <span>{DAY_LABEL_FULL[k]}</span>
                      </label>
                      <div className="ajustesHoras">
                        <input type="time" value={d.inicio} disabled={!d.aberto} onChange={(e) => updateDia(k, { inicio: e.target.value })} />
                        <em>até</em>
                        <input type="time" value={d.fim} disabled={!d.aberto} onChange={(e) => updateDia(k, { fim: e.target.value })} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {tab === "feriados" && (
            <>
              <p className="ajustesHint">Dias em que a clínica não atende (bloqueia todos os profissionais).</p>
              <div className="ajustesAddRow">
                <input type="date" value={novoFeriado} onChange={(e) => setNovoFeriado(e.target.value)} />
                <button className="secondaryButton" onClick={addFeriado} disabled={!novoFeriado}><Plus size={15} /> Adicionar</button>
              </div>
              {local.feriados.length === 0 ? (
                <p className="ajustesEmpty">Nenhum feriado cadastrado.</p>
              ) : (
                <ul className="ajustesLista">
                  {local.feriados.map(f => (
                    <li key={f}>
                      <span>{new Date(f + "T00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
                      <button className="iconButton" onClick={() => removeFeriado(f)} aria-label="Remover"><Trash2 size={15} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          {tab === "profissionais" && (
            sqlProfissionais.length === 0 ? (
              <p className="ajustesEmpty">Nenhum profissional ativo. Cadastre em <strong>Profissionais</strong>.</p>
            ) : (
              <>
                <p className="ajustesHint">Configure horários e folgas individuais. Feriados gerais da clínica já bloqueiam automaticamente.</p>
                <div className="ajustesProfSelect">
                  {sqlProfissionais.map(p => (
                    <button key={p.id} type="button" className={`ajustesProfTab${profSelecionado === p.id ? " active" : ""}${local.disponibilidade[p.id] ? " hasCustom" : ""}`} onClick={() => setProfSelecionado(p.id)}>
                      {p.nome}
                    </button>
                  ))}
                </div>
                {profSelecionado && profAtual && (
                  <div className="ajustesProfBody">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <small style={{ color: "var(--text-muted)" }}>
                        {temCustom ? "Horário personalizado ativo" : "Usando horários da clínica (padrão)"}
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
                              <input type="checkbox" checked={d.aberto} onChange={(e) => updateProfDia(profSelecionado, k, { aberto: e.target.checked })} />
                              <span>{DAY_LABEL_FULL[k]}</span>
                            </label>
                            <div className="ajustesHoras">
                              <input type="time" value={d.inicio} disabled={!d.aberto} onChange={(e) => updateProfDia(profSelecionado, k, { inicio: e.target.value })} />
                              <em>até</em>
                              <input type="time" value={d.fim} disabled={!d.aberto} onChange={(e) => updateProfDia(profSelecionado, k, { fim: e.target.value })} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="ajustesHint" style={{ marginTop: 16 }}>Folgas exclusivas deste profissional (somam-se aos feriados da clínica).</p>
                    <div className="ajustesAddRow">
                      <input type="date" value={novoFeriadoProf} onChange={(e) => setNovoFeriadoProf(e.target.value)} />
                      <button className="secondaryButton" onClick={() => addFeriadoProf(profSelecionado)} disabled={!novoFeriadoProf}><Plus size={15} /> Adicionar</button>
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
                )}
              </>
            )
          )}
          {error && <div className="onboardingError">{error}</div>}
        </div>
        <footer className="modalFooter">
          <button className="secondaryButton" onClick={onClose}>Cancelar</button>
          <button className="primaryButton" onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar ajustes"}</button>
        </footer>
      </div>
    </div>
  );
}

"use client";

import { ChevronLeft, ChevronRight, Plus, Settings, Users, X, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const DAY_LABEL_FULL: Record<DayKey, string> = { seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo" };
const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

const HOUR_PX = 64;

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

export default function AgendaPage() {
  const router = useRouter();
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [selectedDay, setSelectedDay] = useState<Date>(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [config, setConfig] = useState<AgendaConfig>(DEFAULT_CONFIG);
  const [sqlProfissionais, setSqlProfissionais] = useState<ProfissionalSql[]>([]);
  const [profFiltro, setProfFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);
  const [calMonth, setCalMonth] = useState<Date>(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [fetchMonth, setFetchMonth] = useState<Date>(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [now, setNow] = useState<Date>(() => new Date());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const didScrollRef = useRef(false);

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
    const sm = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1);
    if (sm.getTime() !== fetchMonth.getTime()) setFetchMonth(sm);
  }, [selectedDay, fetchMonth]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const from = fetchMonth;
    const to = new Date(fetchMonth.getFullYear(), fetchMonth.getMonth() + 1, 0, 23, 59, 59);
    supabase.from("consultas").select("*")
      .gte("data_hora", from.toISOString())
      .lte("data_hora", to.toISOString())
      .order("data_hora")
      .then(({ data }) => {
        if (cancelled) return;
        setConsultas((data as Consulta[] | null) ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [fetchMonth]);

  const profAtivo = profFiltro !== "todos" && profFiltro !== "sem" ? profFiltro : null;
  const profDisp = useMemo(() => getProfDisp(config, profAtivo), [config, profAtivo]);

  const consultasFiltradas = useMemo(() => {
    if (profFiltro === "todos") return consultas;
    if (profFiltro === "sem") return consultas.filter(c => !c.profissional_id);
    return consultas.filter(c => c.profissional_id === profFiltro);
  }, [consultas, profFiltro]);

  const consultasDoDia = useMemo(() =>
    consultasFiltradas.filter(c => isSameDay(new Date(c.data_hora), selectedDay)),
    [consultasFiltradas, selectedDay]
  );

  const consultasPorDia = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of consultasFiltradas) {
      const iso = toIsoDate(new Date(c.data_hora));
      m.set(iso, (m.get(iso) ?? 0) + 1);
    }
    return m;
  }, [consultasFiltradas]);

  const diaKey = jsDayToKey(selectedDay);
  const isFeriadoDia = isFeriado(config, profAtivo, toIsoDate(selectedDay));
  const diaCfg = profDisp.dias[diaKey];
  const diaAberto = diaCfg.aberto && !isFeriadoDia;
  const openMin = diaAberto ? timeToMin(diaCfg.inicio) : 8 * 60;
  const closeMin = diaAberto ? timeToMin(diaCfg.fim) : 18 * 60;
  const gridStart = Math.max(0, Math.floor(openMin / 60) - 1);
  const gridEnd = Math.min(24, Math.ceil(closeMin / 60) + 1);
  const numHours = gridEnd - gridStart;
  const totalHeight = numHours * HOUR_PX;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMin - gridStart * 60) / 60) * HOUR_PX;
  const isToday = isSameDay(selectedDay, today);
  const nowInRange = isToday && nowMin >= gridStart * 60 && nowMin <= gridEnd * 60;

  const placed = useMemo(() => layoutOverlaps(consultasDoDia), [consultasDoDia]);

  // Scroll to current time on mount / day change
  useEffect(() => {
    didScrollRef.current = false;
  }, [selectedDay]);

  useEffect(() => {
    if (didScrollRef.current || !scrollRef.current || loading) return;
    const el = scrollRef.current;
    const target = isToday
      ? Math.max(0, nowTop - el.clientHeight / 2 + HOUR_PX)
      : Math.max(0, ((openMin - gridStart * 60) / 60) * HOUR_PX - HOUR_PX / 2);
    el.scrollTop = target;
    didScrollRef.current = true;
  }, [loading, isToday, nowTop, openMin, gridStart]);

  const calCells = useMemo(() => {
    const first = new Date(calMonth);
    const startPad = (first.getDay() + 6) % 7;
    const gridStartDate = new Date(first);
    gridStartDate.setDate(1 - startPad);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStartDate, i));
  }, [calMonth]);

  function goDay(n: number) {
    const d = addDays(selectedDay, n);
    setSelectedDay(d);
    const m = new Date(d.getFullYear(), d.getMonth(), 1);
    if (m.getTime() !== calMonth.getTime()) setCalMonth(m);
  }

  const handleGridClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".gcalEvent")) return;
    if (!diaAberto) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    const y = e.clientY - rect.top + scrollTop;
    const rawMin = gridStart * 60 + (y / HOUR_PX) * 60;
    const step = Math.max(5, config.duracao_min);
    const snapped = Math.max(openMin, Math.min(closeMin - step, Math.round(rawMin / step) * step));
    router.push(`/consultas?nova=1&data=${toIsoDate(selectedDay)}&hora=${minToLabel(snapped)}`);
  }, [diaAberto, gridStart, config.duracao_min, openMin, closeMin, selectedDay, router]);

  const monthLabel = selectedDay.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return <>
    <PageHeader
      title="Agenda"
      description={monthLabel[0].toUpperCase() + monthLabel.slice(1)}
      actions={<>
        <button className="secondaryButton" onClick={() => setConfigOpen(true)}><Settings size={16} /> Ajustes</button>
        <button className="primaryButton" onClick={() => router.push(`/consultas?nova=1&data=${toIsoDate(selectedDay)}`)}><Plus size={17} /> Nova consulta</button>
      </>}
    />

    {sqlProfissionais.length > 0 && (
      <div className="profFiltroBar">
        <button className={`profFiltroBtn${profFiltro === "todos" ? " active" : ""}`} onClick={() => setProfFiltro("todos")}><Users size={14} /> Todos</button>
        {sqlProfissionais.map(p => (
          <button key={p.id} className={`profFiltroBtn${profFiltro === p.id ? " active" : ""}`} onClick={() => setProfFiltro(p.id)}>{p.nome}</button>
        ))}
      </div>
    )}

    <div className="gcalWrap">
      <aside className="gcalSide">
        <MiniCalendar
          month={calMonth}
          cells={calCells}
          today={today}
          selectedDay={selectedDay}
          consultasPorDia={consultasPorDia}
          onPrev={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() - 1); setCalMonth(d); }}
          onNext={() => { const d = new Date(calMonth); d.setMonth(d.getMonth() + 1); setCalMonth(d); }}
          onPick={(d) => setSelectedDay(d)}
        />
      </aside>

      <div className="gcalMain">
        {/* Day header */}
        <div className="gcalDayHeader">
          <button className="iconButton" onClick={() => goDay(-1)} aria-label="Dia anterior"><ChevronLeft size={18} /></button>
          <div className="gcalDayNum">
            <span>{WEEKDAY_SHORT[selectedDay.getDay()].toUpperCase()}</span>
            <strong className={isToday ? "isToday" : ""}>{selectedDay.getDate()}</strong>
          </div>
          <button className="iconButton" onClick={() => goDay(1)} aria-label="Próximo dia"><ChevronRight size={18} /></button>
          {!isToday && (
            <button className="todayButton" onClick={() => { setSelectedDay(today); setCalMonth(new Date(today.getFullYear(), today.getMonth(), 1)); }}>Hoje</button>
          )}
          <div className="gcalHeaderMeta">
            {isFeriadoDia && <span className="agendaFeriadoBadge">Feriado</span>}
            {!diaAberto && !isFeriadoDia && <span className="agendaFeriadoBadge">Fechado</span>}
            {diaAberto && consultasDoDia.length > 0 && (
              <span className="gcalDayStat">{consultasDoDia.length} consulta{consultasDoDia.length !== 1 ? "s" : ""}</span>
            )}
            {diaAberto && consultasDoDia.length === 0 && !loading && (
              <span className="gcalDayStat">Dia livre</span>
            )}
          </div>
        </div>

        {/* Scrollable time grid */}
        <div className="gcalScroll" ref={scrollRef}>
          <div
            className="gcalGrid"
            style={{ height: totalHeight }}
            onClick={handleGridClick}
          >
            {/* Hour + half-hour lines */}
            {Array.from({ length: numHours }, (_, i) => {
              const h = gridStart + i;
              return (
                <div key={h}>
                  <div className="gcalHourRow" style={{ top: i * HOUR_PX }}>
                    <span className="gcalHourLabel">{String(h).padStart(2, "0")}:00</span>
                    <div className="gcalHourLine" />
                  </div>
                  <div className="gcalHalfRow" style={{ top: i * HOUR_PX + HOUR_PX / 2 }}>
                    <span />
                    <div className="gcalHalfLine" />
                  </div>
                </div>
              );
            })}

            {/* Closed zones (before open and after close) */}
            {diaAberto && openMin > gridStart * 60 && (
              <div className="gcalClosedZone" style={{ top: 0, height: ((openMin - gridStart * 60) / 60) * HOUR_PX }} />
            )}
            {diaAberto && closeMin < gridEnd * 60 && (
              <div className="gcalClosedZone" style={{ top: ((closeMin - gridStart * 60) / 60) * HOUR_PX, height: ((gridEnd * 60 - closeMin) / 60) * HOUR_PX }} />
            )}
            {!diaAberto && (
              <div className="gcalClosedZone gcalClosedFull" style={{ top: 0, height: totalHeight }}>
                <span>{isFeriadoDia ? "Feriado — sem atendimento" : "Sem atendimento neste dia"}</span>
              </div>
            )}

            {/* Current time indicator */}
            {nowInRange && (
              <div className="gcalNow" style={{ top: nowTop }}>
                <span className="gcalNowDot" />
                <div className="gcalNowBar" />
              </div>
            )}

            {/* Events */}
            {placed.map(({ c, start, col, cols }) => {
              const top = ((start - gridStart * 60) / 60) * HOUR_PX;
              const height = Math.max(28, (c.duracao_min / 60) * HOUR_PX - 4);
              const cor = STATUS_TO_COLOR[c.status] ?? "blue";
              const hora = new Date(c.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              return (
                <div
                  key={c.id}
                  className={`gcalEvent ${cor}`}
                  style={{
                    top,
                    height,
                    left: `calc(68px + ${col / cols} * (100% - 76px))`,
                    width: `calc((100% - 76px) / ${cols} - 6px)`,
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedConsulta(c); }}
                >
                  <strong>{c.paciente_nome}</strong>
                  {height > 36 && <span>{hora} · {c.duracao_min}min{c.servico ? ` · ${c.servico}` : ""}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {loading && <div className="gcalLoading"><span /></div>}
      </div>
    </div>

    {configOpen && (
      <AjustesModal
        config={config}
        sqlProfissionais={sqlProfissionais}
        onClose={() => setConfigOpen(false)}
        onSaved={(c) => { setConfig(c); setConfigOpen(false); }}
      />
    )}
    {selectedConsulta && (
      <ConsultaPopup
        consulta={selectedConsulta}
        onClose={() => setSelectedConsulta(null)}
        onEdit={() => router.push(`/consultas?editar=${selectedConsulta.id}`)}
      />
    )}
  </>;
}

function MiniCalendar({ month, cells, today, selectedDay, consultasPorDia, onPrev, onNext, onPick }: {
  month: Date; cells: Date[]; today: Date; selectedDay: Date;
  consultasPorDia: Map<string, number>;
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
          const iso = toIsoDate(d);
          const outside = d.getMonth() !== month.getMonth();
          const ehHoje = isSameDay(d, today);
          const selecionado = isSameDay(d, selectedDay);
          const count = consultasPorDia.get(iso) ?? 0;
          return (
            <button
              key={d.toISOString()}
              className={`miniCalCell ${outside ? "outside" : ""} ${ehHoje ? "today" : ""} ${selecionado ? "selected" : ""}`}
              onClick={() => onPick(d)}
            >
              {d.getDate()}
              {count > 0 && !outside && <span className="miniCalBadge">{count}</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ConsultaPopup({ consulta, onClose, onEdit }: { consulta: Consulta; onClose: () => void; onEdit: () => void }) {
  const dt = new Date(consulta.data_hora);
  const hora = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const data = dt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modalCard" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <header className="modalHeader">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="dashUpcomingAvatar" style={{ width: 38, height: 38, fontSize: 12 }}>{initials(consulta.paciente_nome)}</div>
            <div>
              <h2 style={{ margin: 0 }}>{consulta.paciente_nome}</h2>
              <div style={{ marginTop: 6 }}>
                <span className={`statusBadge ${STATUS_CLASS[consulta.status]}`}>{STATUS_LABEL[consulta.status]}</span>
              </div>
            </div>
          </div>
          <button className="iconButton" onClick={onClose} aria-label="Fechar"><X size={17} /></button>
        </header>
        <div className="modalBody">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <PopupField label="Data" value={data[0].toUpperCase() + data.slice(1)} />
            <PopupField label="Horário" value={`${hora} · ${consulta.duracao_min} min`} />
            {consulta.profissional && <PopupField label="Profissional" value={consulta.profissional} />}
            {consulta.servico && <PopupField label="Serviço" value={consulta.servico} />}
            {consulta.valor != null && (
              <PopupField label="Valor" value={`R$ ${Number(consulta.valor).toFixed(2).replace(".", ",")}`} />
            )}
          </div>
        </div>
        <footer className="modalFooter">
          <button className="secondaryButton" onClick={onClose}>Fechar</button>
          <button className="primaryButton" onClick={onEdit}>Editar consulta →</button>
        </footer>
      </div>
    </div>
  );
}

function PopupField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 9, color: "var(--text-subtle)", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, letterSpacing: "-.005em" }}>{value}</span>
    </div>
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
    if (!novoFeriado || local.feriados.includes(novoFeriado)) return;
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
                <p className="ajustesHint">Configure horários e folgas individuais.</p>
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
                    <p className="ajustesHint" style={{ marginTop: 16 }}>Folgas exclusivas deste profissional.</p>
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

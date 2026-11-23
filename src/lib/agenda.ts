import type { Consulta } from "@/lib/db";

/* ── Tipos ───────────────────────────────────────────────── */

export type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
export type DayConfig = { aberto: boolean; inicio: string; fim: string };
export type ProfissionalJson = { id: string; nome: string; dias: DayKey[] };
export type ProfissionalSql = { id: string; nome: string; especialidade: string | null };
export type ProfDisponibilidade = { dias: Record<DayKey, DayConfig>; feriados: string[] };
export type AgendaConfig = {
  dias: Record<DayKey, DayConfig>;
  feriados: string[];
  profissionais: ProfissionalJson[];
  duracao_min: number;
  disponibilidade: Record<string, ProfDisponibilidade>;
};
export type AgendaView = "dia" | "semana" | "mes";

/* ── Constantes ──────────────────────────────────────────── */

export const DAY_ORDER: DayKey[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
export const DAY_LABEL_FULL: Record<DayKey, string> = { seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo" };

export const DEFAULT_CONFIG: AgendaConfig = {
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

/** Altura de uma hora na grade, em px. Também exposta ao CSS via --agx-hour. */
export const HOUR_PX = 80;
/** Duração assumida quando a consulta não informa uma duração válida. */
const FALLBACK_DURATION_MIN = 30;

/** Cores de identificação dos profissionais (evita os tons semânticos de status). */
export const PROF_COLORS = ["#4f46e5", "#7c3aed", "#0d9488", "#db2777", "#0284c7", "#475569"];

/* ── Datas (sempre no fuso local) ────────────────────────── */

export function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
export function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
export function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
export function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
/** Segunda-feira da semana de `d`. */
export function startOfWeek(d: Date) { const x = startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }

/** Soma meses mantendo o dia, limitado ao último dia do mês de destino. */
export function addMonths(d: Date, n: number) {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), last));
  return target;
}

/** YYYY-MM-DD no fuso local (toISOString usaria UTC e deslocaria consultas noturnas). */
export function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function jsDayToKey(d: Date): DayKey { return DAY_ORDER[(d.getDay() + 6) % 7]; }
export function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
export function minToLabel(min: number) { return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`; }
export function formatTime(d: Date) { return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
export function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

/** Dias exibidos pelo calendário mensal: semanas completas (segunda a domingo) que cobrem o mês. */
export function monthGridDays(month: Date) {
  const first = startOfMonth(month);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = endOfMonth(month).getDate();
  const weeks = Math.ceil((lead + daysInMonth) / 7);
  const start = addDays(first, -lead);
  return Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
}

/** Janela de consultas carregada para um dia: o mês inteiro mais 7 dias de cada lado (cobre semana e grade mensal). */
export function fetchWindow(day: Date) {
  return { from: addDays(startOfMonth(day), -7), to: addDays(endOfMonth(day), 7) };
}

/* ── Configuração e disponibilidade ──────────────────────── */

export function mergeConfig(raw: unknown): AgendaConfig {
  const r = (raw ?? {}) as Partial<AgendaConfig>;
  return {
    dias: { ...DEFAULT_CONFIG.dias, ...(r.dias ?? {}) },
    feriados: Array.isArray(r.feriados) ? r.feriados : [],
    profissionais: Array.isArray(r.profissionais) ? r.profissionais : [],
    duracao_min: typeof r.duracao_min === "number" && r.duracao_min > 0 ? r.duracao_min : DEFAULT_CONFIG.duracao_min,
    disponibilidade: (r.disponibilidade && typeof r.disponibilidade === "object") ? r.disponibilidade as Record<string, ProfDisponibilidade> : {},
  };
}

export function getProfDisp(config: AgendaConfig, profId: string | null): { dias: Record<DayKey, DayConfig>; feriados: string[] } {
  if (!profId || !config.disponibilidade[profId]) return { dias: config.dias, feriados: [] };
  return { dias: { ...config.dias, ...config.disponibilidade[profId].dias }, feriados: config.disponibilidade[profId].feriados };
}

export function isFeriado(config: AgendaConfig, profId: string | null, isoDate: string): boolean {
  return config.feriados.includes(isoDate) || (profId ? (config.disponibilidade[profId]?.feriados ?? []).includes(isoDate) : false);
}

export type DayBounds = { aberto: boolean; feriado: boolean; openMin: number; closeMin: number };

/** Expediente de um dia (para o profissional filtrado, quando houver). */
export function dayBounds(config: AgendaConfig, profId: string | null, day: Date): DayBounds {
  const cfg = getProfDisp(config, profId).dias[jsDayToKey(day)];
  const feriado = isFeriado(config, profId, toIsoDate(day));
  const aberto = cfg.aberto && !feriado;
  return { aberto, feriado, openMin: aberto ? timeToMin(cfg.inicio) : 8 * 60, closeMin: aberto ? timeToMin(cfg.fim) : 18 * 60 };
}

/* ── Consultas ───────────────────────────────────────────── */

export function consultaDuration(c: Consulta) {
  return c.duracao_min > 0 ? c.duracao_min : FALLBACK_DURATION_MIN;
}

export function minutesOfDay(d: Date) { return d.getHours() * 60 + d.getMinutes(); }

/** Faixa de horas visível na grade: expediente ± 1h, ampliada para nunca esconder uma consulta. */
export function gridRange(days: DayBounds[], consultas: Consulta[]) {
  const open = days.filter(d => d.aberto);
  const base = open.length ? open : days;
  let startMin = Math.min(...base.map(d => d.openMin));
  let endMin = Math.max(...base.map(d => d.closeMin));
  for (const c of consultas) {
    const s = minutesOfDay(new Date(c.data_hora));
    startMin = Math.min(startMin, s);
    endMin = Math.max(endMin, s + consultaDuration(c));
  }
  const start = Math.max(0, Math.floor(startMin / 60) - 1);
  const end = Math.min(24, Math.ceil(endMin / 60) + 1);
  return { startHour: start, endHour: Math.max(end, start + 1) };
}

export type PlacedConsulta = { c: Consulta; start: number; end: number; col: number; cols: number };

/** Distribui consultas simultâneas em colunas lado a lado. */
export function layoutOverlaps(eventos: Consulta[]): PlacedConsulta[] {
  const items = eventos.map((c) => {
    const start = minutesOfDay(new Date(c.data_hora));
    return { c, start, end: start + consultaDuration(c) };
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

export type OverflowCluster = { start: number; end: number; count: number; col: number; cols: number };

/**
 * Limita a quantidade de colunas lado a lado. Em grupos com mais de `maxCols` consultas simultâneas,
 * mantém as primeiras `maxCols - 1` colunas e troca o restante por um indicador "+N".
 */
export function collapseOverflow(placed: PlacedConsulta[], maxCols: number) {
  if (!Number.isFinite(maxCols)) return { visible: placed, clusters: [] as OverflowCluster[] };
  const visible: PlacedConsulta[] = [];
  const hidden: PlacedConsulta[] = [];
  for (const p of placed) {
    if (p.cols <= maxCols) visible.push(p);
    else if (p.col >= maxCols - 1) hidden.push(p);
    else visible.push({ ...p, cols: maxCols });
  }
  const clusters: OverflowCluster[] = [];
  for (const p of hidden.sort((a, b) => a.start - b.start)) {
    const last = clusters[clusters.length - 1];
    if (last && p.start < last.end) { last.end = Math.max(last.end, p.end); last.count += 1; }
    else clusters.push({ start: p.start, end: p.end, count: 1, col: maxCols - 1, cols: maxCols });
  }
  return { visible, clusters };
}

/**
 * Horário (em minutos) do slot sob o ponteiro, ou null fora do expediente.
 * Os slots começam na abertura e têm a duração padrão da consulta, como no link público.
 */
export function slotAtOffset(offsetY: number, gridStartMin: number, openMin: number, closeMin: number, stepMin: number) {
  const step = Math.max(5, stepMin);
  const rawMin = gridStartMin + (offsetY / HOUR_PX) * 60;
  if (rawMin < openMin) return null;
  const slot = openMin + Math.floor((rawMin - openMin) / step) * step;
  return slot + step <= closeMin ? slot : null;
}

/* ── Contagens ───────────────────────────────────────────── */

export type StatusCounts = { total: number; confirmada: number; aguardando: number; concluida: number; cancelada: number };

export function countByStatus(consultas: Consulta[]): StatusCounts {
  const counts: StatusCounts = { total: consultas.length, confirmada: 0, aguardando: 0, concluida: 0, cancelada: 0 };
  for (const c of consultas) counts[c.status] += 1;
  return counts;
}

export function groupByDay(consultas: Consulta[]) {
  const map = new Map<string, Consulta[]>();
  for (const c of consultas) {
    const key = toIsoDate(new Date(c.data_hora));
    const list = map.get(key);
    if (list) list.push(c); else map.set(key, [c]);
  }
  for (const list of map.values()) list.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
  return map;
}

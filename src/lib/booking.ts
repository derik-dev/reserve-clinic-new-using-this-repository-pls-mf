import {
  addDays, dayBounds, minToLabel, startOfDay, toIsoDate, type AgendaConfig,
} from "@/lib/agenda";

export type Busy = { inicio: number; fim: number };

export type Slot = {
  /** Início em minutos desde 00:00. */
  start: number;
  end: number;
  /** "17:00", enviado à API como horário da consulta. */
  startLabel: string;
  /** "17:00 – 18:00", exibido ao paciente. */
  rangeLabel: string;
};

/** Antecedência mínima, em minutos, para marcar um horário de hoje. */
const MIN_LEAD_MIN = 10;

/**
 * Horários livres de um dia, no formato de faixa (das 17:00 às 18:00).
 * Os horários começam na abertura e têm a duração padrão da consulta.
 * Ficam de fora: dia fechado/feriado, horários que já passaram e horários ocupados.
 */
export function freeSlots(day: Date, config: AgendaConfig, profId: string | null, busy: Busy[], now: Date): Slot[] {
  const b = dayBounds(config, profId, day);
  if (!b.aberto) return [];
  const dur = config.duracao_min;
  const isToday = toIsoDate(day) === toIsoDate(now);
  const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() : -1;
  const slots: Slot[] = [];
  for (let m = b.openMin; m + dur <= b.closeMin; m += dur) {
    const end = m + dur;
    if (isToday && m - nowMin <= MIN_LEAD_MIN) continue;
    if (busy.some(r => m < r.fim && r.inicio < end)) continue;
    slots.push({ start: m, end, startLabel: minToLabel(m), rangeLabel: `${minToLabel(m)} – ${minToLabel(end)}` });
  }
  return slots;
}

/** Faixa de horário de um agendamento já escolhido ("17:00 – 18:00"). */
export function rangeOf(startLabel: string, durMin: number) {
  const [h, m] = startLabel.split(":").map(Number);
  const start = h * 60 + m;
  return `${minToLabel(start)} – ${minToLabel(start + durMin)}`;
}

/** Janela do mês exibido, para buscar os horários ocupados de uma vez. */
export function monthWindow(month: Date) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

/** Agrupa consultas (data/hora ISO + duração) por dia, em intervalos de minutos. */
export function busyByDay(rows: { data_hora: string; duracao_min: number }[]) {
  const map = new Map<string, Busy[]>();
  for (const r of rows) {
    const dt = new Date(r.data_hora);
    const key = toIsoDate(dt);
    const start = dt.getHours() * 60 + dt.getMinutes();
    const list = map.get(key) ?? [];
    list.push({ inicio: start, fim: start + (r.duracao_min > 0 ? r.duracao_min : 30) });
    map.set(key, list);
  }
  return map;
}

/** Primeiro dia (a partir de hoje) com algum horário livre, para abrir o calendário já no lugar certo. */
export function firstFreeDay(config: AgendaConfig, profId: string | null, busy: Map<string, Busy[]>, now: Date, searchDays = 60) {
  const today = startOfDay(now);
  for (let i = 0; i < searchDays; i++) {
    const d = addDays(today, i);
    if (freeSlots(d, config, profId, busy.get(toIsoDate(d)) ?? [], now).length > 0) return d;
  }
  return null;
}

/* ── Validação e máscaras ────────────────────────────────── */

export const digits = (v: string) => v.replace(/\D/g, "");

export function maskCpf(v: string) {
  const d = digits(v).slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(v: string) {
  const d = digits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function isValidCpf(value: string) {
  const d = digits(value);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const check = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(d[9]) && check(10) === Number(d[10]);
}

export const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/** Link do WhatsApp da clínica com uma mensagem pronta. */
export function whatsappLink(telefone: string | null, message: string) {
  if (!telefone) return null;
  const d = digits(telefone);
  if (d.length < 10) return null;
  const phone = d.startsWith("55") ? d : `55${d}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

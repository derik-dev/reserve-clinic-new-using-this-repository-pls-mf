"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths, capitalize, isSameDay, monthGridDays, startOfDay, startOfMonth, toIsoDate, dayBounds, type AgendaConfig,
} from "@/lib/agenda";
import { freeSlots, type Busy, type Slot } from "@/lib/booking";
import styles from "./booking.module.css";

type Props = {
  config: AgendaConfig;
  profId: string | null;
  /** Horários ocupados por dia (YYYY-MM-DD), dos meses já carregados. */
  busy: Map<string, Busy[]>;
  loading: boolean;
  data: string;
  hora: string;
  onMonthChange: (month: Date) => void;
  onPickDate: (iso: string) => void;
  onPickSlot: (slot: Slot) => void;
};

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

export function ScheduleStep({ config, profId, busy, loading, data, hora, onMonthChange, onPickDate, onPickSlot }: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = useState<Date>(() => startOfMonth(data ? new Date(`${data}T12:00:00`) : today));
  const slotsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { onMonthChange(view); }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date();
  const cells = useMemo(() => monthGridDays(view), [view]);
  const canGoBack = view.getTime() > startOfMonth(today).getTime();

  const selectedDay = data ? new Date(`${data}T12:00:00`) : null;
  const slots = selectedDay ? freeSlots(selectedDay, config, profId, busy.get(data) ?? [], now) : [];

  function changeMonth(delta: number) {
    setView(addMonths(view, delta));
  }

  function pickDay(iso: string) {
    onPickDate(iso);
    // No celular os horários ficam abaixo do calendário: leva a tela até eles.
    window.setTimeout(() => slotsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 60);
  }

  return (
    <>
      <h2 className={styles.title}>Escolha o dia e o horário</h2>

      <div className={styles.cal}>
        <div className={styles.calHead}>
          <strong aria-live="polite">{capitalize(view.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }))}</strong>
          <div>
            <button type="button" className={styles.iconBtn} onClick={() => changeMonth(-1)} disabled={!canGoBack} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
            <button type="button" className={styles.iconBtn} onClick={() => changeMonth(1)} aria-label="Próximo mês"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className={styles.calWeek} aria-hidden="true">{WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}</div>
        <div className={styles.calGrid} role="group" aria-label="Dias do mês">
          {cells.map(d => {
            const iso = toIsoDate(d);
            const outside = d.getMonth() !== view.getMonth();
            const past = d < today;
            const b = dayBounds(config, profId, d);
            const available = !outside && !past && b.aberto && freeSlots(d, config, profId, busy.get(iso) ?? [], now).length > 0;
            const selected = data === iso;
            return (
              <button
                key={d.getTime()}
                type="button"
                disabled={!available}
                onClick={() => pickDay(iso)}
                className={`${styles.calCell}${available ? ` ${styles.isFree}` : ""}${selected ? ` ${styles.isSelected}` : ""}${isSameDay(d, today) ? ` ${styles.isToday}` : ""}`}
                aria-pressed={selected}
                aria-label={`${d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}${available ? "" : ", sem horários"}`}
              >
                {outside ? "" : d.getDate()}
              </button>
            );
          })}
        </div>
        {loading && <p className={styles.hint} role="status">Atualizando horários…</p>}
      </div>

      <div ref={slotsRef} className={styles.slotsArea} aria-live="polite">
        {!selectedDay ? (
          <p className={styles.hint}>Escolha um dia para ver os horários livres.</p>
        ) : slots.length === 0 ? (
          <p className={styles.hint}>Sem horários livres neste dia. Tente outro.</p>
        ) : (
          <div key={data} className={styles.slotsReveal}>
            <p className={styles.slotsTitle}>{capitalize(selectedDay.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }))}</p>
            <div className={styles.slots} role="group" aria-label="Horários livres">
              {slots.map((s, i) => (
                <button key={s.startLabel} type="button" style={{ animationDelay: `${Math.min(i, 8) * 45 + 80}ms` }} className={`${styles.slot} ${styles.slotIn}${hora === s.startLabel ? ` ${styles.isSelected}` : ""}`} aria-pressed={hora === s.startLabel} onClick={() => onPickSlot(s)}>
                  {s.rangeLabel}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

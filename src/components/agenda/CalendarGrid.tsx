"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { Consulta } from "@/lib/db";
import {
  HOUR_PX, capitalize, collapseOverflow, dayBounds, groupByDay, gridRange, isSameDay, layoutOverlaps, minToLabel, minutesOfDay, slotAtOffset, toIsoDate,
  type AgendaConfig,
} from "@/lib/agenda";
import { AppointmentCard } from "./AppointmentCard";
import { useNow } from "./useNow";
import type { AgendaDataStatus } from "./useAgendaData";

type Props = {
  /** 1 dia (visão diária) ou 7 (semana). */
  days: Date[];
  /** Consultas já filtradas por profissional; podem incluir dias fora de `days`. */
  consultas: Consulta[];
  config: AgendaConfig;
  profAtivo: string | null;
  today: Date;
  status: AgendaDataStatus;
  /** Cor por profissional; definido só quando a grade mostra todos. */
  profColors?: Map<string, string>;
  emptyMessage: string;
  onSelect: (c: Consulta) => void;
  onCreate: (isoDate: string, hora: string) => void;
  onPickDay?: (d: Date) => void;
  onRetry: () => void;
};

type Hover = { col: number; slot: number } | null;

/** Largura mínima para um card legível; define quantas consultas simultâneas cabem lado a lado. */
const MIN_CARD_PX = 72;
/** Largura a partir da qual o card mostra status e detalhes. */
const WIDE_CARD_PX = 200;

export function CalendarGrid({ days, consultas, config, profAtivo, today, status, profColors, emptyMessage, onSelect, onCreate, onPickDay, onRetry }: Props) {
  const now = useNow();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const scrolledKey = useRef("");
  const [hover, setHover] = useState<Hover>(null);
  const firstColRef = useRef<HTMLDivElement | null>(null);
  const [colWidth, setColWidth] = useState(0);

  useEffect(() => {
    const el = firstColRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setColWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [days.length]);

  const bounds = useMemo(() => days.map(d => dayBounds(config, profAtivo, d)), [days, config, profAtivo]);
  const byDay = useMemo(() => groupByDay(consultas), [consultas]);
  const dayLists = useMemo(() => days.map(d => byDay.get(toIsoDate(d)) ?? []), [days, byDay]);
  const visibleCount = dayLists.reduce((n, list) => n + list.length, 0);
  const isWeek = days.length > 1;
  const width = colWidth || 1000;
  // Na semana as colunas são estreitas: acima do limite, as consultas viram "+N". No dia, todas ficam visíveis.
  const maxCols = isWeek ? Math.max(1, Math.floor(width / MIN_CARD_PX)) : Infinity;
  const layouts = useMemo(() => dayLists.map(list => collapseOverflow(layoutOverlaps(list), maxCols)), [dayLists, maxCols]);

  const { startHour, endHour } = useMemo(() => gridRange(bounds, dayLists.flat()), [bounds, dayLists]);
  const gridStartMin = startHour * 60;
  const totalHeight = (endHour - startHour) * HOUR_PX;
  const nowMin = minutesOfDay(now);
  const nowTop = ((nowMin - gridStartMin) / 60) * HOUR_PX;
  const nowInRange = nowMin >= gridStartMin && nowMin <= endHour * 60;
  const step = Math.max(5, config.duracao_min);
  const anyOpen = bounds.some(b => b.aberto);

  // Posiciona a rolagem ao abrir/trocar de período: hora atual (se hoje) ou início do expediente.
  const viewKey = `${toIsoDate(days[0])}:${days.length}`;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || status === "loading" || scrolledKey.current === viewKey) return;
    const showsToday = days.some(d => isSameDay(d, today));
    const firstOpen = bounds.find(b => b.aberto) ?? bounds[0];
    const target = showsToday
      ? nowTop - el.clientHeight / 2
      : ((firstOpen.openMin - gridStartMin) / 60) * HOUR_PX - HOUR_PX / 2;
    el.scrollTop = Math.max(0, target);
    scrolledKey.current = viewKey;
  }, [viewKey, status, days, today, bounds, nowTop, gridStartMin]);

  function slotFromEvent(e: MouseEvent<HTMLDivElement>, col: number) {
    // O retângulo da coluna já considera a rolagem: não somar scrollTop.
    const offsetY = e.clientY - e.currentTarget.getBoundingClientRect().top;
    const b = bounds[col];
    return b.aberto ? slotAtOffset(offsetY, gridStartMin, b.openMin, b.closeMin, step) : null;
  }

  function handleMove(e: MouseEvent<HTMLDivElement>, col: number) {
    if ((e.target as HTMLElement).closest(".agxEvent")) { if (hover) setHover(null); return; }
    const slot = slotFromEvent(e, col);
    if (slot === null) { if (hover) setHover(null); return; }
    if (!hover || hover.col !== col || hover.slot !== slot) setHover({ col, slot });
  }

  function handleClick(e: MouseEvent<HTMLDivElement>, col: number) {
    if ((e.target as HTMLElement).closest(".agxEvent")) return;
    const slot = slotFromEvent(e, col);
    if (slot !== null) onCreate(toIsoDate(days[col]), minToLabel(slot));
  }

  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  return (
    <div className="agxGridWrap">
      <div className={`agxProgress${status === "loading" ? " isLoading" : ""}`} aria-hidden="true"><span /></div>

      {status === "error" && (
        <div className="agxBanner isError" role="alert">
          <span>Não foi possível carregar as consultas. Os horários abaixo podem estar incompletos.</span>
          <button className="secondaryButton" onClick={onRetry}>Tentar novamente</button>
        </div>
      )}
      {status === "ready" && visibleCount === 0 && anyOpen && <p className="agxBanner">{emptyMessage}</p>}

      <div className="agxScroll" ref={scrollRef}>
        {isWeek && (
          <div className="agxWeekHead" style={{ ["--agx-cols" as string]: days.length }}>
            <span />
            {days.map((d, i) => (
              <button key={d.getTime()} className={`agxWeekDay${isSameDay(d, today) ? " isToday" : ""}${bounds[i].aberto ? "" : " isClosed"}`} onClick={() => onPickDay?.(d)} aria-label={`Abrir ${d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}`}>
                <span>{d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
                <strong>{d.getDate()}</strong>
              </button>
            ))}
          </div>
        )}

        <div className="agxBody" style={{ height: totalHeight, ["--agx-hour" as string]: `${HOUR_PX}px`, ["--agx-cols" as string]: days.length }}>
          <div className="agxGutter" aria-hidden="true">
            {hours.map((h, i) => <span key={h} style={{ top: i * HOUR_PX }}>{String(h).padStart(2, "0")}:00</span>)}
          </div>

          {days.map((d, col) => {
            const b = bounds[col];
            const openTop = ((b.openMin - gridStartMin) / 60) * HOUR_PX;
            const closeTop = ((b.closeMin - gridStartMin) / 60) * HOUR_PX;
            const isToday = isSameDay(d, today);
            return (
              <div
                key={d.getTime()}
                ref={col === 0 ? firstColRef : undefined}
                className={`agxCol${isToday ? " isToday" : ""}`}
                role="group"
                aria-label={capitalize(d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }))}
                onMouseMove={(e) => handleMove(e, col)}
                onMouseLeave={() => setHover(null)}
                onClick={(e) => handleClick(e, col)}
                style={{ cursor: b.aberto ? "pointer" : "default" }}
              >
                {b.aberto ? (
                  <>
                    {openTop > 0 && <div className="agxClosed" style={{ top: 0, height: openTop }} />}
                    {closeTop < totalHeight && <div className="agxClosed" style={{ top: closeTop, height: totalHeight - closeTop }} />}
                  </>
                ) : (
                  <div className="agxClosed" style={{ top: 0, height: totalHeight }}><span>{b.feriado ? "Feriado" : "Sem atendimento"}</span></div>
                )}

                {hover?.col === col && (
                  <div className="agxHover" style={{ top: ((hover.slot - gridStartMin) / 60) * HOUR_PX, height: (step / 60) * HOUR_PX }}>
                    <span>{minToLabel(hover.slot)}</span>
                    <span>Nova consulta</span>
                  </div>
                )}

                {layouts[col].visible.map(({ c, start, col: slotCol, cols }) => (
                  <AppointmentCard
                    key={c.id}
                    consulta={c}
                    start={start}
                    gridStartMin={gridStartMin}
                    col={slotCol}
                    cols={cols}
                    wide={width / cols >= WIDE_CARD_PX}
                    profColor={profColors && c.profissional_id ? profColors.get(c.profissional_id) : undefined}
                    onSelect={onSelect}
                  />
                ))}
                {layouts[col].clusters.map(k => (
                  <button
                    key={k.start}
                    className="agxMoreEvt"
                    style={{
                      top: ((k.start - gridStartMin) / 60) * HOUR_PX,
                      height: Math.max(44, ((k.end - k.start) / 60) * HOUR_PX - 2),
                      left: `calc(${(k.col / k.cols) * 100}% + 2px)`,
                      width: `calc(${100 / k.cols}% - 4px)`,
                    }}
                    onClick={(e) => { e.stopPropagation(); onPickDay?.(d); }}
                    aria-label={`Mais ${k.count} ${k.count === 1 ? "consulta" : "consultas"} neste horário. Abrir o dia`}
                    title="Abrir o dia para ver todas"
                  >{k.cols === 1 ? `${k.count} ${k.count === 1 ? "consulta" : "consultas"}` : `+${k.count}`}</button>
                ))}

                {isToday && nowInRange && (
                  <div className="agxNow" style={{ top: nowTop }} aria-hidden="true"><span /></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

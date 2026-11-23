import type { Consulta } from "@/lib/db";
import { STATUS_LABEL } from "@/lib/db";
import { formatTime, groupByDay, isSameDay, monthGridDays, toIsoDate, dayBounds, type AgendaConfig } from "@/lib/agenda";
import type { AgendaDataStatus } from "./useAgendaData";

type Props = {
  month: Date;
  consultas: Consulta[];
  config: AgendaConfig;
  profAtivo: string | null;
  today: Date;
  selectedDay: Date;
  status: AgendaDataStatus;
  onPickDay: (d: Date) => void;
  onSelect: (c: Consulta) => void;
  onRetry: () => void;
};

const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const MAX_CHIPS = 3;

export function MonthGrid({ month, consultas, config, profAtivo, today, selectedDay, status, onPickDay, onSelect, onRetry }: Props) {
  const days = monthGridDays(month);
  const byDay = groupByDay(consultas);
  const inMonth = days.some(d => d.getMonth() === month.getMonth() && (byDay.get(toIsoDate(d))?.length ?? 0) > 0);

  return (
    <div className="agxGridWrap">
      <div className={`agxProgress${status === "loading" ? " isLoading" : ""}`} aria-hidden="true"><span /></div>
      {status === "error" && (
        <div className="agxBanner isError" role="alert">
          <span>Não foi possível carregar as consultas. Os dias abaixo podem estar incompletos.</span>
          <button className="secondaryButton" onClick={onRetry}>Tentar novamente</button>
        </div>
      )}
      {status === "ready" && !inMonth && <p className="agxBanner">Nenhuma consulta agendada neste mês.</p>}

      <div className="agxScroll">
        <div className="agxMonthHead" aria-hidden="true">{WEEKDAYS.map(w => <span key={w}>{w}</span>)}</div>
        <div className="agxMonth" style={{ ["--agx-rows" as string]: days.length / 7 }}>
          {days.map(d => {
            const list = byDay.get(toIsoDate(d)) ?? [];
            const outside = d.getMonth() !== month.getMonth();
            const b = dayBounds(config, profAtivo, d);
            return (
              <div
                key={d.getTime()}
                className={`agxMonthCell${outside ? " isOutside" : ""}${isSameDay(d, today) ? " isToday" : ""}${isSameDay(d, selectedDay) ? " isSelected" : ""}${b.aberto ? "" : " isClosed"}`}
              >
                <button className="agxMonthDay" onClick={() => onPickDay(d)} aria-label={`Abrir ${d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}${list.length ? `, ${list.length} ${list.length === 1 ? "consulta" : "consultas"}` : ""}`}>
                  <span className="agxMonthNum">{d.getDate()}</span>
                  {!b.aberto && !outside && <span className="agxMonthTag">{b.feriado ? "Feriado" : "Fechado"}</span>}
                </button>
                <ul>
                  {list.slice(0, MAX_CHIPS).map(c => (
                    <li key={c.id}>
                      <button className={`agxChip st-${c.status}`} onClick={() => onSelect(c)} title={`${c.paciente_nome} · ${STATUS_LABEL[c.status]}`}>
                        <time>{formatTime(new Date(c.data_hora))}</time>
                        <span>{c.paciente_nome}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {list.length > MAX_CHIPS && (
                  <button className="agxMore" onClick={() => onPickDay(d)}>+{list.length - MAX_CHIPS} {list.length - MAX_CHIPS === 1 ? "consulta" : "consultas"}</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

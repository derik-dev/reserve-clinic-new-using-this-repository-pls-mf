import { ChevronLeft, ChevronRight } from "lucide-react";
import { capitalize, isSameDay, monthGridDays, toIsoDate } from "@/lib/agenda";

type Props = {
  month: Date;
  today: Date;
  selectedDay: Date;
  /** Quantidade de consultas por dia (YYYY-MM-DD), para o indicador discreto. */
  countsByDay: Map<string, number>;
  onPrev: () => void;
  onNext: () => void;
  onPick: (d: Date) => void;
  onToday: () => void;
};

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

export function MiniCalendar({ month, today, selectedDay, countsByDay, onPrev, onNext, onPick, onToday }: Props) {
  const cells = monthGridDays(month);
  return (
    <section className="agxMini" aria-label="Calendário mensal">
      <header className="agxMiniHead">
        <strong>{capitalize(month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }))}</strong>
        <div>
          <button className="agxIconBtn" aria-label="Mês anterior" onClick={onPrev}><ChevronLeft size={16} /></button>
          <button className="agxIconBtn" aria-label="Próximo mês" onClick={onNext}><ChevronRight size={16} /></button>
        </div>
      </header>
      <div className="agxMiniWeekdays" aria-hidden="true">{WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}</div>
      <div className="agxMiniGrid">
        {cells.map((d) => {
          const outside = d.getMonth() !== month.getMonth();
          const selected = isSameDay(d, selectedDay);
          const count = countsByDay.get(toIsoDate(d)) ?? 0;
          return (
            <button
              key={d.getTime()}
              className={`agxMiniCell${outside ? " isOutside" : ""}${isSameDay(d, today) ? " isToday" : ""}${selected ? " isSelected" : ""}`}
              onClick={() => onPick(d)}
              aria-pressed={selected}
              aria-label={`${d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}${count > 0 ? `, ${count} ${count === 1 ? "consulta" : "consultas"}` : ""}`}
            >
              {d.getDate()}
              {count > 0 && !outside && <span className="agxMiniDot" />}
            </button>
          );
        })}
      </div>
      <button className="agxLinkBtn" onClick={onToday}>Ir para hoje</button>
    </section>
  );
}

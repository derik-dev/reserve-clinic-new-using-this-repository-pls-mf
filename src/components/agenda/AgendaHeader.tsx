import { Plus, Settings } from "lucide-react";
import { capitalize, isSameDay } from "@/lib/agenda";

type Props = {
  selectedDay: Date;
  today: Date;
  onSettings: () => void;
  onNew: () => void;
};

export function AgendaHeader({ selectedDay, today, onSettings, onNew }: Props) {
  const longDate = capitalize(selectedDay.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
  return (
    <header className="agxHeader">
      <div>
        <h1>Agenda</h1>
        <p>{longDate}{isSameDay(selectedDay, today) ? " · Hoje" : ""}</p>
      </div>
      <div className="agxHeaderActions">
        <button className="secondaryButton" onClick={onSettings}><Settings size={16} /> Ajustes</button>
        <button className="primaryButton" onClick={onNew}><Plus size={16} /> Nova consulta</button>
      </div>
    </header>
  );
}

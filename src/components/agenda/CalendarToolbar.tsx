import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import type { AgendaView, StatusCounts } from "@/lib/agenda";
import { AgendaSummary } from "./AgendaSummary";

type Props = {
  view: AgendaView;
  onViewChange: (view: AgendaView) => void;
  periodLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  counts: StatusCounts;
  summaryScope: string;
  filtersOpen: boolean;
  onToggleFilters: () => void;
};

const VIEWS: { id: AgendaView; label: string }[] = [
  { id: "dia", label: "Dia" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
];

const STEP_LABEL: Record<AgendaView, string> = { dia: "dia", semana: "semana", mes: "mês" };

export function CalendarToolbar({ view, onViewChange, periodLabel, onPrev, onNext, onToday, counts, summaryScope, filtersOpen, onToggleFilters }: Props) {
  return (
    <div className="agxToolbar" role="toolbar" aria-label="Navegação da agenda">
      <div className="agxToolbarNav">
        <button className="agxIconBtn" onClick={onPrev} aria-label={`${STEP_LABEL[view][0].toUpperCase()}${STEP_LABEL[view].slice(1)} anterior`}><ChevronLeft size={18} /></button>
        <h2 className="agxPeriod" aria-live="polite">{periodLabel}</h2>
        <button className="agxIconBtn" onClick={onNext} aria-label={`Próximo ${STEP_LABEL[view]}`}><ChevronRight size={18} /></button>
        <button className="agxTodayBtn" onClick={onToday}>Hoje</button>
      </div>
      <AgendaSummary counts={counts} scope={summaryScope} />
      <div className="agxToolbarEnd">
        <button className={`agxFiltersToggle${filtersOpen ? " isActive" : ""}`} onClick={onToggleFilters} aria-expanded={filtersOpen} aria-controls="agx-side">
          <SlidersHorizontal size={16} /> Filtros
        </button>
        <div className="agxSegmented" role="group" aria-label="Visualização">
          {VIEWS.map(v => (
            <button key={v.id} className={`${v.id === "semana" ? "agxHideSm " : ""}${view === v.id ? "isActive" : ""}`} aria-pressed={view === v.id} onClick={() => onViewChange(v.id)}>{v.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

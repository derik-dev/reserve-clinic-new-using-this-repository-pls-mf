"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Consulta } from "@/lib/db";
import {
  PROF_COLORS, addDays, addMonths, capitalize, countByStatus, endOfMonth, groupByDay, startOfDay, startOfMonth, startOfWeek, toIsoDate,
  type AgendaView,
} from "@/lib/agenda";
import type { AgendaData } from "./useAgendaData";
import { AgendaHeader } from "./AgendaHeader";
import { AgendaSettingsModal } from "./AgendaSettingsModal";
import { AppointmentDetails } from "./AppointmentDetails";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarToolbar } from "./CalendarToolbar";
import { MiniCalendar } from "./MiniCalendar";
import { MonthGrid } from "./MonthGrid";
import { ProfessionalFilters } from "./ProfessionalFilters";
import { UpcomingAppointments } from "./UpcomingAppointments";
import { useNow } from "./useNow";

const SHORT_DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

function initialDay(param: string | null) {
  if (param) {
    const d = new Date(`${param}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return startOfDay(d);
  }
  return startOfDay(new Date());
}

/**
 * Agenda: estado de navegação, filtros e composição dos componentes.
 * A fonte de dados é injetada (`useData`) para poder ser trocada em testes.
 */
export function AgendaWorkspace({ useData }: { useData: (selectedDay: Date) => AgendaData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [selectedDay, setSelectedDay] = useState<Date>(() => initialDay(searchParams.get("data")));
  const [calMonth, setCalMonth] = useState<Date>(() => startOfMonth(initialDay(searchParams.get("data"))));
  const [view, setView] = useState<AgendaView>("dia");
  const [profFiltro, setProfFiltro] = useState("todos");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedConsulta, setSelectedConsulta] = useState<Consulta | null>(null);

  const { config, setConfig, profissionais, consultas, status, reload } = useData(selectedDay);
  const nowMs = useNow().getTime();

  function selectDay(d: Date) {
    setSelectedDay(d);
    setCalMonth(startOfMonth(d));
  }

  const profAtivo = profFiltro !== "todos" && profFiltro !== "sem" ? profFiltro : null;

  const filtradas = useMemo(() => {
    if (profFiltro === "todos") return consultas;
    if (profFiltro === "sem") return consultas.filter(c => !c.profissional_id);
    return consultas.filter(c => c.profissional_id === profFiltro);
  }, [consultas, profFiltro]);

  const days = useMemo(() => {
    if (view === "semana") { const start = startOfWeek(selectedDay); return Array.from({ length: 7 }, (_, i) => addDays(start, i)); }
    return [selectedDay];
  }, [view, selectedDay]);

  const { counts, periodLabel, summaryScope } = useMemo(() => {
    let from: Date;
    let to: Date;
    let label: string;
    let scope: string;
    if (view === "dia") {
      from = selectedDay; to = addDays(selectedDay, 1);
      label = selectedDay.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
      scope = "no dia";
    } else if (view === "semana") {
      from = days[0]; to = addDays(days[0], 7);
      const last = days[6];
      label = from.getMonth() === last.getMonth()
        ? `${from.getDate()} – ${last.getDate()} de ${last.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`
        : `${from.toLocaleDateString("pt-BR", SHORT_DATE)} – ${last.toLocaleDateString("pt-BR", { ...SHORT_DATE, year: "numeric" })}`;
      scope = "na semana";
    } else {
      from = startOfMonth(selectedDay); to = addDays(endOfMonth(selectedDay), 1);
      label = capitalize(selectedDay.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
      scope = "no mês";
    }
    const inPeriod = filtradas.filter(c => { const t = new Date(c.data_hora).getTime(); return t >= from.getTime() && t < to.getTime(); });
    return { counts: countByStatus(inPeriod), periodLabel: label, summaryScope: scope };
  }, [view, selectedDay, days, filtradas]);

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const [iso, list] of groupByDay(filtradas)) map.set(iso, list.length);
    return map;
  }, [filtradas]);

  const upcoming = useMemo(() => {
    return filtradas
      .filter(c => new Date(c.data_hora).getTime() >= nowMs && c.status !== "cancelada")
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
      .slice(0, 5);
  }, [filtradas, nowMs]);

  const profColors = useMemo(() => {
    if (profFiltro !== "todos" || profissionais.length < 2) return undefined;
    return new Map(profissionais.map((p, i) => [p.id, PROF_COLORS[i % PROF_COLORS.length]]));
  }, [profFiltro, profissionais]);

  function step(direction: 1 | -1) {
    selectDay(view === "dia" ? addDays(selectedDay, direction) : view === "semana" ? addDays(selectedDay, 7 * direction) : addMonths(selectedDay, direction));
  }

  function openDay(d: Date) {
    selectDay(d);
    setView("dia");
  }

  function createAt(isoDate: string, hora: string) {
    router.push(`/consultas?nova=1&data=${isoDate}&hora=${hora}`);
  }

  function selectUpcoming(c: Consulta) {
    selectDay(startOfDay(new Date(c.data_hora)));
    setSelectedConsulta(c);
  }

  return (
    <div className="agx">
      <AgendaHeader
        selectedDay={selectedDay}
        today={today}
        onSettings={() => setConfigOpen(true)}
        onNew={() => router.push(`/consultas?nova=1&data=${toIsoDate(selectedDay)}`)}
      />

      <div className="agxLayout">
        <aside id="agx-side" className={`agxSide${filtersOpen ? " isOpen" : ""}`}>
          <MiniCalendar
            month={calMonth}
            today={today}
            selectedDay={selectedDay}
            countsByDay={countsByDay}
            onPrev={() => setCalMonth(addMonths(calMonth, -1))}
            onNext={() => setCalMonth(addMonths(calMonth, 1))}
            onPick={selectDay}
            onToday={() => selectDay(today)}
          />
          <ProfessionalFilters profissionais={profissionais} value={profFiltro} onChange={setProfFiltro} />
          <UpcomingAppointments consultas={upcoming} onSelect={selectUpcoming} />
        </aside>

        <section className="agxMain" aria-label="Calendário">
          <CalendarToolbar
            view={view}
            onViewChange={setView}
            periodLabel={periodLabel}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onToday={() => selectDay(today)}
            counts={counts}
            summaryScope={summaryScope}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen(o => !o)}
          />
          {view === "mes" ? (
            <MonthGrid
              month={selectedDay}
              consultas={filtradas}
              config={config}
              profAtivo={profAtivo}
              today={today}
              selectedDay={selectedDay}
              status={status}
              onPickDay={openDay}
              onSelect={setSelectedConsulta}
              onRetry={reload}
            />
          ) : (
            <CalendarGrid
              days={days}
              consultas={filtradas}
              config={config}
              profAtivo={profAtivo}
              today={today}
              status={status}
              profColors={profColors}
              emptyMessage={view === "dia" ? "Nenhuma consulta agendada para este dia." : "Nenhuma consulta agendada para esta semana."}
              onSelect={setSelectedConsulta}
              onCreate={createAt}
              onPickDay={openDay}
              onRetry={reload}
            />
          )}
        </section>
      </div>

      {configOpen && (
        <AgendaSettingsModal
          config={config}
          sqlProfissionais={profissionais}
          onClose={() => setConfigOpen(false)}
          onSaved={(c) => { setConfig(c); setConfigOpen(false); }}
        />
      )}
      {selectedConsulta && (
        <AppointmentDetails
          consulta={selectedConsulta}
          onClose={() => setSelectedConsulta(null)}
          onEdit={() => router.push(`/consultas?editar=${selectedConsulta.id}`)}
        />
      )}
    </div>
  );
}

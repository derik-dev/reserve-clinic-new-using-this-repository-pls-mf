"use client";

import { AgendaWorkspace } from "@/components/agenda/AgendaWorkspace";
import { useAgendaData } from "@/components/agenda/useAgendaData";

export default function AgendaPage() {
  return <AgendaWorkspace useData={useAgendaData} />;
}

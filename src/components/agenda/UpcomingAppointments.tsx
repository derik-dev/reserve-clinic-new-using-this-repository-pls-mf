import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { STATUS_CLASS, STATUS_LABEL, type Consulta } from "@/lib/db";
import { formatTime } from "@/lib/agenda";

type Props = {
  consultas: Consulta[];
  onSelect: (c: Consulta) => void;
};

/** Próximas consultas: seção recolhível, para não ocupar espaço permanente da grade. */
export function UpcomingAppointments({ consultas, onSelect }: Props) {
  return (
    <details className="agxUpcoming">
      <summary>
        <span className="agxSideTitle">Próximas consultas</span>
        <ChevronRight size={16} className="agxUpcomingChevron" aria-hidden="true" />
      </summary>
      {consultas.length === 0 ? (
        <p className="agxMuted">Nenhuma consulta futura.</p>
      ) : (
        <ul>
          {consultas.map(c => {
            const dt = new Date(c.data_hora);
            return (
              <li key={c.id}>
                <button onClick={() => onSelect(c)}>
                  <span className="agxUpcomingWhen">{dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")} · {formatTime(dt)}</span>
                  <strong>{c.paciente_nome}</strong>
                  <span className={`statusBadge ${STATUS_CLASS[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/consultas" className="agxLinkBtn">Ver todas as consultas</Link>
    </details>
  );
}

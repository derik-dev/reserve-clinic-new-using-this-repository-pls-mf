import { STATUS_LABEL, type Consulta } from "@/lib/db";
import { HOUR_PX, formatTime } from "@/lib/agenda";

type Props = {
  consulta: Consulta;
  /** Minutos desde 00:00 em que a consulta começa. */
  start: number;
  /** Primeiro minuto exibido na grade. */
  gridStartMin: number;
  col: number;
  cols: number;
  /** Cor do profissional; só informada quando a grade mostra todos os profissionais. */
  profColor?: string;
  /** Há largura suficiente para mostrar status e detalhes (não só nome e horário). */
  wide: boolean;
  onSelect: (c: Consulta) => void;
};

/** Altura mínima: permite ler nome e horário numa linha só. */
const MIN_HEIGHT = 44;

export function AppointmentCard({ consulta: c, start, gridStartMin, col, cols, profColor, wide, onSelect }: Props) {
  const dt = new Date(c.data_hora);
  const duration = c.duracao_min > 0 ? c.duracao_min : 30;
  const end = new Date(dt.getTime() + duration * 60000);
  const top = ((start - gridStartMin) / 60) * HOUR_PX;
  const height = Math.max(MIN_HEIGHT, (duration / 60) * HOUR_PX - 2);
  const range = `${formatTime(dt)} – ${formatTime(end)}`;
  const meta = [c.servico, c.profissional].filter(Boolean).join(" · ");
  const isRow = height < 56 && cols === 1 && wide;
  const roomy = height >= 64 && cols === 1 && wide;

  return (
    <button
      className={`agxEvent st-${c.status}${isRow ? " isRow" : ""}${roomy ? " isRoomy" : ""}`}
      style={{
        top,
        height,
        left: `calc(${(col / cols) * 100}% + 2px)`,
        width: `calc(${100 / cols}% - 4px)`,
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(c); }}
      aria-label={`${c.paciente_nome}, ${range}, ${STATUS_LABEL[c.status]}${c.profissional ? `, ${c.profissional}` : ""}`}
      title={`${c.paciente_nome}\n${range} · ${STATUS_LABEL[c.status]}${meta ? `\n${meta}` : ""}`}
    >
      <span className="agxEventTitle">
        {profColor && <span className="agxDot" style={{ background: profColor }} aria-hidden="true" />}
        <strong>{c.paciente_nome}</strong>
      </span>
      <span className="agxEventTime">{range}</span>
      {roomy && (
        <span className="agxEventMeta">
          <span>{STATUS_LABEL[c.status]}</span>
          {meta && <span>{meta}</span>}
        </span>
      )}
    </button>
  );
}

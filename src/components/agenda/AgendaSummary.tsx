import type { StatusCounts } from "@/lib/agenda";

type Props = {
  counts: StatusCounts;
  /** Escopo dos números: "no dia", "na semana" ou "no mês". */
  scope: string;
};

/** Resumo compacto do período exibido (substitui o antigo painel lateral de resumo). */
export function AgendaSummary({ counts, scope }: Props) {
  return (
    <dl className="agxSummary" aria-label={`Resumo ${scope}`}>
      <div><dd>{counts.total}</dd><dt>{counts.total === 1 ? "consulta" : "consultas"} {scope}</dt></div>
      <div><dd>{counts.confirmada}</dd><dt>confirmadas</dt></div>
      <div className={counts.aguardando > 0 ? "isPending" : undefined}><dd>{counts.aguardando}</dd><dt>aguardando</dt></div>
      <div><dd>{counts.concluida}</dd><dt>concluídas</dt></div>
    </dl>
  );
}

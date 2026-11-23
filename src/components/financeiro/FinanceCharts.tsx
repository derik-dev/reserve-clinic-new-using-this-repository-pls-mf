import { moneyShort, money, niceMax, type DayPoint, type DoctorRank, type Summary } from "@/lib/financeiro";

/* ── Recebimentos por dia ────────────────────────────────── */

export function DailyBars({ series, monthLabel }: { series: DayPoint[]; monthLabel: string }) {
  const max = niceMax(Math.max(...series.map(p => p.bruto), 0));
  const best = series.reduce((a, p) => (p.bruto > a.bruto ? p : a), series[0]);
  const activeDays = series.filter(p => p.bruto > 0).length;
  const total = series.reduce((sum, p) => sum + p.bruto, 0);
  const lastDay = series.length;
  const showLabel = (day: number) => day === 1 || day === lastDay || (day % 5 === 0 && lastDay - day >= 3);

  return (
    <div className="fnChartBox">
      <div className="fnChart">
        <div className="fnYAxis" aria-hidden="true">
          <span>{moneyShort(max)}</span>
          <span>{moneyShort(max / 2)}</span>
          <span>R$ 0</span>
        </div>
        <div className="fnChartMain">
          <div className="fnPlot" role="img" aria-label={`Recebimentos por dia em ${monthLabel}. Total ${money(total)} em ${activeDays} dias.`}>
            {series.map(p => (
              <div key={p.day} className="fnBarSlot" title={`Dia ${p.day}: ${money(p.bruto)}${p.transacoes ? ` (${p.transacoes} ${p.transacoes === 1 ? "transação" : "transações"})` : ""}`}>
                {p.bruto > 0 && <div className={`fnBar${p === best ? " isBest" : ""}`} style={{ height: `${(p.bruto / max) * 100}%` }} />}
              </div>
            ))}
          </div>
          <div className="fnXAxis" aria-hidden="true">
            {series.map(p => <span key={p.day}>{showLabel(p.day) ? p.day : ""}</span>)}
          </div>
        </div>
      </div>

      <dl className="fnFacts">
        <div><dt>Melhor dia</dt><dd>{best.bruto > 0 ? `dia ${best.day} · ${money(best.bruto)}` : "—"}</dd></div>
        <div><dt>Média por dia com recebimento</dt><dd>{activeDays > 0 ? money(total / activeDays) : "—"}</dd></div>
        <div><dt>Dias com recebimento</dt><dd>{activeDays} de {lastDay}</dd></div>
      </dl>
    </div>
  );
}

/* ── Quem procurou a clínica ─────────────────────────────── */

export function RequestsFunnel({ summary }: { summary: Summary }) {
  const total = summary.solicitacoes;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const rows = [
    { key: "paid", label: "Pagas (confirmadas ou concluídas)", n: summary.pagas },
    { key: "wait", label: "Aguardando confirmação", n: summary.aguardando },
    { key: "cancel", label: "Canceladas", n: summary.canceladas },
  ];

  return (
    <div>
      <p className="fnHeadline">
        <strong>{summary.pessoas}</strong> {summary.pessoas === 1 ? "pessoa procurou" : "pessoas procuraram"} a clínica
      </p>
      <p className="fnSub">{total} {total === 1 ? "consulta solicitada" : "consultas solicitadas"} · {pct(summary.pagas)}% viraram consulta paga</p>

      <ul className="fnFunnel">
        {rows.map(r => (
          <li key={r.key}>
            <div className="fnFunnelHead">
              <span>{r.label}</span>
              <span><strong>{r.n}</strong> <small>({pct(r.n)}%)</small></span>
            </div>
            <div className="fnTrack" role="img" aria-label={`${r.label}: ${r.n} de ${total}`}>
              <div className={`fnFill is-${r.key}`} style={{ width: `${pct(r.n)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Médicos mais procurados ─────────────────────────────── */

export function DoctorRanking({ ranking }: { ranking: DoctorRank[] }) {
  const top = ranking.slice(0, 5);
  const max = top[0]?.consultas ?? 1;
  const total = ranking.reduce((sum, r) => sum + r.consultas, 0);

  return (
    <ol className="fnRank">
      {top.map((r, i) => (
        <li key={r.key}>
          <div className="fnRankHead">
            <span className="fnRankName"><span className="fnRankPos">{i + 1}º</span> {r.nome}{i === 0 && ranking.length > 1 && <em>Mais procurado</em>}</span>
            <span><strong>{r.consultas}</strong> {r.consultas === 1 ? "consulta" : "consultas"} <small>({Math.round((r.consultas / total) * 100)}%)</small></span>
          </div>
          <div className="fnTrack" role="img" aria-label={`${r.nome}: ${r.consultas} de ${total} consultas`}>
            <div className="fnFill is-rank" style={{ width: `${(r.consultas / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

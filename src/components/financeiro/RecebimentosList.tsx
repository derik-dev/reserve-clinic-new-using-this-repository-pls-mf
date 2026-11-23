"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { money, netOf, type ConsultaFin } from "@/lib/financeiro";

type Props = {
  /** Consultas pagas do mês, da mais recente para a mais antiga. */
  rows: ConsultaFin[];
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
};

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

/** Recebimentos do mês numa lista com rolagem interna e busca por paciente, médico ou serviço. */
export function RecebimentosList({ rows, loading, failed, onRetry }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return rows;
    return rows.filter(r => fold([r.paciente_nome, r.profissional, r.servico].filter(Boolean).join(" ")).includes(q));
  }, [rows, query]);

  const totals = useMemo(() => ({
    bruto: filtered.reduce((sum, r) => sum + Number(r.valor ?? 0), 0),
    liquido: filtered.reduce((sum, r) => sum + netOf(r), 0),
  }), [filtered]);

  const filtering = query.trim() !== "";

  return (
    <section className="dxCard fnList" aria-labelledby="fn-recebimentos">
      <div className="fnListInner">
      <div className="dxCardHead">
        <h2 id="fn-recebimentos">Recebimentos</h2>
        <label className="fnSearch">
          <Search size={16} aria-hidden="true" />
          <input type="search" placeholder="Buscar paciente ou médico" aria-label="Buscar recebimento por paciente, médico ou serviço" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
      </div>

      {failed ? (
        <div className="dxEmpty" role="alert">
          <strong>Não foi possível carregar os recebimentos</strong>
          <button className="dxCardLink" onClick={onRetry}>Tentar novamente</button>
        </div>
      ) : loading ? (
        <div className="dxSkeleton" aria-busy="true" aria-label="Carregando"><span /><span /><span /></div>
      ) : rows.length === 0 ? (
        <div className="dxEmpty">
          <strong>Nenhum recebimento neste mês</strong>
          <p>Consultas confirmadas ou concluídas aparecem aqui.</p>
        </div>
      ) : (
        <>
          <div className="fnListHead" aria-hidden="true"><span>Data</span><span>Paciente</span><span>Bruto</span><span>Líquido</span></div>
          <div className="fnListBody" tabIndex={0} role="table" aria-label="Recebimentos do mês">
            {filtered.length === 0 ? (
              <p className="fnListEmpty">Nenhum recebimento encontrado para “{query.trim()}”.</p>
            ) : filtered.map(r => (
              <div key={r.id} className="fnListRow" role="row">
                <span className="fnListDate" role="cell">{shortDate(r.data_hora)}</span>
                <span className="fnWho" role="cell">
                  <strong>{r.paciente_nome}</strong>
                  <small>{[r.profissional, r.servico].filter(Boolean).join(" · ") || "—"}</small>
                </span>
                <span className="dxAmount" role="cell">{r.valor != null && Number(r.valor) > 0 ? money(Number(r.valor)) : "—"}</span>
                <span className="dxAmount isNet" role="cell">{r.valor != null && Number(r.valor) > 0 ? money(netOf(r)) : "—"}</span>
              </div>
            ))}
          </div>
          <div className="fnListFoot">
            <span>{filtering ? `Total do filtro · ${filtered.length} de ${rows.length}` : `Total do mês · ${rows.length} ${rows.length === 1 ? "recebimento" : "recebimentos"}`}</span>
            <span className="dxAmount">{money(totals.bruto)}</span>
            <span className="dxAmount isNet">{money(totals.liquido)}</span>
          </div>
        </>
      )}
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, capitalize, startOfMonth } from "@/lib/agenda";
import {
  ASAAS_FEE, TRANSFER_STATUS, dailySeries, doctorRanking, isPaid, money, percentChange, summarize,
} from "@/lib/financeiro";
import { DailyBars, DoctorRanking, RequestsFunnel } from "@/components/financeiro/FinanceCharts";
import { RecebimentosList } from "@/components/financeiro/RecebimentosList";
import { WithdrawDialog } from "@/components/financeiro/WithdrawDialog";
import { useFinanceiro } from "@/components/financeiro/useFinanceiro";

const shortDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

export default function FinanceiroPage() {
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const { atual, anterior, revenueLoading, revenueFailed, wallet, walletLoading, perfil, reload } = useFinanceiro(month);

  const summary = useMemo(() => summarize(atual), [atual]);
  const previous = useMemo(() => summarize(anterior), [anterior]);
  const series = useMemo(() => dailySeries(atual, month), [atual, month]);
  const ranking = useMemo(() => doctorRanking(atual), [atual]);
  const recebimentos = useMemo(() => atual.filter(isPaid).sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()), [atual]);

  const monthLabel = capitalize(month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
  const previousName = addMonths(month, -1).toLocaleDateString("pt-BR", { month: "long" });
  const change = percentChange(summary.bruto, previous.bruto);
  const canWithdraw = !walletLoading && wallet.balance !== null && wallet.balance > 0;
  const tx = `${summary.transacoes} ${summary.transacoes === 1 ? "transação" : "transações"}`;

  const skeleton = <div className="dxSkeleton" aria-busy="true" aria-label="Carregando"><span /><span /><span /></div>;
  const failed = (
    <div className="dxEmpty" role="alert">
      <strong>Não foi possível carregar os dados</strong>
      <button className="dxCardLink" onClick={reload}>Tentar novamente</button>
    </div>
  );
  const openWithdraw = () => { setNotice(""); setDialogOpen(true); };

  return <>
    <header className="dxHeader">
      <div>
        <h1>Financeiro</h1>
        <p className="dxMeta">Quanto entrou, quanto fica para a clínica e quem está procurando</p>
      </div>
      <div className="dxMonthNav" role="group" aria-label="Mês exibido">
        <button className="dxIconBtn" onClick={() => setMonth(addMonths(month, -1))} aria-label="Mês anterior"><ChevronLeft size={18} /></button>
        <strong aria-live="polite">{monthLabel}</strong>
        <button className="dxIconBtn" onClick={() => setMonth(addMonths(month, 1))} aria-label="Próximo mês"><ChevronRight size={18} /></button>
      </div>
    </header>

    {notice && <p className="dxNotice" role="status"><Check size={16} /> {notice}</p>}

    {/* Bruto − taxa = líquido, e o saldo para sacar */}
    <div className="fnTop">
      <section className="dxCard fnEquation" aria-label="Valor bruto, taxa da Asaas e valor líquido">
        {revenueFailed ? failed : (
          <>
            <div className="fnTerm">
              <span className="fnLabel">Valor bruto</span>
              <strong className="fnValue">{revenueLoading ? "—" : money(summary.bruto)}</strong>
              <span className="fnHint">Pago pelos pacientes · {tx}</span>
              {!revenueLoading && (
                <span className={`fnDelta${change === null ? "" : change >= 0 ? " isUp" : " isDown"}`}>
                  {change === null ? `Sem recebimentos em ${previousName} para comparar` : `${change >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(change))}% em relação a ${previousName}`}
                </span>
              )}
            </div>
            <span className="fnOp" aria-hidden="true">−</span>
            <div className="fnTerm">
              <span className="fnLabel">Taxa da Asaas</span>
              <strong className="fnValue">{revenueLoading ? "—" : money(summary.taxa)}</strong>
              <span className="fnHint">{money(ASAAS_FEE)} em cada uma das {tx}</span>
            </div>
            <span className="fnOp" aria-hidden="true">=</span>
            <div className="fnTerm isResult">
              <span className="fnLabel">Valor líquido</span>
              <strong className="fnValue">{revenueLoading ? "—" : money(summary.liquido)}</strong>
              <span className="fnHint">O que realmente fica para a clínica</span>
            </div>
          </>
        )}
      </section>

      <section className="dxCard fnBalance" aria-label="Saldo disponível para saque">
        <div className="fnTerm">
          <span className="fnLabel">Disponível para sacar</span>
          <strong className="fnValue">{walletLoading ? "—" : wallet.balance === null ? "Indisponível" : money(wallet.balance)}</strong>
          <span className="fnHint">{wallet.balanceError && !walletLoading ? wallet.balanceError : "Já descontados os saques feitos"}</span>
        </div>
        <button className="primaryButton" onClick={openWithdraw} disabled={walletLoading}><ArrowDownToLine size={16} /> Sacar</button>
      </section>
    </div>

    {/* Gráfico e recebimentos, lado a lado e com a mesma altura */}
    <div className="fnMid">
      <section className="dxCard" aria-labelledby="fn-grafico">
        <div className="dxCardHead">
          <h2 id="fn-grafico">Recebimentos por dia<small>valor bruto</small></h2>
        </div>
        <div className="dxCardBody fnFill1">
          {revenueFailed ? failed : revenueLoading ? skeleton : summary.bruto === 0 ? (
            <div className="dxEmpty fnEmptyInline">
              <strong>Nenhum recebimento neste mês</strong>
              <p>Quando houver consultas confirmadas ou concluídas, o gráfico mostra quanto entrou em cada dia.</p>
            </div>
          ) : <DailyBars series={series} monthLabel={monthLabel} />}
        </div>
      </section>

      <RecebimentosList rows={recebimentos} loading={revenueLoading} failed={revenueFailed} onRetry={reload} />
    </div>

    {/* Procura, médicos e saques */}
    <div className="fnBottom">
      <section className="dxCard" aria-labelledby="fn-procura">
        <div className="dxCardHead"><h2 id="fn-procura">Procura pela clínica</h2></div>
        <div className="dxCardBody">
          {revenueFailed ? failed : revenueLoading ? skeleton : summary.solicitacoes === 0 ? (
            <div className="dxEmpty fnEmptyInline">
              <strong>Nenhuma consulta solicitada neste mês</strong>
              <p>Aqui aparece quantas pessoas procuraram a clínica.</p>
            </div>
          ) : <RequestsFunnel summary={summary} />}
        </div>
      </section>

      <section className="dxCard" aria-labelledby="fn-medicos">
        <div className="dxCardHead"><h2 id="fn-medicos">Médicos mais procurados</h2></div>
        <div className="dxCardBody">
          {revenueFailed ? failed : revenueLoading ? skeleton : ranking.length === 0 ? (
            <div className="dxEmpty fnEmptyInline">
              <strong>Sem consultas para comparar</strong>
              <p>O ranking mostra quais médicos receberam mais consultas.</p>
            </div>
          ) : <DoctorRanking ranking={ranking} />}
        </div>
      </section>

      <section className="dxCard fnSaques" aria-labelledby="fn-saques">
        <div className="dxCardHead">
          <h2 id="fn-saques">Saques</h2>
          {canWithdraw && <button className="dxCardLink" onClick={openWithdraw}>Solicitar saque</button>}
        </div>
        {wallet.transfersError && !walletLoading ? (
          <div className="dxEmpty" role="alert">
            <strong>Não foi possível carregar os saques</strong>
            <p>{wallet.transfersError}</p>
            <button className="dxCardLink" onClick={reload}>Tentar novamente</button>
          </div>
        ) : walletLoading ? skeleton : wallet.transfers.length === 0 ? (
          <div className="dxEmpty">
            <strong>Nenhum saque realizado</strong>
            <p>Quando você solicitar um saque, ele aparece aqui.</p>
          </div>
        ) : (
          <div className="fnSaquesList">
            {wallet.transfers.map(t => {
              const status = TRANSFER_STATUS[t.status] ?? { label: t.status, cls: "statusConcluida" };
              return (
                <div key={t.id} className="dxRow dxRowMoney">
                  <span className="dxDate">{t.date ? shortDate(t.date) : "—"}</span>
                  <em className={`statusBadge ${status.cls}`}>{status.label}</em>
                  <strong className="dxAmount">{money(t.value)}</strong>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>

    {dialogOpen && (
      <WithdrawDialog
        available={wallet.balance}
        chave={perfil}
        onClose={() => setDialogOpen(false)}
        onDone={() => { setDialogOpen(false); setNotice("Saque solicitado. Ele aparece no histórico assim que o banco confirmar."); reload(); }}
      />
    )}
  </>;
}

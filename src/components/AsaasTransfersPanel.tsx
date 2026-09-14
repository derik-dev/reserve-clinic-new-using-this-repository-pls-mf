"use client";

import { ArrowDownToLine, Check, Clock3, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Transfer = { id: string; value: number; status: string; date: string | null };

const statusLabel: Record<string, string> = { PENDING: "Pendente", DONE: "Concluído", FAILED: "Falhou", CANCELLED: "Cancelado", BLOCKED: "Bloqueado", IN_BANK_PROCESSING: "Em processamento" };
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function AsaasTransfersPanel() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  const authHeaders = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : null;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await authHeaders();
      if (!headers) throw new Error("Sessão expirada. Entre novamente.");
      const [balanceRes, transferRes] = await Promise.all([fetch("/api/saldo-asaas", { headers }), fetch("/api/transferencias", { headers })]);
      const balanceBody = await balanceRes.json();
      const transferBody = await transferRes.json();
      if (!balanceRes.ok) throw new Error(balanceBody.error ?? "Não foi possível consultar o saldo.");
      if (!transferRes.ok) throw new Error(transferBody.error ?? "Não foi possível consultar os saques.");
      setBalance(Number(balanceBody.balance));
      setTransfers(transferBody.transfers ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar os dados financeiros.");
    } finally { setLoading(false); }
  }, [authHeaders]);

  useEffect(() => { void load(); }, [load]);

  async function withdraw() {
    const numericValue = Number(value.replace(",", "."));
    if (!Number.isFinite(numericValue) || numericValue <= 0) { setError("Informe um valor maior que zero."); return; }
    setSubmitting(true); setError(""); setSuccess("");
    try {
      const headers = await authHeaders();
      if (!headers) throw new Error("Sessão expirada. Entre novamente.");
      const response = await fetch("/api/sacar", { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ value: numericValue }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Não foi possível solicitar o saque.");
      setModal(false); setValue(""); setSuccess("Saque solicitado. Atualizando o histórico...");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível solicitar o saque."); }
    finally { setSubmitting(false); }
  }

  return <section className="financePanel" aria-labelledby="finance-title">
    <header className="financePanelHeader">
      <div><span className="financeEyebrow">Financeiro</span><strong id="finance-title">Saldo disponível</strong><small>Valor disponível para transferência via Pix</small></div>
      <button className="primaryButton" onClick={() => { setError(""); setModal(true); }}><ArrowDownToLine size={15} /> Sacar</button>
    </header>
    <div className="financeBalanceRow"><strong>{loading ? "..." : balance === null ? "—" : money(balance)}</strong><button className="iconButton" onClick={() => void load()} aria-label="Atualizar saldo"><RefreshCw size={15} /></button></div>
    {success && <p className="financeSuccess"><Check size={14} /> {success}</p>}
    {error && !modal && <p className="financeError">{error}</p>}
    <div className="financeHistoryHead"><strong>Últimas transferências</strong><span>{transfers.length} registros</span></div>
    {transfers.length === 0 && !loading ? <p className="financeEmpty">Nenhuma transferência encontrada.</p> : <ul className="financeTransferList">{transfers.map((transfer) => <li key={transfer.id}><span className={`financeStatus financeStatus-${transfer.status.toLowerCase()}`}>{transfer.status === "DONE" ? <Check size={13} /> : transfer.status === "PENDING" ? <Clock3 size={13} /> : <X size={13} />}{statusLabel[transfer.status] ?? transfer.status}</span><strong>{money(transfer.value)}</strong><small>{transfer.date ? new Date(transfer.date).toLocaleDateString("pt-BR") : "Data não informada"}</small></li>)}</ul>}
    {modal && <div className="modalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}><div className="modalCard financeModal" role="dialog" aria-modal="true" aria-labelledby="withdraw-title"><header className="modalHeader"><h2 id="withdraw-title">Solicitar saque</h2><button className="iconButton" onClick={() => setModal(false)} aria-label="Fechar"><X size={16} /></button></header><div className="modalBody"><p className="financeModalIntro">O valor será enviado para a chave Pix de destino configurada no servidor.</p><label className="formRow"><span>Valor do saque (R$)</span><input autoFocus inputMode="decimal" placeholder="0,00" value={value} onChange={(event) => setValue(event.target.value)} /></label>{error && <p className="financeError">{error}</p>}</div><footer className="modalFooter"><button className="secondaryButton" onClick={() => setModal(false)}>Cancelar</button><button className="primaryButton" onClick={() => void withdraw()} disabled={submitting}>{submitting ? "Solicitando..." : "Confirmar saque"}</button></footer></div></div>}
  </section>;
}

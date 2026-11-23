"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import styles from "./booking.module.css";

type Props = {
  agendamentoId: string;
  nome: string;
  cpf: string;
  email: string;
  valor: number;
  onPaid: () => void;
};

type PixData = { pixId: string; qrCodeBase64: string; copiaECola: string };

const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const POLL_MS = 4000;
const SHOW_SIMULATOR = process.env.NODE_ENV !== "production";

/**
 * Pix do agendamento: o QR Code é gerado pelo sistema (o paciente não envia nada).
 * Quando o pagamento é confirmado, a tela avisa sozinha via `onPaid`.
 */
export function BookingPix({ agendamentoId, nome, cpf, email, valor, onPaid }: Props) {
  const [pix, setPix] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [simulating, setSimulating] = useState(false);

  // Sobrevive ao ciclo duplo de efeitos do modo de desenvolvimento sem gerar duas cobranças.
  const alive = useRef(true);
  const started = useRef(-1);
  const paidRef = useRef(false);
  const onPaidRef = useRef(onPaid);
  useEffect(() => { onPaidRef.current = onPaid; }, [onPaid]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  useEffect(() => {
    if (started.current === attempt) return;
    started.current = attempt;
    (async () => {
      try {
        const res = await fetch("/api/criar-pagamento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agendamentoId, clienteNome: nome, clienteCpf: cpf, clienteEmail: email }),
        });
        const body = await res.json().catch(() => ({})) as Partial<PixData> & { error?: string };
        if (!alive.current) return;
        if (!res.ok || !body.qrCodeBase64 || !body.copiaECola) throw new Error(body.error ?? "Não foi possível gerar o Pix.");
        setPix(body as PixData);
        setError("");
      } catch (e) {
        if (alive.current) setError(e instanceof Error ? e.message : "Não foi possível gerar o Pix.");
      } finally {
        if (alive.current) setLoading(false);
      }
    })();
  }, [attempt, agendamentoId, nome, cpf, email]);

  async function checkStatus() {
    if (paidRef.current) return;
    try {
      const res = await fetch(`/api/status-agendamento?id=${agendamentoId}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({})) as { status?: string };
      if (res.ok && body.status === "confirmado" && !paidRef.current && alive.current) {
        paidRef.current = true;
        onPaidRef.current();
      }
    } catch { /* tenta de novo no próximo ciclo */ }
  }

  useEffect(() => {
    if (!pix) return;
    const id = setInterval(checkStatus, POLL_MS);
    return () => clearInterval(id);
  }, [pix]); // eslint-disable-line react-hooks/exhaustive-deps

  async function copy() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.copiaECola);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* o código também está visível para copiar à mão */ }
  }

  async function simulate() {
    setSimulating(true);
    try {
      await fetch("/api/simular-pagamento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agendamentoId }) });
      await checkStatus();
    } finally { setSimulating(false); }
  }

  if (error) {
    return (
      <div className={styles.pixBox} role="alert">
        <p className={styles.errorText}>{error}</p>
        <button type="button" className={styles.primaryBtn} onClick={() => { setError(""); setLoading(true); setAttempt(a => a + 1); }}>Tentar de novo</button>
      </div>
    );
  }

  if (loading || !pix) {
    return (
      <div className={styles.pixBox} aria-busy="true">
        <div className={styles.qrSkeleton} />
        <p className={styles.hint}>Gerando seu Pix…</p>
      </div>
    );
  }

  return (
    <div className={styles.pixBox}>
      <p className={styles.pixAmount}>{money(valor)}</p>
      <div className={styles.qr}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code do Pix para pagamento" width={220} height={220} />
      </div>
      <p className={styles.hint}>Abra o app do seu banco, escolha Pix e leia o QR Code.</p>
      <button type="button" className={styles.secondaryBtn} onClick={copy}>
        {copied ? <><Check size={16} aria-hidden="true" /> Código copiado</> : <><Copy size={16} aria-hidden="true" /> Copiar código Pix</>}
      </button>
      <p className={styles.waiting} role="status"><Loader2 size={16} className={styles.spin} aria-hidden="true" /> Aguardando o pagamento. Esta tela atualiza sozinha.</p>
      {SHOW_SIMULATOR && (
        <button type="button" className={styles.devBtn} onClick={simulate} disabled={simulating}>{simulating ? "Simulando…" : "Simular pagamento (apenas em testes)"}</button>
      )}
    </div>
  );
}

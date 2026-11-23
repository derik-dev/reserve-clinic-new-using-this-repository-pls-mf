"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { authHeaders, money, type PerfilPix } from "@/lib/financeiro";
import { PIX_KEY_TYPES, emCarencia, formatLiberacao, liberadaEm, maskPixKeyValue } from "@/lib/pixKey";

type Props = {
  /** Saldo disponível; null quando não foi possível consultar. */
  available: number | null;
  /** Chave Pix salva no perfil; null enquanto carrega. */
  chave: PerfilPix | null;
  onClose: () => void;
  onDone: () => void;
};

function parseAmount(raw: string) {
  const n = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function WithdrawDialog({ available, chave, onClose, onDone }: Props) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !submitting) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const temChave = !!chave?.chave_pix && !!chave.tipo_chave_pix;
  const libera = liberadaEm(chave?.chave_pix_alterada_em);
  const bloqueada = temChave && emCarencia(chave?.chave_pix_alterada_em);
  const tipoLabel = PIX_KEY_TYPES.find(t => t.value === chave?.tipo_chave_pix)?.label ?? "Chave";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const value = parseAmount(amount);
    if (!Number.isFinite(value) || value <= 0) { setError("Informe um valor maior que zero."); return; }
    if (Math.round(value * 100) !== value * 100) { setError("O valor deve ter no máximo duas casas decimais."); return; }
    if (available !== null && value > available) { setError(`O valor é maior que o saldo disponível (${money(available)}).`); return; }
    if (!temChave) { setError("Cadastre sua chave Pix em Configurações antes de sacar."); return; }
    if (bloqueada && libera) { setError(`Sua chave Pix só poderá receber saques a partir de ${formatLiberacao(libera)}.`); return; }

    setSubmitting(true);
    try {
      const headers = await authHeaders();
      if (!headers) throw new Error("Sessão expirada. Entre novamente.");
      const res = await fetch("/api/sacar", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Não foi possível solicitar o saque.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível solicitar o saque.");
      setSubmitting(false);
    }
  }

  return (
    <div className="modalBackdrop" onClick={() => { if (!submitting) onClose(); }}>
      <form className="dxDialog" role="dialog" aria-modal="true" aria-labelledby="dx-withdraw-title" onClick={e => e.stopPropagation()} onSubmit={submit} noValidate>
        <header>
          <div>
            <h2 id="dx-withdraw-title">Solicitar saque</h2>
            <p>{available === null ? "Saldo indisponível no momento." : `Disponível: ${money(available)}`}</p>
          </div>
          <button type="button" className="dxIconBtn" onClick={onClose} disabled={submitting} aria-label="Fechar"><X size={18} /></button>
        </header>

        <div className="dxDialogBody">
          <label className="dxField">
            <span>Valor do saque</span>
            <input ref={inputRef} inputMode="decimal" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} autoComplete="off" />
          </label>

          {!temChave ? (
            <p className="dxNote">
              Para sacar, cadastre sua chave Pix uma vez em <Link href="/configuracoes">Configurações &gt; Chave Pix</Link>. O saque sempre vai para a chave cadastrada.
            </p>
          ) : (
            <div className="dxField">
              <span>Chave Pix de destino</span>
              <p className="dxNote" style={{ margin: 0 }}>
                <strong>{tipoLabel}: {maskPixKeyValue(chave?.tipo_chave_pix, chave?.chave_pix)}</strong>
                {bloqueada && libera
                  ? <><br />Chave nova: liberada para saque em <strong>{formatLiberacao(libera)}</strong>.</>
                  : <><br />Para trocar a chave, vá em <Link href="/configuracoes">Configurações &gt; Chave Pix</Link>.</>}
              </p>
            </div>
          )}

          {error && <p className="dxFormError" role="alert">{error}</p>}
        </div>

        <footer>
          <button type="button" className="secondaryButton" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button type="submit" className="primaryButton" disabled={submitting || !temChave || bloqueada}>{submitting ? "Solicitando…" : "Confirmar saque"}</button>
        </footer>
      </form>
    </div>
  );
}

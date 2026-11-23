"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { authHeaders, maskPixKey, money, type PixKeyOption } from "@/lib/financeiro";

type Props = {
  /** Saldo disponível; null quando não foi possível consultar. */
  available: number | null;
  options: PixKeyOption[];
  onClose: () => void;
  onDone: () => void;
};

function parseAmount(raw: string) {
  const n = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function WithdrawDialog({ available, options, onClose, onDone }: Props) {
  const [amount, setAmount] = useState("");
  const [keyId, setKeyId] = useState(options[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !submitting) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const option = options.find(o => o.id === keyId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const value = parseAmount(amount);
    if (!Number.isFinite(value) || value <= 0) { setError("Informe um valor maior que zero."); return; }
    if (Math.round(value * 100) !== value * 100) { setError("O valor deve ter no máximo duas casas decimais."); return; }
    if (available !== null && value > available) { setError(`O valor é maior que o saldo disponível (${money(available)}).`); return; }
    if (!option) { setError("Escolha a chave Pix de destino."); return; }

    setSubmitting(true);
    try {
      const headers = await authHeaders();
      if (!headers) throw new Error("Sessão expirada. Entre novamente.");
      const res = await fetch("/api/sacar", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ value, pixAddressKey: option.value, pixAddressKeyType: option.type }),
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

          {options.length === 0 ? (
            <p className="dxNote">
              Para sacar, cadastre o CPF/CNPJ, e-mail ou telefone da clínica em <Link href="/configuracoes">Configurações</Link>. O Pix só pode ser enviado a uma chave do próprio cadastro.
            </p>
          ) : (
            <fieldset className="dxField dxChoices">
              <legend>Chave Pix de destino</legend>
              {options.map(o => (
                <label key={o.id} className={`dxChoice${keyId === o.id ? " isActive" : ""}`}>
                  <input type="radio" name="pix-key" value={o.id} checked={keyId === o.id} onChange={() => setKeyId(o.id)} />
                  <span>{o.label}</span>
                  <strong>{maskPixKey(o)}</strong>
                </label>
              ))}
              <small>O Pix só pode ser enviado a uma chave do cadastro da clínica.</small>
            </fieldset>
          )}

          {error && <p className="dxFormError" role="alert">{error}</p>}
        </div>

        <footer>
          <button type="button" className="secondaryButton" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button type="submit" className="primaryButton" disabled={submitting || options.length === 0}>{submitting ? "Solicitando…" : "Confirmar saque"}</button>
        </footer>
      </form>
    </div>
  );
}

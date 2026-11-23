"use client";

import { Check, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { authHeaders } from "@/lib/financeiro";
import {
  PIX_GRACE_HOURS, PIX_KEY_TYPES, emCarencia, formatLiberacao, isPixKeyType, liberadaEm, maskPixKeyValue, pixKeyFormatError, type PixKeyType,
} from "@/lib/pixKey";
import { supabase } from "@/lib/supabase";

type Salva = { chave_pix: string | null; tipo_chave_pix: string | null; chave_pix_alterada_em: string | null };

const PLACEHOLDER: Record<PixKeyType, string> = {
  CPF: "000.000.000-00",
  CNPJ: "00.000.000/0000-00",
  EMAIL: "voce@email.com.br",
  PHONE: "(47) 99999-9999",
  EVP: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
};

export function ChavePixSection() {
  const [salva, setSalva] = useState<Salva | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<PixKeyType>("CPF");
  const [chave, setChave] = useState("");
  const [senha, setSenha] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setLoading(false); return; }
    const { data } = await supabase.from("perfis").select("chave_pix, tipo_chave_pix, chave_pix_alterada_em").eq("id", auth.user.id).maybeSingle();
    setSalva((data as Salva | null) ?? null);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const temChave = !!salva?.chave_pix && isPixKeyType(salva.tipo_chave_pix);
  const libera = liberadaEm(salva?.chave_pix_alterada_em);
  const carencia = temChave && emCarencia(salva?.chave_pix_alterada_em);
  const tipoSalvo = PIX_KEY_TYPES.find((t) => t.value === salva?.tipo_chave_pix)?.label;

  async function salvar() {
    setError(""); setOk(false);
    const formato = pixKeyFormatError(tipo, chave);
    if (formato) { setError(formato); return; }
    if (!senha) { setError("Digite sua senha para confirmar."); return; }
    setSaving(true);
    try {
      const headers = await authHeaders();
      if (!headers) throw new Error("Sessão expirada. Entre novamente.");
      const res = await fetch("/api/chave-pix", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ tipoChave: tipo, chave, senha }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Não foi possível salvar a chave agora.");
      setChave(""); setSenha(""); setOk(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar a chave agora.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cfgSection">
      <div className="cfgSectionHead">
        <strong>Chave Pix para saque</strong>
        <small>Seus saques sempre vão para esta chave. Ela precisa estar no seu CPF/CNPJ.</small>
      </div>

      {loading ? <p className="ajustesHint">Carregando…</p> : (
        <>
          {temChave ? (
            <div className="dxNote" role="status">
              <strong>{tipoSalvo}: {maskPixKeyValue(salva?.tipo_chave_pix, salva?.chave_pix)}</strong>
              <br />
              {carencia && libera
                ? <>Liberada para saque em <strong>{formatLiberacao(libera)}</strong>. Até lá, o saque fica bloqueado.</>
                : <><Check size={13} style={{ verticalAlign: "-2px" }} /> Liberada para saque.</>}
            </div>
          ) : (
            <div className="dxNote" role="status">Você ainda não cadastrou uma chave Pix. Cadastre abaixo para poder sacar.</div>
          )}

          <div className="formGrid" style={{ marginTop: 16 }}>
            <p className="ajustesHint" style={{ margin: 0 }}>
              {temChave ? "Trocar a chave" : "Cadastrar a chave"}: a chave nova só pode receber saques {PIX_GRACE_HOURS} horas depois de salva, e a troca pede sua senha.
            </p>
            <div className="formRow split">
              <div className="formRow">
                <label htmlFor="pix-tipo">Tipo da chave</label>
                <select id="pix-tipo" value={tipo} onChange={(e) => { setTipo(e.target.value as PixKeyType); setError(""); }}>
                  {PIX_KEY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="formRow">
                <label htmlFor="pix-chave">Chave Pix</label>
                <input id="pix-chave" value={chave} onChange={(e) => { setChave(e.target.value); setError(""); }} placeholder={PLACEHOLDER[tipo]} autoComplete="off" />
              </div>
            </div>
            <div className="formRow">
              <label htmlFor="pix-senha">Sua senha de login</label>
              <input id="pix-senha" type="password" value={senha} onChange={(e) => { setSenha(e.target.value); setError(""); }} placeholder="Digite para confirmar" autoComplete="current-password" />
            </div>
          </div>

          {error && <div className="onboardingError" style={{ marginTop: 16 }} role="alert">{error}</div>}
          <div className="cfgFooter">
            <button className="primaryButton" disabled={saving || !chave.trim() || !senha} onClick={salvar}>
              {ok ? <><Check size={15} /> Chave salva</> : saving ? "Verificando…" : <><ShieldCheck size={15} /> Salvar chave Pix</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

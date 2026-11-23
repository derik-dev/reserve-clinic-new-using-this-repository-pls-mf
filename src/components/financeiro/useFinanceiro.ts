"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { endOfMonth } from "@/lib/agenda";
import { CONSULTA_FIN_COLUMNS, authHeaders, type ConsultaFin, type PerfilPix, type Transfer } from "@/lib/financeiro";

type RevenueResult = { key: string; atual: ConsultaFin[]; anterior: ConsultaFin[]; failed: boolean };
type WalletResult = { key: string; balance: number | null; balanceError: string; transfers: Transfer[]; transfersError: string };

const SESSION_EXPIRED = "Sessão expirada. Entre novamente.";
const PAGE_SIZE = 1000;

/**
 * Dados do financeiro: consultas do mês e do mês anterior (para comparação), saldo
 * disponível para saque, histórico de saques e as chaves Pix do perfil. O carregamento
 * é derivado: enquanto o resultado guardado não for o da busca atual, está carregando.
 */
export function useFinanceiro(month: Date) {
  const [reloadToken, setReloadToken] = useState(0);
  const [revenue, setRevenue] = useState<RevenueResult>({ key: "", atual: [], anterior: [], failed: false });
  const [wallet, setWallet] = useState<WalletResult>({ key: "", balance: null, balanceError: "", transfers: [], transfersError: "" });
  const [perfil, setPerfil] = useState<PerfilPix | null>(null);

  const monthMs = month.getTime();
  const revenueKey = `${monthMs}:${reloadToken}`;
  const walletKey = String(reloadToken);

  useEffect(() => {
    let cancelled = false;
    const from = new Date(monthMs);
    const prevFrom = new Date(from.getFullYear(), from.getMonth() - 1, 1);
    const to = endOfMonth(from);
    const failed = () => { if (!cancelled) setRevenue({ key: revenueKey, atual: [], anterior: [], failed: true }); };

    (async () => {
      // Os totais precisam de todas as linhas: busca em páginas (o servidor limita cada resposta).
      const rows: ConsultaFin[] = [];
      for (let page = 0; ; page++) {
        const { data, error } = await supabase.from("consultas")
          .select(CONSULTA_FIN_COLUMNS)
          .gte("data_hora", prevFrom.toISOString())
          .lte("data_hora", to.toISOString())
          .order("data_hora", { ascending: false })
          .order("id")
          .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
        if (cancelled) return;
        if (error) { failed(); return; }
        const batch = (data as ConsultaFin[] | null) ?? [];
        rows.push(...batch);
        if (batch.length < PAGE_SIZE) break;
      }
      const start = from.getTime();
      setRevenue({
        key: revenueKey,
        atual: rows.filter(r => new Date(r.data_hora).getTime() >= start),
        anterior: rows.filter(r => new Date(r.data_hora).getTime() < start),
        failed: false,
      });
    })().catch(failed);

    return () => { cancelled = true; };
  }, [monthMs, revenueKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const headers = await authHeaders();
      if (cancelled) return;
      if (!headers) { setWallet({ key: walletKey, balance: null, balanceError: SESSION_EXPIRED, transfers: [], transfersError: SESSION_EXPIRED }); return; }
      const [balanceRes, transferRes] = await Promise.all([
        fetch("/api/saldo-asaas", { headers }).then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) })).catch(() => null),
        fetch("/api/transferencias", { headers }).then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) })).catch(() => null),
      ]);
      if (cancelled) return;
      setWallet({
        key: walletKey,
        balance: balanceRes?.ok ? Number(balanceRes.body.balance) : null,
        balanceError: balanceRes?.ok ? "" : (balanceRes?.body.error ?? "Não foi possível consultar o saldo."),
        transfers: transferRes?.ok ? (transferRes.body.transfers ?? []) : [],
        transfersError: transferRes?.ok ? "" : (transferRes?.body.error ?? "Não foi possível carregar os saques."),
      });
    })();
    return () => { cancelled = true; };
  }, [walletKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user || cancelled) return;
      const { data } = await supabase.from("perfis").select("chave_pix, tipo_chave_pix, chave_pix_alterada_em").eq("id", session.user.id).maybeSingle();
      if (!cancelled) setPerfil((data as PerfilPix | null) ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  const reload = useCallback(() => setReloadToken(t => t + 1), []);

  return {
    atual: revenue.atual,
    anterior: revenue.anterior,
    revenueLoading: revenue.key !== revenueKey,
    revenueFailed: revenue.key === revenueKey && revenue.failed,
    wallet,
    walletLoading: wallet.key !== walletKey,
    perfil,
    reload,
  };
}

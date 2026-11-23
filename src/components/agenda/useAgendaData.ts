"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Consulta } from "@/lib/db";
import { DEFAULT_CONFIG, fetchWindow, mergeConfig, startOfMonth, type AgendaConfig, type ProfissionalSql } from "@/lib/agenda";

export type AgendaDataStatus = "loading" | "ready" | "error";

export type AgendaData = {
  config: AgendaConfig;
  setConfig: (config: AgendaConfig) => void;
  profissionais: ProfissionalSql[];
  consultas: Consulta[];
  status: AgendaDataStatus;
  reload: () => void;
};

type Result = { key: string; consultas: Consulta[]; failed: boolean };

/**
 * Carrega configuração, profissionais e as consultas do mês do dia selecionado
 * (mais 7 dias de cada lado, para semana e grade mensal). Só refaz a busca
 * quando o mês muda ou quando `reload` é chamado.
 *
 * O status é derivado: enquanto o resultado guardado não for o da busca atual,
 * está "loading"; as consultas anteriores continuam visíveis até a nova chegar.
 */
export function useAgendaData(selectedDay: Date): AgendaData {
  const [config, setConfig] = useState<AgendaConfig>(DEFAULT_CONFIG);
  const [profissionais, setProfissionais] = useState<ProfissionalSql[]>([]);
  const [result, setResult] = useState<Result>({ key: "", consultas: [], failed: false });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user || cancelled) return;
      const [cfgRes, prRes] = await Promise.all([
        supabase.from("configuracoes").select("agenda_config").eq("perfil_id", session.user.id).maybeSingle(),
        supabase.from("profissionais").select("id, nome, especialidade").eq("ativo", true).order("nome"),
      ]);
      if (cancelled) return;
      setConfig(mergeConfig(cfgRes.data?.agenda_config));
      setProfissionais((prRes.data as ProfissionalSql[] | null) ?? []);
    })();
    return () => { cancelled = true; };
  }, []);

  const monthKey = startOfMonth(selectedDay).getTime();
  const requestKey = `${monthKey}:${reloadToken}`;

  useEffect(() => {
    let cancelled = false;
    const { from, to } = fetchWindow(new Date(monthKey));
    supabase.from("consultas").select("*")
      .gte("data_hora", from.toISOString())
      .lte("data_hora", to.toISOString())
      .order("data_hora")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setResult(prev => ({ ...prev, key: requestKey, failed: true })); return; }
        const seen = new Set<string>();
        const list = ((data as Consulta[] | null) ?? []).filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
        setResult({ key: requestKey, consultas: list, failed: false });
      }, () => { if (!cancelled) setResult(prev => ({ ...prev, key: requestKey, failed: true })); });
    return () => { cancelled = true; };
  }, [monthKey, requestKey]);

  const reload = useCallback(() => setReloadToken(t => t + 1), []);
  const status: AgendaDataStatus = result.key !== requestKey ? "loading" : result.failed ? "error" : "ready";

  return { config, setConfig, profissionais, consultas: result.consultas, status, reload };
}

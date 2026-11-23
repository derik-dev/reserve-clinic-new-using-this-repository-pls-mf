import type { adminSupabase } from "@/lib/apiAuth";
import { bookingInstant } from "@/lib/bookingTime";

type Admin = ReturnType<typeof adminSupabase>;

/** Tempo que um horário reservado com Pix pendente fica bloqueado esperando o pagamento. */
export const HOLD_MINUTES = 30;

export type ConsultaRef = {
  id: string;
  status: string;
  valor: number | null;
  origem: string | null;
  created_at: string;
  profissional: string | null;
  profissional_id: string | null;
  data_hora: string;
  duracao_min: number;
};

const REF_COLUMNS = "id, status, valor, origem, created_at, profissional, profissional_id, data_hora, duracao_min";

/**
 * Reserva vencida: veio do link público, tem valor a pagar, ainda está "aguardando" e passou
 * do prazo sem pagamento. Ela deixa de bloquear o horário (sem precisar de nenhuma rotina).
 */
export function isStaleHold(c: Pick<ConsultaRef, "status" | "origem" | "valor" | "created_at">, now = Date.now()) {
  return c.status === "aguardando"
    && c.origem === "publico"
    && Number(c.valor ?? 0) > 0
    && now - new Date(c.created_at).getTime() > HOLD_MINUTES * 60_000;
}

/** Há outra consulta ativa que ocupa (parte de) esse intervalo? Canceladas e reservas vencidas não contam. */
export async function existeConflito(admin: Admin, o: { perfilId: string; profissionalId?: string | null; inicio: Date; fim: Date; ignoreId?: string }) {
  let query = admin.from("consultas").select(REF_COLUMNS)
    .eq("perfil_id", o.perfilId)
    .neq("status", "cancelada")
    .gte("data_hora", new Date(o.inicio.getTime() - 12 * 3600_000).toISOString())
    .lt("data_hora", o.fim.toISOString());
  if (o.profissionalId) query = query.eq("profissional_id", o.profissionalId);
  const { data, error } = await query;
  if (error) throw new Error(`Supabase (existeConflito): ${error.message}`);
  const now = Date.now();
  return ((data as ConsultaRef[] | null) ?? []).some(c => {
    if (o.ignoreId && c.id === o.ignoreId) return false;
    if (isStaleHold(c, now)) return false;
    const comeco = new Date(c.data_hora).getTime();
    const termino = comeco + (c.duracao_min > 0 ? c.duracao_min : 30) * 60000;
    return comeco < o.fim.getTime() && o.inicio.getTime() < termino;
  });
}

/**
 * Consulta que pertence a um agendamento. Não há chave entre as duas tabelas, então a identificação
 * é por clínica + horário + nome do paciente (dois médicos no mesmo horário têm consultas distintas).
 */
export async function consultaDoAgendamento(admin: Admin, ag: { perfil_id: string; data: string; hora: string; cliente_nome: string }) {
  const { data, error } = await admin.from("consultas").select(REF_COLUMNS)
    .eq("perfil_id", ag.perfil_id)
    .eq("data_hora", bookingInstant(ag.data, ag.hora).toISOString())
    .eq("paciente_nome", ag.cliente_nome)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw new Error(`Supabase (consultaDoAgendamento): ${error.message}`);
  return ((data as ConsultaRef[] | null) ?? [])[0] ?? null;
}

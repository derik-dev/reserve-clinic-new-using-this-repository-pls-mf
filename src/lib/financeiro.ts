import { supabase } from "@/lib/supabase";

export const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const moneyShort = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Taxa cobrada pela Asaas em cada transação, em reais. */
export const ASAAS_FEE = 2;

export type Transfer = { id: string; value: number; status: string; date: string | null };

/** Colunas lidas de `consultas` para o financeiro. */
export const CONSULTA_FIN_COLUMNS = "id, paciente_nome, paciente_telefone, paciente_email, data_hora, valor, status, servico, profissional, profissional_id";

export type ConsultaFin = {
  id: string;
  paciente_nome: string;
  paciente_telefone: string | null;
  paciente_email: string | null;
  data_hora: string;
  valor: number | null;
  status: "aguardando" | "confirmada" | "concluida" | "cancelada";
  servico: string | null;
  profissional: string | null;
  profissional_id: string | null;
};

/** Consulta paga = confirmada ou concluída (mesma regra do saldo no servidor). */
export const isPaid = (c: ConsultaFin) => c.status === "confirmada" || c.status === "concluida";
const amount = (c: ConsultaFin) => Number(c.valor ?? 0);
/** Cada consulta paga com valor é uma transação na Asaas (e paga a taxa). */
const isTransaction = (c: ConsultaFin) => isPaid(c) && amount(c) > 0;

/** Valor líquido de uma consulta: o valor menos a taxa da Asaas. */
export const netOf = (c: ConsultaFin) => (isTransaction(c) ? amount(c) - ASAAS_FEE : 0);

/* ── Resumo do período ───────────────────────────────────── */

export type Summary = {
  bruto: number;
  taxa: number;
  liquido: number;
  /** Quantidade de transações (consultas pagas com valor). */
  transacoes: number;
  pagas: number;
  aguardando: number;
  canceladas: number;
  /** Consultas solicitadas, em qualquer status. */
  solicitacoes: number;
  /** Pessoas diferentes que solicitaram consulta. */
  pessoas: number;
};

function personKey(c: ConsultaFin) {
  const phone = (c.paciente_telefone ?? "").replace(/\D/g, "");
  if (phone) return `tel:${phone}`;
  const email = (c.paciente_email ?? "").trim().toLowerCase();
  if (email) return `mail:${email}`;
  return `nome:${c.paciente_nome.trim().toLowerCase()}`;
}

export function summarize(consultas: ConsultaFin[]): Summary {
  const transacoes = consultas.filter(isTransaction);
  const bruto = transacoes.reduce((sum, c) => sum + amount(c), 0);
  const taxa = transacoes.length * ASAAS_FEE;
  return {
    bruto,
    taxa,
    liquido: bruto - taxa,
    transacoes: transacoes.length,
    pagas: consultas.filter(isPaid).length,
    aguardando: consultas.filter(c => c.status === "aguardando").length,
    canceladas: consultas.filter(c => c.status === "cancelada").length,
    solicitacoes: consultas.length,
    pessoas: new Set(consultas.map(personKey)).size,
  };
}

/** Variação percentual entre dois períodos; null quando não há base de comparação. */
export function percentChange(current: number, previous: number) {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

/* ── Séries e ranking ────────────────────────────────────── */

export type DayPoint = { day: number; bruto: number; transacoes: number };

/** Recebimentos por dia do mês (todos os dias, mesmo os sem recebimento). */
export function dailySeries(consultas: ConsultaFin[], month: Date): DayPoint[] {
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const series: DayPoint[] = Array.from({ length: days }, (_, i) => ({ day: i + 1, bruto: 0, transacoes: 0 }));
  for (const c of consultas) {
    if (!isTransaction(c)) continue;
    const point = series[new Date(c.data_hora).getDate() - 1];
    if (point) { point.bruto += amount(c); point.transacoes += 1; }
  }
  return series;
}

export type DoctorRank = { key: string; nome: string; consultas: number; pagas: number; bruto: number };

/** Médicos por quantidade de consultas solicitadas, do mais procurado para o menos. */
export function doctorRanking(consultas: ConsultaFin[]): DoctorRank[] {
  const map = new Map<string, DoctorRank>();
  for (const c of consultas) {
    const name = (c.profissional ?? "").trim();
    const key = name ? name.toLowerCase() : (c.profissional_id ?? "sem");
    const row = map.get(key) ?? { key, nome: name || "Sem profissional definido", consultas: 0, pagas: 0, bruto: 0 };
    row.consultas += 1;
    if (isPaid(c)) row.pagas += 1;
    if (isTransaction(c)) row.bruto += amount(c);
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.consultas - a.consultas || b.bruto - a.bruto);
}

/** Maior valor "redondo" para o eixo do gráfico (ex.: 740 -> 800). */
export function niceMax(value: number) {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find(s => normalized <= s + 1e-9) ?? 10;
  return step * magnitude;
}

/* ── Saques e chave Pix ──────────────────────────────────── */

/** Rótulo e classe de selo para cada status de saque devolvido por /api/transferencias. */
export const TRANSFER_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pendente", cls: "statusAguardando" },
  IN_BANK_PROCESSING: { label: "Em processamento", cls: "statusAguardando" },
  DONE: { label: "Concluído", cls: "statusConfirmada" },
  FAILED: { label: "Falhou", cls: "statusFalhou" },
  CANCELLED: { label: "Cancelado", cls: "statusFalhou" },
  BLOCKED: { label: "Bloqueado", cls: "statusFalhou" },
};

export async function authHeaders(): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : null;
}

/** Chave Pix de saque salva no perfil, como a rota /api/chave-pix devolve (a chave inteira nunca vai ao navegador). */
export type PerfilPix = { temChave: boolean; tipo: string | null; mascara: string; alteradaEm: string | null };

export type Paciente = {
  id: string;
  perfil_id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  data_nascimento: string | null;
  observacoes: string | null;
  status: "ativo" | "inativo";
  created_at: string;
};

export type ConsultaStatus = "aguardando" | "confirmada" | "concluida" | "cancelada";

export type Consulta = {
  id: string;
  perfil_id: string;
  paciente_id: string | null;
  paciente_nome: string;
  paciente_telefone: string | null;
  paciente_email: string | null;
  data_hora: string;
  duracao_min: number;
  servico: string | null;
  profissional: string | null;
  valor: number | null;
  status: ConsultaStatus;
  observacoes: string | null;
  origem: "painel" | "publico";
  created_at: string;
};

export const STATUS_LABEL: Record<ConsultaStatus, string> = {
  aguardando: "Aguardando",
  confirmada: "Confirmada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const STATUS_CLASS: Record<ConsultaStatus, string> = {
  aguardando: "statusAguardando",
  confirmada: "statusConfirmada",
  concluida: "statusConcluida",
  cancelada: "statusConcluida",
};

export function formatCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function calcIdade(nascimento: string | null | undefined) {
  if (!nascimento) return null;
  const nasc = new Date(nascimento);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

export function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "—";
}

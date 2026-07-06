export function StatusBadge({ status }: { status: "Confirmada" | "Aguardando" | "Concluída" | "Cancelada" | "Ativo" | "Novo" }) {
  return <span className={`statusBadge status${status.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>{status}</span>;
}

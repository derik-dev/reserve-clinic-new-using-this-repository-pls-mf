export function StatusBadge({ status }: { status: string }) {
  const variant = status === "Aguardando confirmação" ? "Aguardando" : status.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return <span className={`statusBadge status${variant}`}>{status}</span>;
}

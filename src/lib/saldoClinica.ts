import type { adminSupabase } from "@/lib/apiAuth";

type Db = ReturnType<typeof adminSupabase>;

export type Perfil = { id: string; cpf_cnpj: string | null; email_contato: string | null; telefone: string | null };

export async function findPerfil(db: Db, userId: string): Promise<Perfil | null> {
  const columns = "id, cpf_cnpj, email_contato, telefone";
  const byId = await db.from("perfis").select(columns).eq("id", userId).maybeSingle();
  if (byId.data) return byId.data as Perfil;
  const byUser = await db.from("perfis").select(columns).eq("user_id", userId).maybeSingle();
  return (byUser.data as Perfil | null) ?? null;
}

const sum = (rows: { valor: number | string | null }[] | null) =>
  (rows ?? []).reduce((total, row) => total + Number(row.valor ?? 0), 0);

// Saldo da clínica = consultas pagas (confirmadas/concluídas) - saques feitos ou em andamento.
// `ignoreSaqueId` exclui o saque que está sendo processado agora.
export async function saldoDaClinica(db: Db, perfilId: string, ignoreSaqueId?: string) {
  const saquesQuery = db.from("saques").select("valor").eq("perfil_id", perfilId).neq("status", "falhou");
  const [consultas, saques] = await Promise.all([
    db.from("consultas").select("valor").eq("perfil_id", perfilId).in("status", ["confirmada", "concluida"]),
    ignoreSaqueId ? saquesQuery.neq("id", ignoreSaqueId) : saquesQuery,
  ]);
  if (consultas.error || saques.error) return { error: consultas.error ?? saques.error, available: 0 };
  return { error: null, available: Math.round((sum(consultas.data) - sum(saques.data)) * 100) / 100 };
}

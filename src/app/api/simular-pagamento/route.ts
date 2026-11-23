import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/apiAuth";
import { consultaDoAgendamento } from "@/lib/reservas";

// Só para desenvolvimento/teste: confirma um agendamento sem pagamento real.
// Em produção fica desligada, a menos que ENABLE_PAYMENT_SIMULATION=true.
function simulationEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.ENABLE_PAYMENT_SIMULATION === "true";
}

export async function POST(req: NextRequest) {
  if (!simulationEnabled()) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const { agendamentoId } = (await req.json().catch(() => ({}))) as { agendamentoId?: string };
  if (!agendamentoId) return NextResponse.json({ error: "agendamentoId obrigatório." }, { status: 400 });

  const admin = adminSupabase();

  const { data: ag } = await admin
    .from("agendamentos")
    .select("perfil_id, cliente_nome, data, hora")
    .eq("id", agendamentoId)
    .maybeSingle();

  if (!ag) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });

  await admin.from("agendamentos").update({ status: "confirmado" }).eq("id", agendamentoId);

  const consulta = await consultaDoAgendamento(admin, ag);
  if (consulta) await admin.from("consultas").update({ status: "confirmada" }).eq("id", consulta.id);

  return NextResponse.json({ ok: true });
}

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const { agendamentoId } = (await req.json()) as { agendamentoId: string };
  if (!agendamentoId) return NextResponse.json({ error: "agendamentoId obrigatório." }, { status: 400 });

  const admin = adminSupabase();

  const { data: ag } = await admin
    .from("agendamentos")
    .select("perfil_id, data, hora")
    .eq("id", agendamentoId)
    .maybeSingle();

  if (!ag) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });

  await admin.from("agendamentos").update({ status: "confirmado" }).eq("id", agendamentoId);

  const horaStr = (ag.hora as string).slice(0, 5);
  const dataHoraIso = new Date(`${ag.data}T${horaStr}:00`).toISOString();
  await admin
    .from("consultas")
    .update({ status: "confirmada" })
    .eq("perfil_id", ag.perfil_id)
    .eq("data_hora", dataHoraIso);

  return NextResponse.json({ ok: true });
}

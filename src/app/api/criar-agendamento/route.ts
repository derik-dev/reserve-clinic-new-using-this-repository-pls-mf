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
  try {
    const {
      perfilId,
      clienteNome,
      clienteTelefone,
      clienteEmail,
      data,
      hora,
      duracaoMin,
      servico,
      profissional,
      observacoes,
    } = (await req.json()) as {
      perfilId: string;
      clienteNome: string;
      clienteTelefone?: string;
      clienteEmail?: string;
      data: string;
      hora: string;
      duracaoMin?: number;
      servico?: string;
      profissional?: string;
      observacoes?: string;
    };

    if (!perfilId || !clienteNome || !data || !hora) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes." }, { status: 400 });
    }

    const admin = adminSupabase();
    const agendamentoId = crypto.randomUUID();
    const dataHoraIso = new Date(`${data}T${hora}:00`).toISOString();

    const [agendamentoResult, consultaResult] = await Promise.all([
      admin.from("agendamentos").insert({
        id: agendamentoId,
        perfil_id: perfilId,
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone || null,
        cliente_email: clienteEmail || null,
        data,
        hora,
      }),
      admin.from("consultas").insert({
        perfil_id: perfilId,
        paciente_nome: clienteNome,
        paciente_telefone: clienteTelefone || null,
        paciente_email: clienteEmail || null,
        data_hora: dataHoraIso,
        duracao_min: duracaoMin ?? 60,
        servico: servico || null,
        profissional: profissional || null,
        status: "aguardando",
        observacoes: observacoes || null,
      }),
    ]);

    if (agendamentoResult.error) {
      return NextResponse.json({ error: agendamentoResult.error.message }, { status: 500 });
    }
    if (consultaResult.error) {
      return NextResponse.json({ error: consultaResult.error.message }, { status: 500 });
    }

    return NextResponse.json({ id: agendamentoId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

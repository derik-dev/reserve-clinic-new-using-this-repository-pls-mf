import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { notificarDiscord, throwIfSupabaseError } from "@/lib/notificarDiscord";

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

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
      profissionalId,
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
      profissionalId?: string;
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
        profissional_id: profissionalId || null,
        status: "aguardando",
        observacoes: observacoes || null,
      }),
    ]);

    throwIfSupabaseError(agendamentoResult, "criar-agendamento.insert agendamento");
    throwIfSupabaseError(consultaResult, "criar-agendamento.insert consulta");

    return NextResponse.json({ id: agendamentoId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno.";
    await notificarDiscord(`🔴 Erro em /api/criar-agendamento às ${horaAgora()}: ${msg}`, "critico");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

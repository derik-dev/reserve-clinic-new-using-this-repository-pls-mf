import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/apiAuth";
import { notificarDiscord, throwIfSupabaseError } from "@/lib/notificarDiscord";
import { rateLimited } from "@/lib/rateLimit";
import { bookingInstant } from "@/lib/bookingTime";
import { existeConflito } from "@/lib/reservas";

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

export async function POST(req: NextRequest) {
  if (rateLimited(req, "criar-agendamento", 10, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, { status: 429 });
  }

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

    const invalido =
      !UUID.test(perfilId) ||
      !DATE.test(data) ||
      !TIME.test(hora) ||
      Number.isNaN(bookingInstant(data, hora).getTime()) ||
      clienteNome.length > 120 ||
      (clienteTelefone?.length ?? 0) > 30 ||
      (clienteEmail ? clienteEmail.length > 160 || !EMAIL.test(clienteEmail) : false) ||
      (servico?.length ?? 0) > 120 ||
      (profissional?.length ?? 0) > 120 ||
      (profissionalId ? !UUID.test(profissionalId) : false) ||
      (observacoes?.length ?? 0) > 1000 ||
      (duracaoMin !== undefined && (!Number.isInteger(duracaoMin) || duracaoMin < 5 || duracaoMin > 480));
    if (invalido) {
      return NextResponse.json({ error: "Dados do agendamento inválidos." }, { status: 400 });
    }

    const admin = adminSupabase();
    const agendamentoId = crypto.randomUUID();
    const inicio = bookingInstant(data, hora);
    const dataHoraIso = inicio.toISOString();

    const [perfilResult, profResult] = await Promise.all([
      admin.from("perfis").select("valor_consulta").eq("id", perfilId).maybeSingle(),
      profissionalId
        ? admin.from("profissionais").select("valor_consulta").eq("id", profissionalId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (!perfilResult.data) {
      return NextResponse.json({ error: "Clínica não encontrada." }, { status: 404 });
    }

    // O horário precisa estar no futuro e livre: dois pacientes não podem ficar com o mesmo horário.
    const duracao = duracaoMin ?? 60;
    const fim = new Date(inicio.getTime() + duracao * 60000);
    if (inicio.getTime() < Date.now() - 60_000) {
      return NextResponse.json({ error: "Esse horário já passou. Escolha outro." }, { status: 400 });
    }
    const ocupado = await existeConflito(admin, { perfilId, profissionalId, inicio, fim });
    if (ocupado) {
      return NextResponse.json({ error: "Esse horário acabou de ser ocupado. Escolha outro." }, { status: 409 });
    }
    const valorConsulta = profResult.data?.valor_consulta ?? perfilResult.data?.valor_consulta ?? null;

    // Upsert paciente: se já existe pelo telefone, não duplica
    if (clienteTelefone) {
      const { data: existing } = await admin
        .from("pacientes")
        .select("id")
        .eq("perfil_id", perfilId)
        .eq("telefone", clienteTelefone)
        .maybeSingle();

      if (!existing) {
        await admin.from("pacientes").insert({
          perfil_id: perfilId,
          nome: clienteNome,
          telefone: clienteTelefone,
          email: clienteEmail || null,
          status: "ativo",
        });
      }
    } else {
      // Sem telefone: insere sempre (sem como deduplicar com segurança)
      await admin.from("pacientes").insert({
        perfil_id: perfilId,
        nome: clienteNome,
        telefone: null,
        email: clienteEmail || null,
        status: "ativo",
      });
    }

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
        duracao_min: duracao,
        servico: servico || null,
        profissional: profissional || null,
        profissional_id: profissionalId || null,
        status: "aguardando",
        origem: "publico",
        valor: valorConsulta,
        observacoes: observacoes || null,
      }),
    ]);

    throwIfSupabaseError(agendamentoResult, "criar-agendamento.insert agendamento");
    throwIfSupabaseError(consultaResult, "criar-agendamento.insert consulta");

    return NextResponse.json({ id: agendamentoId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno.";
    await notificarDiscord(`🔴 Erro em /api/criar-agendamento às ${horaAgora()}: ${msg}`, "critico");
    return NextResponse.json({ error: "Não foi possível criar o agendamento agora. Tente novamente." }, { status: 500 });
  }
}

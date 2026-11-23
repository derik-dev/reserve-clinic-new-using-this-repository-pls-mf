import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/apiAuth";
import { enviarWhatsapp } from "@/lib/enviarWhatsapp";
import { consultaDoAgendamento, existeConflito } from "@/lib/reservas";
import { notificarDiscord, throwIfSupabaseError } from "@/lib/notificarDiscord";

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function tokenValido(recebido: string | null, esperado: string) {
  if (!recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

const EVENTOS_CONFIRMACAO = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const STATUS_SAQUE_POR_EVENTO: Record<string, string> = {
  TRANSFER_DONE: "concluido",
  TRANSFER_FAILED: "falhou",
  TRANSFER_CANCELLED: "falhou",
};

type TransferBody = { type?: string; transfer?: { id?: string; value?: number } };

function recusar(motivo: string, transferId?: string, status = 200) {
  console.warn(`[webhook-asaas] autorização de saque RECUSADA (${transferId ?? "sem id"}): ${motivo}`);
  return NextResponse.json({ status: "REFUSED", refuseReason: motivo }, { status });
}

// A autorização de saque (type: "TRANSFER") agora é feita só por /api/webhook-saque.
// Se o Asaas ainda apontar para esta URL, o saque é recusado em vez de aprovado por aqui.

export async function POST(req: NextRequest) {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;

  // Eventos com `type` (autorização de saque) precisam sempre de uma resposta APPROVED/REFUSED.
  const preview = await req.clone().json().catch(() => null) as TransferBody | null;
  if (preview && preview.type !== undefined) return recusar("Autorização de saque movida para /api/webhook-saque.", preview.transfer?.id);

  // Sem token configurado o webhook ficaria aberto a qualquer um: recusa.
  if (!webhookToken) {
    console.error("[webhook-asaas] ASAAS_WEBHOOK_TOKEN não configurado — webhook desativado");
    return NextResponse.json({ received: false }, { status: 503 });
  }
  if (!tokenValido(req.headers.get("asaas-access-token"), webhookToken)) {
    return NextResponse.json({ received: false }, { status: 401 });
  }

  let body: {
    event: string;
    payment?: { id: string; externalReference?: string; value?: number };
    transfer?: { id?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  console.log("[webhook-asaas] evento recebido:", body.event);

  try {
    // Resultado do saque: falhou/cancelou volta o valor para o saldo da clínica
    const statusSaque = STATUS_SAQUE_POR_EVENTO[body.event];
    if (statusSaque && body.transfer?.id) {
      const atualizacao = await adminSupabase()
        .from("saques")
        .update({ status: statusSaque, ...(statusSaque === "falhou" ? { error_message: `Asaas: ${body.event}` } : {}) })
        .eq("asaas_transfer_id", body.transfer.id)
        .in("status", ["pendente", "processando", "autorizado"]);
      throwIfSupabaseError(atualizacao, "webhook-asaas.update saque");
      console.log(`[webhook-asaas] saque ${body.transfer.id} → ${statusSaque}`);
      return NextResponse.json({ received: true });
    }

    if (EVENTOS_CONFIRMACAO.has(body.event) && body.payment?.externalReference) {
      const agendamentoId = body.payment.externalReference;
      const admin = adminSupabase();

      // Busca dados do agendamento e status atual (idempotência + dados para WhatsApp)
      const { data: agendamento } = throwIfSupabaseError(
        await admin
          .from("agendamentos")
          .select("status, perfil_id, cliente_nome, cliente_telefone, data, hora")
          .eq("id", agendamentoId)
          .maybeSingle(),
        "webhook-asaas.select agendamento"
      );

      if (!agendamento) {
        console.warn("[webhook-asaas] agendamento não encontrado para o pagamento recebido");
        return NextResponse.json({ received: true });
      }

      const jaConfirmado = agendamento.status === "confirmado";
      const valorPago = body.payment.value ?? null;

      // A consulta é identificada por clínica + horário + paciente: dois médicos no mesmo horário
      // têm consultas diferentes, e o pagamento de um nunca pode confirmar a do outro.
      const consulta = await consultaDoAgendamento(admin, agendamento);
      if (!consulta) console.warn("[webhook-asaas] consulta do agendamento não encontrada:", agendamentoId);

      // Nunca confirmar um pagamento de valor diferente do cobrado
      const esperado = consulta?.valor != null ? Number(consulta.valor) : null;
      if (esperado != null && valorPago != null && Math.round(esperado * 100) !== Math.round(valorPago * 100)) {
        await notificarDiscord(
          `🔴 /api/webhook-asaas às ${horaAgora()}: valor pago (R$ ${valorPago}) diferente do cobrado (R$ ${esperado}) no agendamento ${agendamentoId}. Confirmação bloqueada — conferir manualmente.`,
          "critico"
        );
        return NextResponse.json({ received: true });
      }

      // Pagamento tardio: se a reserva já foi cancelada por falta de pagamento, só reabre quando o horário continua livre.
      if (consulta?.status === "cancelada") {
        const inicio = new Date(consulta.data_hora);
        const fim = new Date(inicio.getTime() + (consulta.duracao_min > 0 ? consulta.duracao_min : 30) * 60000);
        const ocupado = await existeConflito(admin, { perfilId: agendamento.perfil_id as string, profissionalId: consulta.profissional_id, inicio, fim, ignoreId: consulta.id });
        if (ocupado) {
          await notificarDiscord(
            `🔴 /api/webhook-asaas às ${horaAgora()}: pagamento recebido DEPOIS de a reserva expirar e o horário já foi ocupado (agendamento ${agendamentoId}, paciente ${agendamento.cliente_nome}). Reembolsar o paciente na Asaas.`,
            "critico"
          );
          return NextResponse.json({ received: true });
        }
      }

      throwIfSupabaseError(
        await admin.from("agendamentos").update({ status: "confirmado" }).eq("id", agendamentoId).select(),
        "webhook-asaas.update status"
      );

      if (consulta) {
        const consultaUpdate = await admin
          .from("consultas")
          .update({ status: "confirmada", ...(esperado == null && valorPago != null ? { valor: valorPago } : {}) })
          .eq("id", consulta.id);
        if (consultaUpdate.error) console.error("[webhook-asaas] erro ao atualizar consulta:", consultaUpdate.error.message);
      }

      // Envia WhatsApp apenas se era a primeira confirmação (evita reenvio)
      if (!jaConfirmado && agendamento.cliente_telefone) {
        try {
          const { data: perfil } = await admin.from("perfis").select("nome").eq("id", agendamento.perfil_id).maybeSingle();
          const clinica = (perfil?.nome as string | undefined) ?? "nosso consultório";
          const [ano, mes, dia] = (agendamento.data as string).split("-");
          const dataFormatada = `${dia}/${mes}/${ano}`;
          const horaFormatada = (agendamento.hora as string).slice(0, 5);
          const mensagem =
            `Olá, ${agendamento.cliente_nome}! ` +
            `Seu agendamento${consulta?.profissional ? ` com ${consulta.profissional}` : ""} em ${clinica} foi confirmado para ` +
            `${dataFormatada} às ${horaFormatada}. ` +
            `Te esperamos! 💙`;
          await enviarWhatsapp(agendamento.cliente_telefone, mensagem);
        } catch (errWpp) {
          console.error("[webhook-asaas] falha ao enviar WhatsApp:", errWpp);
          const msg = errWpp instanceof Error ? errWpp.message : String(errWpp);
          await notificarDiscord(`🔴 Erro em /api/webhook-asaas às ${horaAgora()}: falha ao enviar WhatsApp — ${msg}`, "critico");
        }
      }
    }
  } catch (err) {
    // Falha de banco: responde 500 para a Asaas reenviar (a confirmação é idempotente).
    const msg = err instanceof Error ? err.message : String(err);
    await notificarDiscord(`🔴 Erro em /api/webhook-asaas às ${horaAgora()}: ${msg}`, "critico");
    return NextResponse.json({ received: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

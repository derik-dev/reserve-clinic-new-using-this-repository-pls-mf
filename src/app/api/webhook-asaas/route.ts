import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/apiAuth";
import { enviarWhatsapp } from "@/lib/enviarWhatsapp";
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

type TransferBody = { type?: string; transfer?: { id?: string; value?: number } };

function recusar(motivo: string, transferId?: string, status = 200) {
  console.warn(`[webhook-asaas] autorização de saque RECUSADA (${transferId ?? "sem id"}): ${motivo}`);
  return NextResponse.json({ status: "REFUSED", refuseReason: motivo }, { status });
}

const aguardar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Autorização de saque via webhook (substitui o SMS): só aprova um saque que o
// /api/sacar já registrou, ainda "processando" e com o mesmo valor. Todo o resto é recusado.
async function autorizarTransferencia(req: NextRequest, body: TransferBody, webhookToken: string | undefined) {
  const transferId = body.transfer?.id;

  if (body.type !== "TRANSFER") return recusar("Tipo de evento não suportado.", transferId);
  if (!webhookToken) return recusar("Autorização de saque indisponível: webhook sem token configurado.", transferId);
  if (!tokenValido(req.headers.get("asaas-access-token"), webhookToken)) return recusar("Token do webhook inválido.", transferId, 401);
  if (!transferId || typeof body.transfer?.value !== "number") return recusar("Transferência sem id ou valor.", transferId);

  // O Asaas chama o webhook ~5s após criar a transferência, mas pode chegar antes de o
  // /api/sacar gravar o asaas_transfer_id: tenta até 3x com 1s de intervalo.
  const admin = adminSupabase();
  let saque: { status: string; valor: number | string } | null = null;
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const { data, error } = await admin.from("saques").select("status, valor").eq("asaas_transfer_id", transferId).maybeSingle();
    if (error) return recusar("Erro ao consultar o saque.", transferId);
    if (data) { saque = data; break; }
    if (tentativa < 3) await aguardar(1000);
  }
  if (!saque) return recusar("Saque não encontrado no Reserve Clinic.", transferId);

  if (saque.status !== "processando") return recusar(`Saque com status "${saque.status}" não pode ser autorizado.`, transferId);
  if (Math.round(Number(saque.valor) * 100) !== Math.round(body.transfer.value * 100)) return recusar("Valor da transferência diferente do saque solicitado.", transferId);

  console.log(`[webhook-asaas] autorização de saque APROVADA (${transferId})`);
  return NextResponse.json({ status: "APPROVED" });
}

export async function POST(req: NextRequest) {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;

  // Eventos com `type` (autorização de saque) precisam sempre de uma resposta APPROVED/REFUSED.
  const preview = await req.clone().json().catch(() => null) as TransferBody | null;
  if (preview && preview.type !== undefined) return autorizarTransferencia(req, preview, webhookToken);

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
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  console.log("[webhook-asaas] evento recebido:", body.event);

  try {
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

      // Consulta correspondente (mesma chave usada na criação do agendamento)
      let consultaFiltro: { perfilId: string; dataHoraIso: string } | null = null;
      let consultaSemValor = false;
      if (agendamento.perfil_id && agendamento.data && agendamento.hora) {
        const horaStr = (agendamento.hora as string).slice(0, 5);
        consultaFiltro = {
          perfilId: agendamento.perfil_id as string,
          dataHoraIso: new Date(`${agendamento.data}T${horaStr}:00`).toISOString(),
        };
      }

      // Nunca confirmar um pagamento de valor diferente do cobrado
      if (consultaFiltro && valorPago != null) {
        const { data: consulta } = throwIfSupabaseError(
          await admin
            .from("consultas")
            .select("valor")
            .eq("perfil_id", consultaFiltro.perfilId)
            .eq("data_hora", consultaFiltro.dataHoraIso)
            .maybeSingle(),
          "webhook-asaas.select consulta"
        );
        const esperado = consulta?.valor != null ? Number(consulta.valor) : null;
        consultaSemValor = esperado == null;
        if (esperado != null && Math.round(esperado * 100) !== Math.round(valorPago * 100)) {
          await notificarDiscord(
            `🔴 /api/webhook-asaas às ${horaAgora()}: valor pago (R$ ${valorPago}) diferente do cobrado (R$ ${esperado}) no agendamento ${agendamentoId}. Confirmação bloqueada — conferir manualmente.`,
            "critico"
          );
          return NextResponse.json({ received: true });
        }
      }

      throwIfSupabaseError(
        await admin.from("agendamentos").update({ status: "confirmado" }).eq("id", agendamentoId).select(),
        "webhook-asaas.update status"
      );

      if (consultaFiltro) {
        const consultaUpdate = await admin
          .from("consultas")
          .update({ status: "confirmada", ...(consultaSemValor && valorPago != null ? { valor: valorPago } : {}) })
          .eq("perfil_id", consultaFiltro.perfilId)
          .eq("data_hora", consultaFiltro.dataHoraIso);
        if (consultaUpdate.error) console.error("[webhook-asaas] erro ao atualizar consulta:", consultaUpdate.error.message);
      }

      // Envia WhatsApp apenas se era a primeira confirmação (evita reenvio)
      if (!jaConfirmado && agendamento.cliente_telefone) {
        try {
          const [ano, mes, dia] = (agendamento.data as string).split("-");
          const dataFormatada = `${dia}/${mes}/${ano}`;
          const horaFormatada = (agendamento.hora as string).slice(0, 5);
          const mensagem =
            `Olá, ${agendamento.cliente_nome}! ` +
            `Seu agendamento no Centro Auditivo Macaé foi confirmado para ` +
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

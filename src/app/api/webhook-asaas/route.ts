import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { enviarWhatsapp } from "@/lib/enviarWhatsapp";
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

const EVENTOS_CONFIRMACAO = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);

export async function POST(req: NextRequest) {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (webhookToken) {
    const token = req.headers.get("asaas-access-token");
    if (token !== webhookToken) {
      return NextResponse.json({ received: false }, { status: 401 });
    }
  }

  try {
    const body = (await req.json()) as {
      event: string;
      payment?: { id: string; externalReference?: string; value?: number };
    };

    console.log("[webhook-asaas] evento recebido:", body.event, "| externalReference:", body.payment?.externalReference ?? "(ausente)");

    if (EVENTOS_CONFIRMACAO.has(body.event) && body.payment?.externalReference) {
      const agendamentoId = body.payment.externalReference;
      const admin = adminSupabase();

      // Busca dados do agendamento e status atual (idempotência + dados para WhatsApp)
      const selectResult = await admin
        .from("agendamentos")
        .select("status, perfil_id, cliente_nome, cliente_telefone, data, hora")
        .eq("id", agendamentoId)
        .maybeSingle();

      console.log("[webhook-asaas] SELECT agendamento id=" + agendamentoId + " →", selectResult.data ? `encontrado (status=${selectResult.data.status})` : "NÃO ENCONTRADO", selectResult.error ? "ERRO:" + selectResult.error.message : "");

      const { data: agendamento } = throwIfSupabaseError(selectResult, "webhook-asaas.select agendamento");

      const jaConfirmado = agendamento?.status === "confirmado";

      const updateResult = await admin
        .from("agendamentos")
        .update({ status: "confirmado" })
        .eq("id", agendamentoId)
        .select();

      console.log("[webhook-asaas] UPDATE agendamento →", updateResult.data?.length ? `${updateResult.data.length} linha(s) afetada(s)` : "0 linhas afetadas", updateResult.error ? "ERRO:" + updateResult.error.message : "");

      throwIfSupabaseError(updateResult, "webhook-asaas.update status");

      // Atualiza consulta correspondente para "confirmada" e salva o valor pago
      if (agendamento?.perfil_id && agendamento?.data && agendamento?.hora) {
        const horaStr = (agendamento.hora as string).slice(0, 5);
        const dataHoraIso = new Date(`${agendamento.data}T${horaStr}:00`).toISOString();
        const valorPago = body.payment?.value ?? null;
        const consultaUpdate = await admin
          .from("consultas")
          .update({ status: "confirmada", ...(valorPago != null ? { valor: valorPago } : {}) })
          .eq("perfil_id", agendamento.perfil_id)
          .eq("data_hora", dataHoraIso);
        console.log("[webhook-asaas] UPDATE consulta →", consultaUpdate.error ? "ERRO:" + consultaUpdate.error.message : `ok (valor=${valorPago})`);
      }

      // Envia WhatsApp apenas se era a primeira confirmação (evita reenvio)
      if (!jaConfirmado && agendamento?.cliente_telefone) {
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
    // Silencioso — responde 200 de qualquer forma para evitar loop de reenvio
    const msg = err instanceof Error ? err.message : String(err);
    await notificarDiscord(`🔴 Erro em /api/webhook-asaas às ${horaAgora()}: ${msg}`, "critico");
  }

  return NextResponse.json({ received: true });
}

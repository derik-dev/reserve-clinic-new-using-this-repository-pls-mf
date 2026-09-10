import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { enviarWhatsapp } from "@/lib/enviarWhatsapp";

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
      payment?: { id: string; externalReference?: string };
    };

    if (EVENTOS_CONFIRMACAO.has(body.event) && body.payment?.externalReference) {
      const agendamentoId = body.payment.externalReference;
      const admin = adminSupabase();

      // Busca dados do agendamento e status atual (idempotência + dados para WhatsApp)
      const { data: agendamento } = await admin
        .from("agendamentos")
        .select("status, cliente_nome, cliente_telefone, data, hora")
        .eq("id", agendamentoId)
        .maybeSingle();

      const jaConfirmado = agendamento?.status === "confirmado";

      await admin
        .from("agendamentos")
        .update({ status: "confirmado" })
        .eq("id", agendamentoId);

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
        }
      }
    }
  } catch {
    // Silencioso — responde 200 de qualquer forma para evitar loop de reenvio
  }

  return NextResponse.json({ received: true });
}

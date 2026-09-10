import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { notificarDiscord } from "@/lib/notificarDiscord";

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

const ASAAS_BASE = process.env.ASAAS_BASE_URL ?? "https://api.asaas.com/v3";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { agendamentoId, clienteNome, clienteCpf, clienteEmail, valor } =
      (await req.json()) as {
        agendamentoId: string;
        clienteNome: string;
        clienteCpf?: string;
        clienteEmail?: string;
        valor: number;
      };

    if (!agendamentoId || !clienteNome || !valor) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes." }, { status: 400 });
    }
    if (!clienteEmail?.trim()) {
      return NextResponse.json({ error: "E-mail do paciente é obrigatório para pagamento PIX." }, { status: 400 });
    }
    if (!clienteCpf?.trim()) {
      return NextResponse.json({ error: "CPF do paciente é obrigatório para pagamento PIX." }, { status: 400 });
    }

    const asaasKey = process.env.ASAAS_API_KEY ?? "";

    const headers = {
      "Content-Type": "application/json",
      access_token: asaasKey,
    };

    // 1. Criar ou recuperar cliente na Asaas pelo CPF
    const cpfDigits = clienteCpf.replace(/\D/g, "");
    const customerRes = await fetch(`${ASAAS_BASE}/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: clienteNome,
        cpfCnpj: cpfDigits,
        email: clienteEmail.trim(),
        externalReference: agendamentoId,
      }),
    });

    if (!customerRes.ok) {
      const err = await customerRes.json().catch(() => ({})) as { errors?: { description: string }[] };
      throw new Error(err?.errors?.[0]?.description ?? "Erro ao criar cliente na Asaas.");
    }
    const customer = (await customerRes.json()) as { id: string };

    // 2. Criar cobrança PIX
    const dueDate = new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 10);
    const paymentRes = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customer: customer.id,
        billingType: "PIX",
        value: valor,
        dueDate,
        description: "Agendamento Reserve Clinic",
        externalReference: agendamentoId,
      }),
    });

    if (!paymentRes.ok) {
      const err = await paymentRes.json().catch(() => ({})) as { errors?: { description: string }[] };
      throw new Error(err?.errors?.[0]?.description ?? "Erro ao criar cobrança PIX na Asaas.");
    }
    const payment = (await paymentRes.json()) as { id: string };

    // 3. Buscar QR Code PIX — produção pode levar até ~15 s para gerar
    let qrCodeBase64 = "";
    let copiaECola = "";
    for (let tentativa = 0; tentativa < 6; tentativa++) {
      if (tentativa > 0) await new Promise(r => setTimeout(r, 3000));
      const qrRes = await fetch(`${ASAAS_BASE}/payments/${payment.id}/pixQrCode`, { headers });
      if (qrRes.ok) {
        const qrData = (await qrRes.json()) as { encodedImage?: string; payload?: string };
        if (qrData.encodedImage && qrData.payload) {
          qrCodeBase64 = qrData.encodedImage;
          copiaECola = qrData.payload;
          break;
        }
      }
    }

    if (!qrCodeBase64) {
      throw new Error("QR Code PIX não disponível ainda. Tente novamente em instantes.");
    }

    await adminSupabase()
      .from("agendamentos")
      .update({ pix_id: payment.id })
      .eq("id", agendamentoId);

    return NextResponse.json({ pixId: payment.id, qrCodeBase64, copiaECola });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno ao gerar PIX.";
    await notificarDiscord(`🔴 Erro em /api/criar-pagamento às ${horaAgora()}: ${msg}`, "critico");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

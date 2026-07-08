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

    const dateOfExpiration = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const body = {
      transaction_amount: valor,
      description: "Agendamento Reserve Clinic",
      payment_method_id: "pix",
      external_reference: agendamentoId,
      date_of_expiration: dateOfExpiration,
      payer: {
        email: clienteEmail ?? `paciente.${agendamentoId.slice(0, 8)}@reserveclinic.com`,
        first_name: clienteNome.split(" ")[0],
        last_name: clienteNome.split(" ").slice(1).join(" ") || clienteNome.split(" ")[0],
        ...(clienteCpf ? {
          identification: { type: "CPF", number: clienteCpf.replace(/\D/g, "") },
        } : {}),
      },
    };

    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "X-Idempotency-Key": agendamentoId,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string; cause?: unknown[] };
      throw new Error(err.message ?? "Erro ao criar pagamento PIX.");
    }

    const pagamento = (await res.json()) as {
      id: number;
      point_of_interaction: {
        transaction_data: { qr_code_base64: string; qr_code: string };
      };
    };

    await adminSupabase()
      .from("agendamentos")
      .update({ pix_id: String(pagamento.id) })
      .eq("id", agendamentoId);

    return NextResponse.json({
      pixId: String(pagamento.id),
      qrCodeBase64: pagamento.point_of_interaction.transaction_data.qr_code_base64,
      copiaECola: pagamento.point_of_interaction.transaction_data.qr_code,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno ao gerar PIX.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

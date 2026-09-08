import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const EVENTOS_CONFIRMACAO = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);

export async function POST(req: NextRequest) {
  // Valida token apenas se ASAAS_WEBHOOK_TOKEN estiver configurado
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (webhookToken) {
    const token = req.headers.get("asaas-access-token");
    if (token !== webhookToken) {
      return NextResponse.json({ received: false }, { status: 401 });
    }
  }

  // Sempre retorna 200 após validar o token — erros internos são silenciados
  // para evitar loop de reenvio da Asaas
  try {
    const body = (await req.json()) as {
      event: string;
      payment?: { id: string; externalReference?: string };
    };

    if (EVENTOS_CONFIRMACAO.has(body.event) && body.payment?.externalReference) {
      await adminSupabase()
        .from("agendamentos")
        .update({ status: "confirmado" })
        .eq("id", body.payment.externalReference);
    }
  } catch {
    // Silencioso — responde 200 de qualquer forma
  }

  return NextResponse.json({ received: true });
}

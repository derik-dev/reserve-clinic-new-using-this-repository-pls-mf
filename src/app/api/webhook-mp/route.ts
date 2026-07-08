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
    const body = (await req.json()) as { type?: string; data?: { id?: string } };

    if (body.type !== "payment" || !body.data?.id) {
      return NextResponse.json({ ok: true });
    }

    // Nunca confiar no corpo do webhook — verificar direto na API do MP
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${body.data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });

    if (!res.ok) return NextResponse.json({ ok: true });

    const pagamento = (await res.json()) as { status: string; external_reference?: string };

    if (pagamento.status === "approved" && pagamento.external_reference) {
      await adminSupabase()
        .from("agendamentos")
        .update({ status: "confirmado" })
        .eq("id", pagamento.external_reference);
    }
  } catch (e) {
    console.error("[webhook-mp]", e);
  }

  // Sempre 200 — MP reenvia em loop se não receber 200
  return NextResponse.json({ ok: true });
}

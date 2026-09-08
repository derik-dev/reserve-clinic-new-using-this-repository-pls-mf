import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function validarAssinatura(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret configurado, aceita tudo

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  const dataId = new URL(req.url).searchParams.get("data.id") ?? "";

  if (!xSignature) return false;

  // MP envia: "ts=...,v1=..."
  const parts = Object.fromEntries(xSignature.split(",").map((p) => p.split("=")));
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hex === v1;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody) as { type?: string; data?: { id?: string } };

    const valido = await validarAssinatura(req, rawBody);
    if (!valido) {
      console.warn("[webhook-mp] assinatura inválida");
      return NextResponse.json({ ok: true });
    }

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

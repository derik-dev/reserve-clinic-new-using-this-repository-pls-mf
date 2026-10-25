import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
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

async function validarAssinatura(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false; // sem secret configurado, recusa (o webhook ficaria aberto)

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

  const a = Buffer.from(hex);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MP_WEBHOOK_SECRET) {
      console.error("[webhook-mp] MP_WEBHOOK_SECRET não configurado — webhook desativado");
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    const rawBody = await req.text();
    const valido = await validarAssinatura(req, rawBody);
    if (!valido) {
      console.warn("[webhook-mp] assinatura inválida");
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as { type?: string; data?: { id?: string } };

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
      throwIfSupabaseError(
        await adminSupabase()
          .from("agendamentos")
          .update({ status: "confirmado" })
          .eq("id", pagamento.external_reference),
        "webhook-mp.update status"
      );
    }
  } catch (e) {
    console.error("[webhook-mp]", e);
    const msg = e instanceof Error ? e.message : String(e);
    await notificarDiscord(`🔴 Erro em /api/webhook-mp às ${horaAgora()}: ${msg}`, "critico");
    // 500 para o MP reenviar (a confirmação é idempotente)
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

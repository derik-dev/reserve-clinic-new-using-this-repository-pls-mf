import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const ASAAS_BASE = process.env.ASAAS_BASE_URL ?? "https://api.asaas.com/v3";

export async function GET(req: NextRequest) {
  try {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/, "").trim();
    if (!token) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
    const auth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data, error } = await auth.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
    if (!process.env.ASAAS_API_KEY) return NextResponse.json({ error: "A integração financeira ainda não está configurada no servidor." }, { status: 503 });

    const response = await fetch(`${ASAAS_BASE}/finance/balance`, { headers: { access_token: process.env.ASAAS_API_KEY }, cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as { balance?: number; errors?: { description?: string }[] };
    if (!response.ok) return NextResponse.json({ error: payload.errors?.[0]?.description ?? "Não foi possível consultar o saldo na Asaas." }, { status: 502 });
    return NextResponse.json({ balance: Number(payload.balance ?? 0) });
  } catch (error) {
    console.error("[api/saldo-asaas] erro ao consultar saldo", error);
    return NextResponse.json({ error: "Não foi possível carregar o saldo disponível agora." }, { status: 500 });
  }
}

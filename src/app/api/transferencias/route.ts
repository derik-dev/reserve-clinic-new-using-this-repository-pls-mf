import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const ASAAS_BASE = process.env.ASAAS_BASE_URL ?? "https://api.asaas.com/v3";

async function authenticated(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/, "").trim();
  if (!token) return false;
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  return !error && Boolean(data.user);
}

export async function GET(req: NextRequest) {
  try {
    if (!await authenticated(req)) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
    if (!process.env.ASAAS_API_KEY) return NextResponse.json({ error: "A integração financeira ainda não está configurada no servidor." }, { status: 503 });

    const params = new URLSearchParams({ limit: "20", offset: "0" });
    const limit = Number(req.nextUrl.searchParams.get("limit"));
    if (Number.isInteger(limit) && limit > 0 && limit <= 100) params.set("limit", String(limit));
    const offset = Number(req.nextUrl.searchParams.get("offset"));
    if (Number.isInteger(offset) && offset >= 0) params.set("offset", String(offset));

    const response = await fetch(`${ASAAS_BASE}/transfers?${params}`, { headers: { access_token: process.env.ASAAS_API_KEY }, cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as { data?: { id: string; value: number; status: string; dateCreated?: string; transferDate?: string; description?: string }[]; hasMore?: boolean; errors?: { description?: string }[] };
    if (!response.ok) return NextResponse.json({ error: payload.errors?.[0]?.description ?? "Não foi possível consultar as transferências na Asaas." }, { status: 502 });

    return NextResponse.json({
      transfers: (payload.data ?? []).map((item) => ({ id: item.id, value: item.value, status: item.status, date: item.transferDate ?? item.dateCreated ?? null, description: item.description ?? null })),
      hasMore: Boolean(payload.hasMore),
    });
  } catch (error) {
    console.error("[api/transferencias] erro ao consultar histórico", error);
    return NextResponse.json({ error: "Não foi possível carregar o histórico de saques agora." }, { status: 500 });
  }
}

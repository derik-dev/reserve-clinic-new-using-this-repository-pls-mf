import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const ASAAS_BASE = process.env.ASAAS_BASE_URL ?? "https://api.asaas.com/v3";

function errorMessage(payload: unknown, fallback: string) {
  const body = payload as { errors?: { description?: string }[] } | null;
  return body?.errors?.[0]?.description ?? fallback;
}

async function authenticate(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/, "").trim();
  if (!token) return null;
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  return error || !data.user ? null : data.user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ error: "Sessão expirada. Entre novamente para sacar." }, { status: 401 });

    const apiKey = process.env.ASAAS_API_KEY;
    const defaultPixAddressKey = process.env.ASAAS_TRANSFER_PIX_KEY;
    const defaultPixAddressKeyType = process.env.ASAAS_TRANSFER_PIX_KEY_TYPE;
    if (!apiKey) return NextResponse.json({ error: "A integração financeira ainda não está configurada no servidor." }, { status: 503 });
    const body = await req.json().catch(() => null) as { value?: unknown; pixAddressKey?: unknown; pixAddressKeyType?: unknown } | null;
    const pixAddressKey = typeof body?.pixAddressKey === "string" && body.pixAddressKey.trim() ? body.pixAddressKey.trim() : defaultPixAddressKey;
    const pixAddressKeyType = typeof body?.pixAddressKeyType === "string" && body.pixAddressKeyType.trim() ? body.pixAddressKeyType.trim().toUpperCase() : defaultPixAddressKeyType?.toUpperCase();
    if (!pixAddressKey || !pixAddressKeyType) return NextResponse.json({ error: "Informe a chave Pix e o tipo da chave de destino." }, { status: 400 });
    if (!( ["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"] as string[]).includes(pixAddressKeyType)) return NextResponse.json({ error: "Tipo de chave Pix inválido." }, { status: 400 });
    const value = typeof body?.value === "number" ? body.value : Number(body?.value);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Informe um valor de saque maior que zero." }, { status: 400 });
    }
    if (Math.round(value * 100) !== value * 100) {
      return NextResponse.json({ error: "O valor deve ter no máximo duas casas decimais." }, { status: 400 });
    }

    const response = await fetch(`${ASAAS_BASE}/transfers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: apiKey },
      body: JSON.stringify({
        value,
        pixAddressKey,
        pixAddressKeyType,
        description: `Saque Reserve Clinic - ${user.id}`,
      }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ error: errorMessage(payload, "A Asaas não autorizou o saque. Verifique o saldo e os dados de destino.") }, { status: response.status >= 400 && response.status < 500 ? response.status : 502 });
    }

    const transfer = payload as { id?: string; status?: string; value?: number; dateCreated?: string };
    return NextResponse.json({
      transfer: {
        id: transfer.id ?? null,
        value: transfer.value ?? value,
        status: transfer.status ?? "PENDING",
        date: transfer.dateCreated ?? new Date().toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[api/sacar] erro ao criar transferência", error);
    return NextResponse.json({ error: "Não foi possível solicitar o saque agora. Tente novamente ou confira os logs da integração." }, { status: 500 });
  }
}

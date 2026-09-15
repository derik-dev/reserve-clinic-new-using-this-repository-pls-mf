import { NextRequest, NextResponse } from "next/server";

function formatPhone(raw: string): string {
  // Remove tudo que não é dígito
  const digits = raw.replace(/\D/g, "");
  // Se já começa com 55 e tem 12-13 dígitos, usa como está
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  // Senão, adiciona o 55 do Brasil
  return "55" + digits;
}

export async function POST(req: NextRequest) {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;
  const clientToken = process.env.ZAPI_CLIENT_TOKEN;

  if (!instanceId || !token) {
    return NextResponse.json({ error: "Z-API não configurado. Defina ZAPI_INSTANCE_ID e ZAPI_TOKEN no .env.local." }, { status: 503 });
  }

  const { phone, message } = await req.json();
  if (!phone || !message?.trim()) {
    return NextResponse.json({ error: "Telefone e mensagem são obrigatórios." }, { status: 400 });
  }

  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (clientToken) headers["Client-Token"] = clientToken;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ phone: formatPhone(phone), message: message.trim() }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body?.message ?? body?.error ?? JSON.stringify(body);
    console.error("[zapi-send] erro Z-API:", res.status, detail, "| phone:", formatPhone(phone));
    return NextResponse.json({ error: `Z-API ${res.status}: ${detail}` }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}

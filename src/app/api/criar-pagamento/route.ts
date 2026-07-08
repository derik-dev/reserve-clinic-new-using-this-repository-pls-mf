import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const ASAAS_BASE = process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3";

function asaas(apiKey: string, path: string, init?: RequestInit) {
  return fetch(`${ASAAS_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
      ...(init?.headers ?? {}),
    },
  });
}

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function resolveApiKey(agendamentoId: string): Promise<string> {
  const admin = adminSupabase();
  const { data: ag } = await admin
    .from("agendamentos")
    .select("perfil_id")
    .eq("id", agendamentoId)
    .maybeSingle();

  if (ag?.perfil_id) {
    const { data: perfil } = await admin
      .from("perfis")
      .select("asaas_api_key")
      .eq("id", ag.perfil_id)
      .maybeSingle();
    if (perfil?.asaas_api_key) return perfil.asaas_api_key;
  }

  return process.env.ASAAS_API_KEY!;
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
      return NextResponse.json(
        { error: "Parâmetros obrigatórios: agendamentoId, clienteNome, valor." },
        { status: 400 }
      );
    }

    // Resolução da API key: sub-conta do perfil > chave global
    const apiKey = await resolveApiKey(agendamentoId);

    // 1. Criar cliente na Asaas
    const custRes = await asaas(apiKey, "/customers", {
      method: "POST",
      body: JSON.stringify({
        name: clienteNome,
        ...(clienteCpf ? { cpfCnpj: clienteCpf.replace(/\D/g, "") } : {}),
        ...(clienteEmail ? { email: clienteEmail } : {}),
      }),
    });
    if (!custRes.ok) {
      const err = await custRes.json().catch(() => ({})) as { errors?: { description: string }[] };
      throw new Error(err?.errors?.[0]?.description ?? "Erro ao criar cliente na Asaas.");
    }
    const customer = (await custRes.json()) as { id: string };

    // 2. Criar cobrança PIX (lean payments)
    const dueDate = new Date().toISOString().slice(0, 10);
    const payRes = await asaas(apiKey, "/lean/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: customer.id,
        billingType: "PIX",
        value: valor,
        dueDate,
        externalReference: agendamentoId,
        description: "Agendamento Reserve Clinic",
      }),
    });
    if (!payRes.ok) {
      const err = await payRes.json().catch(() => ({})) as { errors?: { description: string }[] };
      throw new Error(err?.errors?.[0]?.description ?? "Erro ao criar cobrança PIX.");
    }
    const payment = (await payRes.json()) as { id: string };

    // 3. Buscar QR Code
    const qrRes = await asaas(apiKey, `/payments/${payment.id}/pixQrCode`);
    if (!qrRes.ok) throw new Error("Erro ao buscar QR Code PIX.");
    const qrData = (await qrRes.json()) as { encodedImage: string; payload: string };

    // 4. Salvar pix_id no agendamento
    await adminSupabase()
      .from("agendamentos")
      .update({ pix_id: payment.id })
      .eq("id", agendamentoId);

    return NextResponse.json({
      pixId: payment.id,
      qrCodeBase64: qrData.encodedImage,
      copiaECola: qrData.payload,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno ao gerar PIX.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

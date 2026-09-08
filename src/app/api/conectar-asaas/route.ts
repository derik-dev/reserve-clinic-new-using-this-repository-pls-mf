import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const ASAAS_BASE = process.env.ASAAS_BASE_URL ?? "https://api.asaas.com/v3";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    // 1. Autenticar usuário pelo token Bearer
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/, "");
    if (!token) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

    // 2. Buscar dados do perfil
    const admin = adminSupabase();
    const { data: perfil } = await admin
      .from("perfis")
      .select("nome, email_contato, cpf_cnpj, telefone, endereco_cep, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, asaas_conta_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!perfil) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    if (perfil.asaas_conta_id) return NextResponse.json({ error: "Conta Asaas já conectada.", jaConectado: true }, { status: 400 });
    if (!perfil.cpf_cnpj?.trim()) {
      return NextResponse.json(
        { error: "CPF/CNPJ é obrigatório. Preencha e salve as configurações antes de conectar ao Asaas." },
        { status: 400 }
      );
    }

    // 3. Criar sub-conta na Asaas
    const accountBody: Record<string, string> = {
      name: perfil.nome ?? "Clínica",
      email: perfil.email_contato ?? `${user.id}@reserveclinic.com`,
      cpfCnpj: perfil.cpf_cnpj.replace(/\D/g, ""),
      companyType: "INDIVIDUAL",
    };
    if (perfil.telefone) accountBody.phone = perfil.telefone.replace(/\D/g, "");
    if (perfil.endereco_cep) accountBody.postalCode = perfil.endereco_cep.replace(/\D/g, "");
    if (perfil.endereco_rua) accountBody.address = perfil.endereco_rua;
    if (perfil.endereco_numero) accountBody.addressNumber = perfil.endereco_numero;
    if (perfil.endereco_bairro) accountBody.province = perfil.endereco_bairro;
    if (perfil.endereco_cidade) accountBody.city = perfil.endereco_cidade;

    const accountRes = await fetch(`${ASAAS_BASE}/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: process.env.ASAAS_API_KEY!,
      },
      body: JSON.stringify(accountBody),
    });

    if (!accountRes.ok) {
      const err = await accountRes.json().catch(() => ({})) as { errors?: { description: string }[] };
      throw new Error(err?.errors?.[0]?.description ?? "Erro ao criar conta na Asaas.");
    }
    const account = (await accountRes.json()) as { id: string; apiKey: string; walletId?: string };

    // 4. Registrar webhook na sub-conta automaticamente
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    const appUrl = `${proto}://${host}`;
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN ?? "";

    await fetch(`${ASAAS_BASE}/webhooks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: account.apiKey,
      },
      body: JSON.stringify({
        name: "Reserve Clinic",
        url: `${appUrl}/api/webhook-asaas`,
        email: perfil.email_contato ?? "",
        sendType: "SEQUENTIALLY",
        enabled: true,
        authToken: webhookToken,
        events: ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"],
      }),
    }).catch(() => { /* webhook opcional — não bloqueia */ });

    // 5. Salvar credenciais no perfil
    await admin
      .from("perfis")
      .update({
        asaas_conta_id: account.id,
        asaas_api_key: account.apiKey,
        asaas_wallet_id: account.walletId ?? account.id,
      })
      .eq("id", user.id);

    return NextResponse.json({ sucesso: true, contaId: account.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

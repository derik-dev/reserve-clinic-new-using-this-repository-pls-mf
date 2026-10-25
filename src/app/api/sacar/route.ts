import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticateRequest } from "@/lib/apiAuth";
import { findPerfil, saldoDaClinica, type Perfil } from "@/lib/saldoClinica";

const ASAAS_BASE = process.env.ASAAS_BASE_URL ?? "https://api.asaas.com/v3";

function errorMessage(payload: unknown, fallback: string) {
  const body = payload as { errors?: { description?: string }[] } | null;
  return body?.errors?.[0]?.description ?? fallback;
}

function brl(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function digits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

// O destino do saque só pode ser uma chave que comprovadamente pertence à clínica.
// A chave aleatória (EVP) não pode ser verificada, então só vale se for a padrão do servidor.
function destinationBelongsToPerfil(perfil: Perfil, key: string, type: string) {
  if (type === "CPF" || type === "CNPJ") return digits(key) !== "" && digits(key) === digits(perfil.cpf_cnpj);
  if (type === "EMAIL") return !!perfil.email_contato && key.toLowerCase() === perfil.email_contato.trim().toLowerCase();
  if (type === "PHONE") {
    const own = digits(perfil.telefone);
    const sent = digits(key);
    return own !== "" && sent !== "" && (own === sent || own === sent.replace(/^55/, "") || sent === `55${own}`);
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return NextResponse.json({ error: "Sessão expirada. Entre novamente para sacar." }, { status: 401 });

    const apiKey = process.env.ASAAS_API_KEY;
    const defaultPixAddressKey = process.env.ASAAS_TRANSFER_PIX_KEY;
    const defaultPixAddressKeyType = process.env.ASAAS_TRANSFER_PIX_KEY_TYPE?.toUpperCase();
    if (!apiKey) return NextResponse.json({ error: "A integração financeira ainda não está configurada no servidor." }, { status: 503 });

    const body = await req.json().catch(() => null) as { value?: unknown; pixAddressKey?: unknown; pixAddressKeyType?: unknown } | null;
    const pixAddressKey = typeof body?.pixAddressKey === "string" && body.pixAddressKey.trim() ? body.pixAddressKey.trim() : defaultPixAddressKey;
    const pixAddressKeyType = typeof body?.pixAddressKeyType === "string" && body.pixAddressKeyType.trim() ? body.pixAddressKeyType.trim().toUpperCase() : defaultPixAddressKeyType;
    if (!pixAddressKey || !pixAddressKeyType) return NextResponse.json({ error: "Informe a chave Pix e o tipo da chave de destino." }, { status: 400 });
    if (!(["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"] as string[]).includes(pixAddressKeyType)) return NextResponse.json({ error: "Tipo de chave Pix inválido." }, { status: 400 });

    const value = typeof body?.value === "number" ? body.value : Number(body?.value);
    if (!Number.isFinite(value) || value <= 0) {
      return NextResponse.json({ error: "Informe um valor de saque maior que zero." }, { status: 400 });
    }
    if (Math.round(value * 100) !== value * 100) {
      return NextResponse.json({ error: "O valor deve ter no máximo duas casas decimais." }, { status: 400 });
    }

    const db = adminSupabase();
    const perfil = await findPerfil(db, user.id);
    if (!perfil) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });

    const usingServerDefault = !!defaultPixAddressKey && pixAddressKey === defaultPixAddressKey && pixAddressKeyType === defaultPixAddressKeyType;
    if (!usingServerDefault && !destinationBelongsToPerfil(perfil, pixAddressKey, pixAddressKeyType)) {
      return NextResponse.json({ error: "A chave Pix de destino precisa ser o CPF/CNPJ, e-mail ou telefone cadastrado no perfil da clínica." }, { status: 403 });
    }

    // DB-first: o registro "pendente" funciona como trava. O índice único parcial
    // (perfil_id onde status = 'pendente') impede dois saques simultâneos da mesma clínica.
    const { data: saque, error: insertError } = await db.from("saques").insert({
      perfil_id: perfil.id,
      valor: value,
      chave_pix: pixAddressKey,
      tipo_chave: pixAddressKeyType,
      status: "pendente",
    }).select("id").single();

    if (insertError?.code === "23505") {
      return NextResponse.json({ error: "Já existe um saque em andamento. Aguarde ele terminar para solicitar outro." }, { status: 409 });
    }
    if (insertError || !saque) {
      console.error("[api/sacar] erro ao registrar saque", insertError);
      return NextResponse.json({ error: "Não foi possível registrar o saque. Tente novamente." }, { status: 500 });
    }
    const saqueId = saque.id as string;

    async function fail(message: string, status: number) {
      await db.from("saques").update({ status: "falhou", error_message: message }).eq("id", saqueId);
      return NextResponse.json({ error: message }, { status });
    }

    const { error: saldoError, available: clinicAvailable } = await saldoDaClinica(db, perfil.id, saqueId);
    if (saldoError) {
      console.error("[api/sacar] erro ao calcular saldo da clínica", saldoError);
      return fail("Não foi possível calcular o saldo disponível. Tente novamente.", 500);
    }
    if (clinicAvailable < value) {
      return fail(`Saldo insuficiente. Disponível para saque: ${brl(Math.max(clinicAvailable, 0))}`, 422);
    }

    // Saldo real da conta Asaas: se não for possível confirmar, não saca.
    const balanceRes = await fetch(`${ASAAS_BASE}/finance/balance`, { headers: { access_token: apiKey }, cache: "no-store" });
    if (!balanceRes.ok) return fail("Não foi possível confirmar o saldo na Asaas. Tente novamente.", 502);
    const balanceData = await balanceRes.json().catch(() => ({})) as { balance?: number };
    if ((balanceData.balance ?? 0) < value) {
      return fail("Saldo indisponível na conta de pagamentos no momento. Tente novamente mais tarde.", 422);
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
      const errMsg = errorMessage(payload, "A Asaas não autorizou o saque. Verifique o saldo e os dados de destino.");
      return fail(errMsg, response.status >= 400 && response.status < 500 ? response.status : 502);
    }

    const transfer = payload as { id?: string; status?: string; value?: number; dateCreated?: string };
    await db.from("saques").update({
      asaas_transfer_id: transfer.id ?? null,
      status: "processando",
      approved_at: new Date().toISOString(),
    }).eq("id", saqueId);

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

import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticateRequest } from "@/lib/apiAuth";
import { findPerfil, saldoDaClinica } from "@/lib/saldoClinica";

const ASAAS_BASE = process.env.ASAAS_BASE_URL ?? "https://api.asaas.com/v3";

// Retorna o saldo disponível da clínica logada (nunca o saldo total da conta Asaas).
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
    if (!process.env.ASAAS_API_KEY) return NextResponse.json({ error: "A integração financeira ainda não está configurada no servidor." }, { status: 503 });

    const db = adminSupabase();
    const perfil = await findPerfil(db, user.id);
    if (!perfil) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });

    const { error, available } = await saldoDaClinica(db, perfil.id);
    if (error) {
      console.error("[api/saldo-asaas] erro ao calcular saldo da clínica", error);
      return NextResponse.json({ error: "Não foi possível calcular o saldo disponível agora." }, { status: 500 });
    }

    const response = await fetch(`${ASAAS_BASE}/finance/balance`, { headers: { access_token: process.env.ASAAS_API_KEY }, cache: "no-store" });
    const payload = await response.json().catch(() => ({})) as { balance?: number; errors?: { description?: string }[] };
    if (!response.ok) return NextResponse.json({ error: payload.errors?.[0]?.description ?? "Não foi possível consultar o saldo na Asaas." }, { status: 502 });

    return NextResponse.json({ balance: Math.max(0, Math.min(available, Number(payload.balance ?? 0))) });
  } catch (error) {
    console.error("[api/saldo-asaas] erro ao consultar saldo", error);
    return NextResponse.json({ error: "Não foi possível carregar o saldo disponível agora." }, { status: 500 });
  }
}

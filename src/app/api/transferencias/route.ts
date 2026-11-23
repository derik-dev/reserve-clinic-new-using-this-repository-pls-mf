import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticateRequest } from "@/lib/apiAuth";
import { findPerfil } from "@/lib/saldoClinica";

// Status internos do saque, na nomenclatura de status de transferência usada pelo painel.
const STATUS: Record<string, string> = { pendente: "PENDING", processando: "IN_BANK_PROCESSING", autorizado: "IN_BANK_PROCESSING", concluido: "DONE", falhou: "FAILED" };

// Histórico de saques da clínica logada (nunca as transferências de toda a conta Asaas).
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });

    const db = adminSupabase();
    const perfil = await findPerfil(db, user.id);
    if (!perfil) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });

    let limit = 20;
    const requestedLimit = Number(req.nextUrl.searchParams.get("limit"));
    if (Number.isInteger(requestedLimit) && requestedLimit > 0 && requestedLimit <= 100) limit = requestedLimit;
    let offset = 0;
    const requestedOffset = Number(req.nextUrl.searchParams.get("offset"));
    if (Number.isInteger(requestedOffset) && requestedOffset >= 0) offset = requestedOffset;

    const { data, error } = await db
      .from("saques")
      .select("id, valor, status, created_at")
      .eq("perfil_id", perfil.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit);
    if (error) {
      console.error("[api/transferencias] erro ao consultar saques", error);
      return NextResponse.json({ error: "Não foi possível carregar o histórico de saques agora." }, { status: 500 });
    }

    const rows = data ?? [];
    return NextResponse.json({
      transfers: rows.slice(0, limit).map((item) => ({ id: item.id, value: Number(item.valor), status: STATUS[item.status as string] ?? "PENDING", date: item.created_at ?? null })),
      hasMore: rows.length > limit,
    });
  } catch (error) {
    console.error("[api/transferencias] erro ao consultar histórico", error);
    return NextResponse.json({ error: "Não foi possível carregar o histórico de saques agora." }, { status: 500 });
  }
}

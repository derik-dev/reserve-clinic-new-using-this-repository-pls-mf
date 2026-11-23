import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/apiAuth";

// Mecanismo de validação de saque do Asaas: o Asaas chama esta rota ~5s depois de criar a
// transferência e só executa se a resposta for {"status":"APPROVED"}. Qualquer dúvida = REFUSED.
// Variável de ambiente: ASAAS_SAQUE_WEBHOOK_TOKEN (separada do token do webhook de Pix).

type Transfer = {
  id?: string;
  value?: number;
  pixAddressKey?: string | null;
  bankAccount?: { pixAddressKey?: string | null; cpfCnpj?: string | null } | null;
};
type Body = { type?: string; transfer?: Transfer };

const TENTATIVAS = 4; // 1 imediata + 3 repetições com 1s = ~3s de espera
const aguardar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const digits = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");
const cents = (n: number | string) => Math.round(Number(n) * 100);

function tokenValido(recebido: string | null, esperado: string) {
  const a = Buffer.from(recebido ?? "");
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

function recusar(motivo: string, transferId?: string, status = 200) {
  console.warn(`[webhook-saque] RECUSADO (${transferId ?? "sem id"}): ${motivo}`);
  return NextResponse.json({ status: "REFUSED", refuseReason: motivo }, { status });
}

/** true/false quando a chave do payload é comparável com a do saque; null quando não dá para comparar. */
function mesmaConta(saque: { chave_pix: string; tipo_chave: string }, transfer: Transfer): boolean | null {
  const pixKey = transfer.pixAddressKey ?? transfer.bankAccount?.pixAddressKey ?? null;
  if (typeof pixKey === "string" && pixKey.trim()) {
    if (saque.tipo_chave === "EMAIL" || saque.tipo_chave === "EVP") return pixKey.trim().toLowerCase() === saque.chave_pix.trim().toLowerCase();
    const enviada = digits(pixKey);
    const esperada = digits(saque.chave_pix);
    if (!enviada || !esperada) return null;
    return enviada === esperada || enviada === `55${esperada}` || `55${enviada}` === esperada;
  }
  const doc = digits(transfer.bankAccount?.cpfCnpj);
  if (doc && (saque.tipo_chave === "CPF" || saque.tipo_chave === "CNPJ")) return doc === digits(saque.chave_pix);
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const token = process.env.ASAAS_SAQUE_WEBHOOK_TOKEN;
    const body = await req.json().catch(() => null) as Body | null;
    const transfer = body?.transfer;
    const transferId = transfer?.id;

    if (!token) return recusar("Autorização de saque indisponível: token não configurado.", transferId);
    if (!tokenValido(req.headers.get("asaas-access-token"), token)) return recusar("Token do webhook inválido.", transferId, 401);
    if (!body || body.type !== "TRANSFER") return recusar("Tipo de evento não suportado.", transferId);
    if (!transfer || !transferId || typeof transfer.value !== "number") return recusar("Transferência sem id ou valor.", transferId);

    const db = adminSupabase();

    // O webhook pode chegar antes de o /api/sacar gravar o id e passar o saque para "processando".
    type Saque = { id: string; status: string; valor: number | string; chave_pix: string; tipo_chave: string };
    let saque: Saque | null = null;
    for (let tentativa = 1; tentativa <= TENTATIVAS; tentativa++) {
      const { data, error } = await db.from("saques")
        .select("id, status, valor, chave_pix, tipo_chave")
        .eq("asaas_transfer_id", transferId)
        .maybeSingle();
      if (error) return recusar("Erro ao consultar o saque.", transferId);
      if (data && (data as Saque).status !== "pendente") { saque = data as Saque; break; }
      if (tentativa < TENTATIVAS) await aguardar(1000);
    }
    if (!saque) return recusar("Saque não encontrado no Reserve Clinic.", transferId);

    if (saque.status === "autorizado") return recusar("Saque já foi autorizado antes.", transferId);
    if (saque.status !== "processando") return recusar(`Saque com status "${saque.status}" não pode ser autorizado.`, transferId);
    if (cents(saque.valor) !== cents(transfer.value)) return recusar("Valor da transferência diferente do saque solicitado.", transferId);

    const conta = mesmaConta(saque, transfer);
    if (conta === false) return recusar("Conta de destino diferente da solicitada.", transferId);
    if (conta === null) {
      // Não deu para comparar o destino: aprova só pelo valor e registra o payload para ajustar a regra.
      console.warn(`[webhook-saque] destino não verificável (${transferId}); payload: ${JSON.stringify(body)}`);
    }

    // Trava atômica: só um webhook consegue passar de "processando" para "autorizado".
    const { data: marcado, error: marcarError } = await db.from("saques")
      .update({ status: "autorizado", autorizado_em: new Date().toISOString() })
      .eq("id", saque.id)
      .eq("status", "processando")
      .select("id");
    if (marcarError) return recusar("Erro ao registrar a autorização.", transferId);
    if (!marcado || marcado.length === 0) return recusar("Saque já foi autorizado antes.", transferId);

    console.log(`[webhook-saque] APROVADO (${transferId}) valor=${transfer.value} destino=${conta === true ? "conferido" : "não verificável"}`);
    return NextResponse.json({ status: "APPROVED" });
  } catch (e) {
    console.error("[webhook-saque] erro inesperado:", e instanceof Error ? e.message : e);
    return recusar("Erro interno ao validar o saque.");
  }
}

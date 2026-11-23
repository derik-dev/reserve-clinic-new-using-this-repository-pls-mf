import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/apiAuth";
import { rateLimited } from "@/lib/rateLimit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Status de um agendamento, para a tela do paciente saber quando o Pix foi pago.
 * O paciente é anônimo e `agendamentos` só é legível pelo dono da clínica, então a consulta
 * é feita aqui no servidor. Devolve só o status e exige o id (aleatório) do agendamento.
 */
export async function GET(req: NextRequest) {
  if (rateLimited(req, "status-agendamento", 180, 60 * 1000)) {
    return NextResponse.json({ error: "Muitas consultas. Aguarde um instante." }, { status: 429 });
  }

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!UUID.test(id)) return NextResponse.json({ error: "Agendamento inválido." }, { status: 400 });

  const { data, error } = await adminSupabase().from("agendamentos").select("status").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: "Não foi possível consultar agora." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });

  return NextResponse.json({ status: data.status as string }, { headers: { "Cache-Control": "no-store" } });
}

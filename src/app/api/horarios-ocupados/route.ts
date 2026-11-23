import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/apiAuth";
import { rateLimited } from "@/lib/rateLimit";
import { isStaleHold, type ConsultaRef } from "@/lib/reservas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_RANGE_MS = 62 * 24 * 3600_000;

/**
 * Horários ocupados de uma clínica (e de um profissional, se informado) num período, para o
 * calendário do link público. Fica no servidor para poder ignorar reservas vencidas (Pix não pago)
 * e para o paciente anônimo não precisar ler a tabela de consultas. Devolve só horário e duração.
 */
export async function GET(req: NextRequest) {
  if (rateLimited(req, "horarios-ocupados", 90, 60 * 1000)) {
    return NextResponse.json({ error: "Muitas consultas. Aguarde um instante." }, { status: 429 });
  }

  const p = req.nextUrl.searchParams;
  const perfil = p.get("perfil") ?? "";
  const profissional = p.get("profissional") ?? "";
  const from = new Date(p.get("from") ?? "");
  const to = new Date(p.get("to") ?? "");
  if (!UUID.test(perfil) || (profissional && !UUID.test(profissional)) || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from || to.getTime() - from.getTime() > MAX_RANGE_MS) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  let query = adminSupabase().from("consultas")
    .select("id, status, valor, origem, created_at, profissional, profissional_id, data_hora, duracao_min")
    .eq("perfil_id", perfil)
    .neq("status", "cancelada")
    .gte("data_hora", from.toISOString())
    .lte("data_hora", to.toISOString());
  if (profissional) query = query.eq("profissional_id", profissional);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Não foi possível consultar os horários agora." }, { status: 500 });

  const now = Date.now();
  const busy = ((data as ConsultaRef[] | null) ?? [])
    .filter(c => !isStaleHold(c, now))
    .map(c => ({ data_hora: c.data_hora, duracao_min: c.duracao_min }));
  return NextResponse.json({ busy }, { headers: { "Cache-Control": "no-store" } });
}

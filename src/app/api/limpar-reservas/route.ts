import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/apiAuth";
import { consultaDoAgendamento } from "@/lib/reservas";

const ASAAS_BASE = process.env.ASAAS_BASE_URL ?? "https://api.asaas.com/v3";
/** Só cancela reservas com mais de 2h sem pagamento (bem depois dos 30 min em que o horário já fica livre). */
const CANCEL_AFTER_MS = 2 * 3600_000;
const BATCH = 200;
/** Consulta que continua "aguardando" 48h depois do horário marcado é excluída. */
const DELETE_AFTER_PAST_MS = 48 * 3600_000;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const received = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Limpeza diária (Vercel Cron): cancela as reservas do link público cujo Pix nunca foi pago e
 * cancela a cobrança pendente na Asaas, para ninguém pagar um horário que já foi liberado.
 * A Vercel envia `Authorization: Bearer $CRON_SECRET` quando a variável CRON_SECRET existe.
 */
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) return NextResponse.json({ error: "CRON_SECRET não configurado." }, { status: 503 });
  if (!authorized(req)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const admin = adminSupabase();
  const limite = new Date(Date.now() - CANCEL_AFTER_MS).toISOString();
  const { data: pendentes, error } = await admin.from("agendamentos")
    .select("id, perfil_id, cliente_nome, data, hora, pix_id")
    .eq("status", "aguardando_pagamento")
    .lt("created_at", limite)
    .limit(BATCH);
  if (error) return NextResponse.json({ error: "Falha ao consultar agendamentos." }, { status: 500 });

  let canceladas = 0;
  let ignoradas = 0;
  for (const ag of pendentes ?? []) {
    try {
      const consulta = await consultaDoAgendamento(admin, ag);
      // Sem cobrança online (consulta sem valor ou criada pelo painel), quem confirma é a clínica.
      if (!consulta || consulta.status !== "aguardando" || consulta.origem !== "publico" || Number(consulta.valor ?? 0) <= 0) { ignoradas++; continue; }

      await admin.from("consultas").update({ status: "cancelada" }).eq("id", consulta.id);
      await admin.from("agendamentos").update({ status: "cancelado" }).eq("id", ag.id);
      if (ag.pix_id && process.env.ASAAS_API_KEY) {
        await fetch(`${ASAAS_BASE}/payments/${ag.pix_id}`, { method: "DELETE", headers: { access_token: process.env.ASAAS_API_KEY } }).catch(() => { /* melhor esforço */ });
      }
      canceladas++;
    } catch (e) {
      console.error("[limpar-reservas] falha ao cancelar reserva", ag.id, e instanceof Error ? e.message : e);
    }
  }

  // Atendimento que já passou há mais de 48h e nunca foi confirmado/pago: exclui.
  const passou = new Date(Date.now() - DELETE_AFTER_PAST_MS).toISOString();
  const { data: excluidas, error: delError } = await admin.from("consultas")
    .delete()
    .eq("status", "aguardando")
    .lt("data_hora", passou)
    .select("id");
  if (delError) console.error("[limpar-reservas] falha ao excluir consultas vencidas:", delError.message);

  return NextResponse.json({ analisadas: pendentes?.length ?? 0, canceladas, ignoradas, excluidas: excluidas?.length ?? 0 });
}

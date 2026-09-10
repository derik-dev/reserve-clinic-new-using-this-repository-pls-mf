import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { notificarDiscord } from "@/lib/notificarDiscord";

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

export async function GET() {
  const inicio = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { error } = await supabase.from("perfis").select("id", { count: "exact", head: true }).limit(1);
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, latencyMs: Date.now() - inicio });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await notificarDiscord(`🔴 Supabase inacessível às ${horaAgora()} (healthcheck): ${msg}`, "critico");
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

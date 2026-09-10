import { NextRequest, NextResponse } from "next/server";
import { notificarDiscord } from "@/lib/notificarDiscord";

function horaAgora() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

export async function POST(req: NextRequest) {
  try {
    const { contexto, mensagem } = (await req.json()) as {
      contexto?: string;
      mensagem?: string;
    };

    if (!contexto || !mensagem) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const contextoSanitizado = String(contexto).slice(0, 80);
    const mensagemSanitizada = String(mensagem).slice(0, 400);

    await notificarDiscord(
      `🔴 Erro no cliente (${contextoSanitizado}) às ${horaAgora()}: ${mensagemSanitizada}`,
      "critico"
    );
  } catch {
    // silencioso
  }
  return NextResponse.json({ ok: true });
}

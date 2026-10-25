import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticateRequest } from "@/lib/apiAuth";
import { enviarWhatsapp } from "@/lib/enviarWhatsapp";

const MAX_MESSAGE_LENGTH = 1000;

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });

  const body = await req.json().catch(() => null) as { phone?: unknown; message?: unknown } | null;
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!phone || !message) {
    return NextResponse.json({ error: "Telefone e mensagem são obrigatórios." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `A mensagem pode ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.` }, { status: 400 });
  }

  // Só envia para telefones de pacientes da própria clínica
  const { data: paciente } = await adminSupabase()
    .from("pacientes")
    .select("id")
    .eq("perfil_id", user.id)
    .eq("telefone", phone)
    .limit(1)
    .maybeSingle();
  if (!paciente) {
    return NextResponse.json({ error: "Este telefone não pertence a um paciente da sua clínica." }, { status: 403 });
  }

  try {
    await enviarWhatsapp(phone, message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[zapi-send] falha ao enviar WhatsApp:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Não foi possível enviar a mensagem agora." }, { status: 502 });
  }
}

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { perfilId, clienteNome, clienteTelefone, clienteEmail, data, hora } =
      (await req.json()) as {
        perfilId: string;
        clienteNome: string;
        clienteTelefone?: string;
        clienteEmail?: string;
        data: string;
        hora: string;
      };

    if (!perfilId || !clienteNome || !data || !hora) {
      return NextResponse.json({ error: "Parâmetros obrigatórios ausentes." }, { status: 400 });
    }

    const id = crypto.randomUUID();

    const { error } = await adminSupabase()
      .from("agendamentos")
      .insert({
        id,
        perfil_id: perfilId,
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone || null,
        cliente_email: clienteEmail || null,
        data,
        hora,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

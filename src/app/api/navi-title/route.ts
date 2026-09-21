import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

async function getAuthenticatedUser(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data, error } = await client.auth.getUser(token);
  return error || !data.user ? null : data.user;
}

function extractText(payload: unknown) {
  const body = payload as { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] };
  if (body.output_text?.trim()) return body.output_text.trim();
  return (body.output ?? [])
    .flatMap(item => (item as { content?: { type?: string; text?: string }[] }).content ?? [])
    .filter(p => p.type === "output_text" && p.text)
    .map(p => p.text)
    .join("")
    .trim();
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API não configurada." }, { status: 503 });

  const body = await req.json().catch(() => null) as { messages?: { role: string; content: string }[] } | null;
  const msgs = body?.messages ?? [];

  const firstUser = msgs.find(m => m.role === "user")?.content ?? "";
  const firstAssistant = msgs.find(m => m.role === "assistant")?.content ?? "";

  if (!firstUser) return NextResponse.json({ title: "Conversa" });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      instructions: "Gere um título curto (3 a 6 palavras, em português brasileiro) que resuma o assunto desta conversa. Retorne SOMENTE o título, sem pontuação no final, sem aspas, sem explicações.",
      input: [{
        role: "user",
        content: `Usuário: "${firstUser.slice(0, 400)}"\n\nResposta: "${firstAssistant.slice(0, 400)}"`,
      }],
      max_output_tokens: 25,
      store: false,
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  const title = extractText(payload) || firstUser.slice(0, 60);

  return NextResponse.json({ title });
}

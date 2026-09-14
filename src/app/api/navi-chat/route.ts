import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const SYSTEM_INSTRUCTIONS = `Você é o Navi, assistente amigável e profissional do Reserve Clinic, um SaaS brasileiro para clínicas. Responda em português do Brasil, com clareza e frases curtas. Ajude com: cadastrar profissionais, configurar disponibilidade, cadastrar pacientes, criar consultas, compartilhar o link público e entender o dashboard. Não invente funções, não peça senhas, tokens, chaves ou dados financeiros sensíveis. Quando a pergunta exigir uma ação que você não pode executar, explique o caminho na interface. Não dê orientação médica.`;

async function isAuthenticated(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/, "").trim();
  if (!token) return false;
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  return !error && Boolean(data.user);
}

function extractText(payload: unknown) {
  const body = payload as { output_text?: string; output?: { content?: { type?: string; text?: string }[] }[] };
  if (body.output_text?.trim()) return body.output_text.trim();
  return (body.output ?? []).flatMap((item) => item.content ?? []).filter((part) => part.type === "output_text" && part.text).map((part) => part.text).join("\n").trim();
}

export async function POST(req: NextRequest) {
  try {
    if (!await isAuthenticated(req)) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "O assistente ainda não está configurado no servidor." }, { status: 503 });
    const body = await req.json().catch(() => null) as { messages?: { role?: string; content?: string }[] } | null;
    const messages = (body?.messages ?? []).filter((message) => (message.role === "user" || message.role === "assistant") && typeof message.content === "string").slice(-10).map((message) => ({ role: message.role!, content: message.content!.slice(0, 1200) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") return NextResponse.json({ error: "Envie uma mensagem para o Navi." }, { status: 400 });

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", instructions: SYSTEM_INSTRUCTIONS, input: messages, max_output_tokens: 300, store: false }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("[api/navi-chat] OpenAI recusou a solicitação", response.status);
      return NextResponse.json({ error: "O Navi não conseguiu responder agora. Tente novamente em instantes." }, { status: 502 });
    }
    const answer = extractText(payload);
    if (!answer) return NextResponse.json({ error: "O Navi não retornou uma resposta desta vez." }, { status: 502 });
    return NextResponse.json({ message: answer });
  } catch (error) {
    console.error("[api/navi-chat] erro inesperado", error);
    return NextResponse.json({ error: "Não foi possível falar com o Navi agora." }, { status: 500 });
  }
}

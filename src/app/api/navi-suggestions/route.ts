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
  if (!user) return NextResponse.json({ suggestions: [] });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ suggestions: [] });

  const body = await req.json().catch(() => null) as { userMessage?: string; assistantMessage?: string } | null;
  const userMsg = body?.userMessage?.slice(0, 400) ?? "";
  const assistantMsg = body?.assistantMessage?.slice(0, 600) ?? "";
  if (!userMsg) return NextResponse.json({ suggestions: [] });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      instructions: "Gere exatamente 3 perguntas de follow-up curtas (até 8 palavras cada) em português brasileiro que o usuário poderia fazer em seguida. Retorne SOMENTE as 3 perguntas separadas por | sem numeração, sem aspas, sem explicações.",
      input: [{
        role: "user",
        content: `Pergunta do usuário: "${userMsg}"\nResposta do assistente: "${assistantMsg}"\n\nGere 3 perguntas de follow-up:`,
      }],
      max_output_tokens: 80,
      store: false,
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  const raw = extractText(payload);
  const suggestions = raw
    .split("|")
    .map(s => s.trim())
    .filter(s => s.length > 0 && s.length < 80)
    .slice(0, 3);

  return NextResponse.json({ suggestions });
}

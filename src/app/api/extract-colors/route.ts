import { NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export async function POST(req: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY não configurada" }, { status: 500 });
  }

  let body: { imageBase64?: string; mimeType?: string; imageUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const imageContent = body.imageUrl
    ? { type: "image_url", image_url: { url: body.imageUrl } }
    : body.imageBase64 && body.mimeType
    ? { type: "image_url", image_url: { url: `data:${body.mimeType};base64,${body.imageBase64}` } }
    : null;

  if (!imageContent) {
    return NextResponse.json({ error: "imagem não fornecida" }, { status: 400 });
  }

  const prompt = "Você é um assistente de design de marca. Olhe a logo enviada e escolha exatamente DUAS cores dominantes que representam a marca: uma cor primária (a mais forte / mais usada) e uma cor secundária que combine e crie contraste. Ignore preto puro, branco puro e cinzas neutros. Responda APENAS em JSON válido no formato exato: {\"primary\":\"#RRGGBB\",\"secondary\":\"#RRGGBB\"}. Sem texto adicional, sem markdown.";

  const groqRes = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.1,
      max_tokens: 80,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: [{ type: "text", text: prompt }, imageContent] }],
    }),
  });

  if (!groqRes.ok) {
    const detail = await groqRes.text();
    return NextResponse.json({ error: "Falha na análise da imagem", detail }, { status: 502 });
  }

  const data = await groqRes.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "";

  let parsed: { primary?: string; secondary?: string } = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    const matches = raw.match(/#[0-9a-fA-F]{6}/g);
    if (matches && matches.length >= 2) parsed = { primary: matches[0], secondary: matches[1] };
  }

  const hex = /^#[0-9a-fA-F]{6}$/;
  if (!parsed.primary || !parsed.secondary || !hex.test(parsed.primary) || !hex.test(parsed.secondary)) {
    return NextResponse.json({ error: "Não foi possível identificar as cores", raw }, { status: 422 });
  }

  return NextResponse.json({ primary: parsed.primary.toLowerCase(), secondary: parsed.secondary.toLowerCase() });
}

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/responses";

const BASE_INSTRUCTIONS = `Você é o Navi, assistente amigável e profissional do Reserve Clinic, um SaaS brasileiro para clínicas.

Responda em português do Brasil, com clareza, objetividade e frases curtas. Estruture suas respostas seguindo este padrão sempre que possível:
1. Comece pela resposta principal e responda diretamente ao que foi perguntado.
2. Explique brevemente o motivo ou o contexto necessário.
3. Organize os detalhes em uma sequência lógica, como problema → solução, causa → ação ou passo 1 → passo 2 → passo 3.
4. Termine com uma conclusão prática quando fizer sentido, deixando claro o que o usuário deve fazer em seguida.

Evite introduções desnecessárias, repetições, textões e blocos grandes de texto. Use parágrafos curtos. Use listas, títulos curtos, passos numerados e negrito apenas quando melhorarem a organização ou destacarem algo importante. Para perguntas simples, responda de forma simples; aprofunde somente quando necessário. Adapte o nível técnico ao usuário.

Quando o usuário pedir para consultar, cadastrar, editar ou excluir dados, use a ferramenta manage_clinic_data. Para alterações, a ferramenta propõe a ação e aguarda confirmação no chat. Ajude com: cadastrar profissionais, configurar disponibilidade, cadastrar pacientes, criar consultas, compartilhar o link público e entender o dashboard. Não invente funções, não peça senhas, tokens, chaves ou dados financeiros sensíveis. Quando a pergunta exigir uma ação que você não pode executar, explique o caminho na interface. Não dê orientação médica.

REGRA CRÍTICA — coleta de dados antes de chamar a ferramenta:
Antes de chamar manage_clinic_data para criar ou editar, você DEVE ter todos os campos obrigatórios em mãos. Se faltar algum, NÃO chame a ferramenta ainda. Em vez disso, liste TODOS os campos que faltam em uma única mensagem e aguarde o usuário responder com tudo de uma vez. Nunca peça um campo por vez em mensagens separadas — isso é proibido. Só chame a ferramenta quando tiver todos os obrigatórios.

REGRA CRÍTICA — editar ou excluir sem ID:
Para update ou delete, você precisa do ID interno do registro. Se o ID não estiver no histórico desta conversa, faça primeiro uma operação read para localizar o registro pelo nome, data ou outra informação que o usuário forneceu. O resultado do read virá com o ID de cada registro. Use esse ID para então propor a operação de update ou delete. Nunca tente editar ou excluir sem ter o ID em mãos.

Campos por entidade — o que coletar antes de chamar a ferramenta:

Consulta:
- paciente_nome — OBRIGATÓRIO
- data_hora (peça ao usuário a data e hora em qualquer formato natural, ex: "22 de setembro às 14h") — OBRIGATÓRIO
- profissional (nome do profissional) — opcional. IMPORTANTE: se o usuário informar um profissional, verifique se o nome consta na lista de "Profissionais ativos" do contexto. Se não existir, NÃO crie a consulta — informe que o profissional não está cadastrado e liste os disponíveis. Se existir, passe o nome normalmente — o valor da consulta será preenchido automaticamente pelo sistema.
- paciente_telefone — opcional
- paciente_email — opcional
- cpf do paciente (salvar em observacoes) — opcional
- status (valores possíveis: aguardando, confirmada, concluida, cancelada; padrão: aguardando) — opcional

Profissional:
- nome — OBRIGATÓRIO
- especialidade — opcional
- whatsapp — opcional
- cpf — opcional
- crm — opcional
- anos_experiencia (número inteiro) — opcional
- valor_consulta (em reais) — opcional
A foto é adicionada no card de confirmação — não peça na conversa.

Paciente:
- nome — OBRIGATÓRIO
- telefone — opcional
- email — opcional
- cpf — opcional
- data_nascimento (formato YYYY-MM-DD) — opcional
- observacoes — opcional

Nunca divida em múltiplas perguntas — liste tudo de uma vez e aguarde o usuário responder. Não mencione quais campos são obrigatórios ou opcionais na lista.

Ao montar o campo data_hora para uma consulta, converta automaticamente qualquer formato que o usuário usar para ISO 8601 (YYYY-MM-DDTHH:MM:00) antes de chamar a ferramenta. Exemplos: "21 de setembro" → use o ano atual do contexto; "amanhã às 14h" → calcule a partir da data de hoje no contexto; "21/09 às 15h" → "2026-09-21T15:00:00"; "segunda que vem" → calcule o próximo dia correspondente. Se o usuário não informar o horário, use 08:00 como padrão. Nunca passe a data em texto livre para a ferramenta — sempre converta para ISO antes.

Quando responder perguntas sobre agenda, consultas, pacientes ou profissionais, baseie-se nos dados reais fornecidos abaixo. Não invente dados que não estejam no contexto.

Quando o usuário pedir um relatório ou análise de desempenho, gere uma resposta estruturada com:
- Título com o período coberto
- Métricas principais em negrito
- Tabelas markdown para dados comparativos (receita por profissional, consultas por status, etc.)
- Insights práticos baseados nos números
- Recomendação objetiva ao final
Use os dados históricos reais dos últimos 30 dias disponíveis no contexto. Se os dados forem insuficientes para uma análise completa, deixe isso claro e mostre o que for possível.`;

async function getAuthenticatedUser(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await anonClient.auth.getUser(token);
  if (error || !data.user) return null;
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  return { user: data.user, client };
}

type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
type DayConfig = { aberto: boolean; inicio: string; fim: string };

const DAY_LABELS: Record<DayKey, string> = {
  seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb", dom: "Dom",
};
const DAY_ORDER: DayKey[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(v: number | null | undefined) {
  if (v == null) return "—";
  return `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

const STATUS_PT: Record<string, string> = {
  aguardando: "aguardando pagamento",
  confirmada: "confirmada",
  concluida: "concluída",
  cancelada: "cancelada",
};

type ConsultaHistorico = { data_hora: string; status: string; paciente_nome: string; profissional?: string; valor?: number | null; duracao_min?: number | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildClinicContext(client: any, userId: string): Promise<string> {
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const sevenDaysLater = new Date(now); sevenDaysLater.setDate(now.getDate() + 7);
  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30); thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [perfilRes, profsRes, consultasHojeRes, consultasProximasRes, pacientesRes, configRes, historico30Res] = await Promise.all([
    client.from("perfis")
      .select("nome, slug, tipo, valor_consulta")
      .eq("id", userId)
      .maybeSingle(),
    client.from("profissionais")
      .select("nome, especialidade, valor_consulta, ativo")
      .eq("perfil_id", userId)
      .eq("ativo", true)
      .order("nome"),
    client.from("consultas")
      .select("data_hora, status, paciente_nome, profissional, valor, duracao_min")
      .eq("perfil_id", userId)
      .gte("data_hora", todayStart.toISOString())
      .lte("data_hora", todayEnd.toISOString())
      .order("data_hora"),
    client.from("consultas")
      .select("data_hora, status, paciente_nome, profissional, valor")
      .eq("perfil_id", userId)
      .gt("data_hora", todayEnd.toISOString())
      .lte("data_hora", sevenDaysLater.toISOString())
      .neq("status", "cancelada")
      .order("data_hora")
      .limit(20),
    client.from("pacientes")
      .select("status", { count: "exact", head: true })
      .eq("perfil_id", userId),
    client.from("configuracoes")
      .select("agenda_config")
      .eq("perfil_id", userId)
      .maybeSingle(),
    client.from("consultas")
      .select("data_hora, status, paciente_nome, profissional, valor, duracao_min")
      .eq("perfil_id", userId)
      .gte("data_hora", thirtyDaysAgo.toISOString())
      .lt("data_hora", todayStart.toISOString())
      .order("data_hora", { ascending: false })
      .limit(500),
  ]);

  const lines: string[] = [];
  const dateStr = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  lines.push(`## Contexto real da clínica — ${dateStr}`);
  lines.push("");

  const perfil = perfilRes.data as { nome?: string; slug?: string; tipo?: string; valor_consulta?: number | null } | null;
  if (perfil) {
    const tipo = perfil.tipo === "autonomo" ? "Profissional autônomo" : "Clínica";
    const linkPub = perfil.slug ? `reserveclinic.com/agendamento/${perfil.slug}` : "não configurado";
    lines.push(`**Clínica:** ${perfil.nome ?? "sem nome"} | ${tipo} | Valor padrão: ${formatCurrency(perfil.valor_consulta ?? null)} | Link público: ${linkPub}`);
    lines.push("");
  }

  const profs = (profsRes.data ?? []) as { nome: string; especialidade?: string; valor_consulta?: number | null }[];
  if (profs.length === 0) {
    lines.push("**Profissionais ativos:** nenhum cadastrado.");
  } else {
    lines.push(`**Profissionais ativos (${profs.length}):**`);
    profs.forEach(p => {
      lines.push(`- ${p.nome}${p.especialidade ? ` | ${p.especialidade}` : ""} | ${formatCurrency(p.valor_consulta ?? null)}`);
    });
  }
  lines.push("");

  const hoje = (consultasHojeRes.data ?? []) as { data_hora: string; status: string; paciente_nome: string; profissional?: string; valor?: number }[];
  if (hoje.length === 0) {
    lines.push("**Consultas hoje:** nenhuma agendada.");
  } else {
    lines.push(`**Consultas hoje (${hoje.length}):**`);
    hoje.forEach(c => {
      const st = STATUS_PT[c.status] ?? c.status;
      lines.push(`- ${formatTime(c.data_hora)} | ${c.paciente_nome} | ${st}${c.profissional ? ` | ${c.profissional}` : ""}${c.valor ? ` | ${formatCurrency(c.valor)}` : ""}`);
    });
    const counts: Record<string, number> = {};
    hoje.forEach(c => { counts[c.status] = (counts[c.status] ?? 0) + 1; });
    const resumo = Object.entries(counts).map(([s, n]) => `${n} ${STATUS_PT[s] ?? s}`).join(", ");
    lines.push(`  Resumo: ${resumo}`);
  }
  lines.push("");

  const proximas = (consultasProximasRes.data ?? []) as { data_hora: string; status: string; paciente_nome: string; profissional?: string }[];
  if (proximas.length === 0) {
    lines.push("**Próximas consultas (7 dias):** nenhuma.");
  } else {
    lines.push(`**Próximas consultas — próximos 7 dias (${proximas.length}):**`);
    proximas.forEach(c => {
      const st = STATUS_PT[c.status] ?? c.status;
      lines.push(`- ${formatDate(c.data_hora)} ${formatTime(c.data_hora)} | ${c.paciente_nome} | ${st}${c.profissional ? ` | ${c.profissional}` : ""}`);
    });
  }
  lines.push("");

  const totalPacientes = pacientesRes.count ?? 0;
  lines.push(`**Pacientes cadastrados:** ${totalPacientes}`);
  lines.push("");

  const agendaRaw = (configRes.data as { agenda_config?: unknown } | null)?.agenda_config as { dias?: Record<DayKey, DayConfig>; duracao_min?: number } | null;
  if (agendaRaw?.dias) {
    const diasAbertos = DAY_ORDER
      .filter(k => agendaRaw.dias![k]?.aberto)
      .map(k => `${DAY_LABELS[k]} ${agendaRaw.dias![k].inicio}–${agendaRaw.dias![k].fim}`);
    lines.push(`**Disponibilidade:** ${diasAbertos.length ? diasAbertos.join(", ") : "não configurada"}`);
    lines.push(`**Duração padrão da consulta:** ${agendaRaw.duracao_min ?? 60} min`);
  } else {
    lines.push("**Disponibilidade:** não configurada");
  }
  lines.push("");

  // Histórico e métricas dos últimos 30 dias
  const hist30 = (historico30Res.data ?? []) as ConsultaHistorico[];
  const periodoStr = `${thirtyDaysAgo.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} a ${new Date(todayStart.getTime() - 1).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
  lines.push(`## Histórico dos últimos 30 dias (${periodoStr})`);
  lines.push("");

  if (hist30.length === 0) {
    lines.push("Nenhuma consulta registrada nos últimos 30 dias.");
  } else {
    const concluidas30 = hist30.filter(c => c.status === "concluida");
    const canceladas30 = hist30.filter(c => c.status === "cancelada");
    const aguardando30 = hist30.filter(c => c.status === "aguardando");
    const receita30 = concluidas30.reduce((s, c) => s + (c.valor ?? 0), 0);
    const ticketMedio = concluidas30.length > 0 ? receita30 / concluidas30.length : 0;
    const taxaConclusao = Math.round((concluidas30.length / hist30.length) * 100);
    const taxaCancelamento = Math.round((canceladas30.length / hist30.length) * 100);

    lines.push(`**Total de consultas:** ${hist30.length} | Concluídas: ${concluidas30.length} | Canceladas: ${canceladas30.length} | Aguardando: ${aguardando30.length}`);
    lines.push(`**Receita total (concluídas):** ${formatCurrency(receita30)} | Ticket médio: ${formatCurrency(ticketMedio)}`);
    lines.push(`**Taxa de conclusão:** ${taxaConclusao}% | **Taxa de cancelamento:** ${taxaCancelamento}%`);
    lines.push("");

    // Receita e volume por profissional
    const porProf: Record<string, { count: number; concluidas: number; receita: number }> = {};
    hist30.forEach(c => {
      const prof = c.profissional || "Sem profissional";
      if (!porProf[prof]) porProf[prof] = { count: 0, concluidas: 0, receita: 0 };
      porProf[prof].count++;
      if (c.status === "concluida") { porProf[prof].concluidas++; porProf[prof].receita += c.valor ?? 0; }
    });
    const profsOrdenados = Object.entries(porProf).sort((a, b) => b[1].receita - a[1].receita);
    if (profsOrdenados.length > 0) {
      lines.push("**Desempenho por profissional (30 dias):**");
      lines.push("| Profissional | Consultas | Concluídas | Receita |");
      lines.push("|---|---|---|---|");
      profsOrdenados.forEach(([nome, d]) => {
        lines.push(`| ${nome} | ${d.count} | ${d.concluidas} | ${formatCurrency(d.receita)} |`);
      });
      lines.push("");
    }

    // Top pacientes
    const porPaciente: Record<string, number> = {};
    hist30.forEach(c => { porPaciente[c.paciente_nome] = (porPaciente[c.paciente_nome] ?? 0) + 1; });
    const topPacientes = Object.entries(porPaciente).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (topPacientes.length > 0) {
      lines.push(`**Top pacientes (30 dias):** ${topPacientes.map(([n, q]) => `${n} (${q})`).join(", ")}`);
      lines.push("");
    }

    // Volume por semana
    const porSemana: Record<string, number> = {};
    hist30.forEach(c => {
      const d = new Date(c.data_hora);
      const seg = new Date(d); seg.setDate(d.getDate() - d.getDay() + 1);
      const key = seg.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      porSemana[key] = (porSemana[key] ?? 0) + 1;
    });
    const semanas = Object.entries(porSemana).sort((a, b) => a[0].localeCompare(b[0]));
    if (semanas.length > 1) {
      lines.push(`**Volume por semana:** ${semanas.map(([s, n]) => `semana de ${s}: ${n}`).join(" | ")}`);
    }
  }

  return lines.join("\n");
}

function extractAction(payload: unknown) {
  const body = payload as { output?: { type?: string; name?: string; arguments?: string }[] };
  const call = (body.output ?? []).find((item) => item.type === "function_call" && item.name === "manage_clinic_data");
  if (!call?.arguments) return null;
  try { return JSON.parse(call.arguments); } catch { return null; }
}

const TOOL_DEF = {
  type: "function",
  name: "manage_clinic_data",
  description: "Consulta ou propõe cadastrar, editar ou excluir dados da clínica. Para alterações, sempre aguarde a confirmação do usuário.",
  strict: false,
  parameters: {
    type: "object",
    properties: {
      operation: { type: "string", enum: ["read", "create", "update", "delete"] },
      entity: { type: "string", enum: ["paciente", "profissional", "consulta", "clinica", "configuracao"] },
      id: { type: ["string", "null"] },
      data: { type: "object", additionalProperties: true },
    },
    required: ["operation", "entity", "id", "data"],
    additionalProperties: false,
  },
};

const ACTION_LABELS: Record<string, string> = { paciente: "paciente", profissional: "profissional", consulta: "consulta", clinica: "dados da clínica", configuracao: "configurações" };
const OP_LABELS: Record<string, string> = { create: "cadastrar", update: "editar", delete: "excluir", read: "consultar" };

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if (!auth) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "O assistente ainda não está configurado no servidor." }, { status: 503 });

    const body = await req.json().catch(() => null) as { messages?: { role?: string; content?: string }[] } | null;
    const messages = (body?.messages ?? [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20)
      .map((m) => ({ role: m.role!, content: m.content!.slice(0, 1200) }));

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "Envie uma mensagem para o Navi." }, { status: 400 });
    }

    const clinicContext = await buildClinicContext(auth.client, auth.user.id);
    const systemInstructions = `${BASE_INSTRUCTIONS}\n\n${clinicContext}`;

    const openaiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        instructions: systemInstructions,
        input: messages,
        tools: [TOOL_DEF],
        max_output_tokens: 2000,
        stream: true,
        store: false,
      }),
      cache: "no-store",
    });

    if (!openaiRes.ok || !openaiRes.body) {
      const errPayload = await openaiRes.json().catch(() => ({}));
      console.error("[api/navi-chat] OpenAI error", openaiRes.status, errPayload);
      return NextResponse.json({ error: "O Navi não conseguiu responder agora. Tente novamente em instantes." }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const reader = openaiRes.body.getReader();
    const decoder = new TextDecoder();

    let lineBuffer = "";
    let isFunctionCall = false;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) =>
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            lineBuffer += decoder.decode(value, { stream: true });
            const lines = lineBuffer.split("\n");
            lineBuffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6).trim();
              if (raw === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }

              let event: Record<string, unknown>;
              try { event = JSON.parse(raw); } catch { continue; }

              const type = event.type as string;

              if (type === "response.output_item.added") {
                const item = event.item as { type?: string } | undefined;
                if (item?.type === "function_call") isFunctionCall = true;
              }

              if (type === "response.output_text.delta" && !isFunctionCall) {
                send({ delta: event.delta });
              }

              if (type === "response.completed") {
                if (isFunctionCall) {
                  const response = event.response as unknown;
                  const pendingAction = extractAction(response);
                  if (pendingAction) {
                    const actionLabel = `${OP_LABELS[pendingAction.operation] ?? "executar"} ${ACTION_LABELS[pendingAction.entity] ?? "dados"}`;
                    send({
                      pendingAction,
                      message: pendingAction.operation === "read"
                        ? "Vou consultar os dados da sua clínica."
                        : `Posso ${actionLabel}. Confira os dados e confirme para eu executar.`,
                    });
                  }
                }
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }

              if (type === "error") {
                send({ error: "O Navi encontrou um erro. Tente novamente." });
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
                return;
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("[api/navi-chat] stream error", err);
          try {
            send({ error: "Não foi possível falar com o Navi agora." });
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch { /* já fechado */ }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[api/navi-chat] erro inesperado", error);
    return NextResponse.json({ error: "Não foi possível falar com o Navi agora." }, { status: 500 });
  }
}

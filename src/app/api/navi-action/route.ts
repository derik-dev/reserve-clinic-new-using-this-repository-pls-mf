import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type Operation = "read" | "create" | "update" | "delete";
type Entity = "paciente" | "profissional" | "consulta" | "clinica" | "configuracao";
type Action = { operation: Operation; entity: Entity; id: string | null; data: Record<string, unknown> };

const tableByEntity: Record<Entity, string> = {
  paciente: "pacientes", profissional: "profissionais", consulta: "consultas", clinica: "perfis", configuracao: "configuracoes",
};

const writableFields: Record<Entity, string[]> = {
  paciente: ["nome", "telefone", "email", "cpf", "data_nascimento", "observacoes", "status"],
  profissional: ["nome", "especialidade", "whatsapp", "cpf", "crm", "anos_experiencia", "foto_url", "ativo", "valor_consulta"],
  consulta: ["paciente_id", "paciente_nome", "paciente_telefone", "paciente_email", "data_hora", "duracao_min", "servico", "profissional_id", "profissional", "valor", "status", "observacoes"],
  clinica: ["nome", "slug", "telefone", "email_contato", "site", "instagram", "tiktok", "cpf_cnpj", "endereco_cep", "endereco_rua", "endereco_numero", "endereco_bairro", "endereco_cidade", "endereco_uf", "pix_chave", "valor_consulta", "logo_url"],
  configuracao: ["agenda_config"],
};

function scopedQuery(client: any, action: Action, userId: string) {
  const table = tableByEntity[action.entity];
  let query = client.from(table).select("*");
  if (action.entity === "clinica") return query.eq("id", userId);
  if (action.entity === "configuracao") return query.eq("perfil_id", userId);
  return query.eq("perfil_id", userId);
}

function cleanData(entity: Entity, data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => writableFields[entity].includes(key)));
}

function actionLabel(action: Action) {
  const labels = { paciente: "paciente", profissional: "profissional", consulta: "consulta", clinica: "dados da clínica", configuracao: "configurações" };
  const names = { create: "cadastrar", update: "editar", delete: "excluir", read: "consultar" };
  const name = typeof action.data.nome === "string" ? ` “${action.data.nome}”` : "";
  return `${names[action.operation]} ${labels[action.entity]}${name}`;
}

function buildSummary(entity: Entity, row: Record<string, unknown>): string {
  const id = row.id as string | undefined;
  if (!id) return "";
  const parts: string[] = [`ID interno: ${id}`];
  if (entity === "consulta") {
    if (row.paciente_nome) parts.push(`paciente: ${row.paciente_nome}`);
    if (row.data_hora) parts.push(`data/hora: ${row.data_hora}`);
    if (row.profissional) parts.push(`profissional: ${row.profissional}`);
    if (row.status) parts.push(`status: ${row.status}`);
  } else if (entity === "paciente" || entity === "profissional") {
    if (row.nome) parts.push(`nome: ${row.nome}`);
  }
  return ` [${parts.join(" | ")}]`;
}

function summarizeRows(rows: Record<string, unknown>[]) {
  const hidden = new Set(["cpf", "cpf_cnpj", "pix_chave"]);
  return rows.map((row, index) => {
    const values = Object.entries(row).filter(([key, value]) => !hidden.has(key) && value != null && typeof value !== "object").slice(0, 8);
    return `${index + 1}. ${values.map(([key, value]) => `${key}: ${String(value)}`).join(" | ")}`;
  }).join("\n");
}

async function getUser(req: NextRequest) {
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

export async function POST(req: NextRequest) {
  try {
    const auth = await getUser(req);
    if (!auth) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
    const body = await req.json().catch(() => null) as { action?: Partial<Action>; confirmed?: boolean } | null;
    const raw = body?.action;
    if (!raw || !raw.operation || !raw.entity || !tableByEntity[raw.entity]) return NextResponse.json({ error: "Ação do Navi inválida." }, { status: 400 });
    const action: Action = { operation: raw.operation, entity: raw.entity, id: raw.id ?? null, data: raw.data && typeof raw.data === "object" ? raw.data : {} };
    if (action.operation !== "read" && body?.confirmed !== true) return NextResponse.json({ error: "Confirmação necessária antes de alterar dados." }, { status: 400 });
    if (action.operation !== "read" && action.operation !== "create" && action.operation !== "update" && action.operation !== "delete") return NextResponse.json({ error: "Operação não permitida." }, { status: 400 });
    if ((action.operation === "update" || action.operation === "delete") && !action.id) return NextResponse.json({ error: "Informe qual registro deve ser alterado." }, { status: 400 });

    const { client, user } = auth;
    const table = tableByEntity[action.entity];
    if (action.operation === "read") {
      const { data, error } = await scopedQuery(client, action, user.id).limit(20);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Record<string, unknown>[];
      return NextResponse.json({ message: rows.length ? `${rows.length} registro(s) encontrado(s):\n${summarizeRows(rows)}` : "Nenhum registro encontrado.", data: rows });
    }

    if (action.entity === "configuracao") {
      if (action.operation !== "update" && action.operation !== "create") return NextResponse.json({ error: "Configurações só podem ser atualizadas." }, { status: 400 });
      const payload: Record<string, unknown> = { perfil_id: user.id, ...cleanData(action.entity, action.data) };
      const { data, error } = await client.from(table).upsert(payload, { onConflict: "perfil_id" }).select().single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ message: "Configurações atualizadas com sucesso.", data });
    }

    if (action.entity === "clinica") {
      if (action.operation !== "update") return NextResponse.json({ error: "Os dados da clínica só podem ser atualizados." }, { status: 400 });
      const { data, error } = await client.from(table).update(cleanData(action.entity, action.data)).eq("id", user.id).select().single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ message: "Dados da clínica atualizados com sucesso.", data });
    }

    if (action.operation === "create") {
      const payload: Record<string, unknown> = { perfil_id: user.id, ...cleanData(action.entity, action.data) };
      if ((action.entity === "paciente" || action.entity === "profissional") && typeof payload.nome !== "string" || action.entity === "consulta" && (!payload.paciente_nome || !payload.data_hora)) return NextResponse.json({ error: "Faltam dados obrigatórios para cadastrar esse registro." }, { status: 400 });

      // Se for consulta com profissional e sem valor, busca o valor_consulta do profissional
      if (action.entity === "consulta" && payload.profissional && !payload.valor) {
        const { data: profData } = await client
          .from("profissionais")
          .select("valor_consulta")
          .eq("perfil_id", user.id)
          .ilike("nome", `%${payload.profissional}%`)
          .maybeSingle();
        if (profData?.valor_consulta) payload.valor = profData.valor_consulta;
      }

      const { data, error } = await client.from(table).insert(payload).select().single();
      if (error) throw new Error(error.message);
      const row = data as Record<string, unknown>;
      const summary = buildSummary(action.entity, row);
      return NextResponse.json({ message: `${actionLabel(action)} com sucesso.${summary}`, data });
    }

    const scoped = client.from(table).update(cleanData(action.entity, action.data)).eq("id", action.id).eq("perfil_id", user.id);
    if (action.operation === "update") {
      const { data, error } = await scoped.select().single();
      if (error) throw new Error(error.message);
      return NextResponse.json({ message: `${actionLabel(action)} com sucesso.`, data });
    }
    const { error } = await client.from(table).delete().eq("id", action.id).eq("perfil_id", user.id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ message: `${actionLabel(action)} com sucesso.` });
  } catch (error) {
    console.error("[api/navi-action] erro", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível executar a ação." }, { status: 500 });
  }
}

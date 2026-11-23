import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticateRequest } from "@/lib/apiAuth";
import { avisarTrocaChavePix } from "@/lib/avisos";
import { isPixKeyType, liberadaEm, maskPixKeyValue, normalizePixKey, onlyDigits, pixKeyFormatError, titularConfere } from "@/lib/pixKey";
import { rateLimited } from "@/lib/rateLimit";

const ASAAS_BASE = process.env.ASAAS_BASE_URL ?? "https://api.asaas.com/v3";

type ConsultaTitular = { ok: true; cpfCnpj: string | null } | { ok: false; status: number };

// A consulta do titular tem limite no Asaas (5 por minuto na conta). Qualquer falha = não salva.
async function consultarTitular(apiKey: string, type: string, key: string): Promise<ConsultaTitular> {
  try {
    const url = `${ASAAS_BASE}/pix/addressKeys/external?type=${encodeURIComponent(type)}&key=${encodeURIComponent(key)}`;
    const res = await fetch(url, { headers: { access_token: apiKey }, cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return { ok: false, status: res.status };
    const data = await res.json().catch(() => null) as { owner?: { cpfCnpj?: string | null } } | null;
    return { ok: true, cpfCnpj: data?.owner?.cpfCnpj ?? null };
  } catch {
    return { ok: false, status: 0 };
  }
}

// Dados da chave salva para a tela (só o necessário: a chave sai mascarada).
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });
  const { data, error } = await adminSupabase().from("perfis")
    .select("chave_pix, tipo_chave_pix, chave_pix_alterada_em").eq("id", user.id).maybeSingle();
  if (error) {
    console.error("[api/chave-pix] erro ao ler a chave", error.message);
    return NextResponse.json({ error: "Não foi possível carregar a chave Pix." }, { status: 500 });
  }
  const chave = (data?.chave_pix as string | null | undefined) ?? null;
  const tipo = (data?.tipo_chave_pix as string | null | undefined) ?? null;
  return NextResponse.json({
    temChave: !!chave && isPixKeyType(tipo),
    tipo,
    mascara: maskPixKeyValue(tipo, chave),
    alteradaEm: (data?.chave_pix_alterada_em as string | null | undefined) ?? null,
  });
}

export async function POST(req: NextRequest) {
  if (rateLimited(req, "chave-pix", 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }, { status: 429 });
  }

  try {
    const user = await authenticateRequest(req);
    if (!user || !user.email) return NextResponse.json({ error: "Sessão expirada. Entre novamente." }, { status: 401 });

    const body = await req.json().catch(() => null) as { tipoChave?: unknown; chave?: unknown; senha?: unknown } | null;
    const tipo = body?.tipoChave;
    const chave = typeof body?.chave === "string" ? body.chave : "";
    const senha = typeof body?.senha === "string" ? body.senha : "";
    if (!isPixKeyType(tipo)) return NextResponse.json({ error: "Escolha o tipo da chave Pix." }, { status: 400 });
    const formatoInvalido = pixKeyFormatError(tipo, chave);
    if (formatoInvalido) return NextResponse.json({ error: formatoInvalido }, { status: 400 });
    if (!senha) return NextResponse.json({ error: "Digite sua senha para confirmar." }, { status: 400 });
    const normalizada = normalizePixKey(tipo, chave)!;

    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "A integração financeira ainda não está configurada no servidor." }, { status: 503 });

    const db = adminSupabase();
    const { data: perfil } = await db.from("perfis")
      .select("id, nome, telefone, cpf_cnpj, chave_pix, tipo_chave_pix")
      .eq("id", user.id).maybeSingle();
    if (!perfil) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });

    const doc = onlyDigits(perfil.cpf_cnpj as string | null);
    if (doc.length !== 11 && doc.length !== 14) {
      return NextResponse.json({ error: "Cadastre o CPF ou CNPJ em Configurações > Empresa antes de cadastrar a chave Pix." }, { status: 422 });
    }
    if (perfil.chave_pix === normalizada && perfil.tipo_chave_pix === tipo) {
      return NextResponse.json({ error: "Essa já é a chave Pix cadastrada." }, { status: 409 });
    }

    // Trocar a chave com saque em andamento deixaria o destino do saque ambíguo.
    const { data: emAndamento } = await db.from("saques").select("id").eq("perfil_id", perfil.id)
      .in("status", ["pendente", "processando", "autorizado"]).limit(1);
    if (emAndamento && emAndamento.length > 0) {
      return NextResponse.json({ error: "Há um saque em andamento. Aguarde ele terminar para trocar a chave." }, { status: 409 });
    }

    // Reconfirmação: a senha de login, conferida aqui no servidor (sessão descartável).
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: senhaError } = await anon.auth.signInWithPassword({ email: user.email, password: senha });
    if (senhaError) return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });

    // O titular da chave no Asaas precisa ser o dono do CPF/CNPJ do perfil.
    const titular = await consultarTitular(apiKey, tipo, normalizada);
    if (!titular.ok) {
      console.warn(`[api/chave-pix] consulta do titular falhou (status ${titular.status})`);
      const naoEncontrada = titular.status === 400 || titular.status === 404;
      return NextResponse.json({
        error: naoEncontrada
          ? "Não encontramos essa chave Pix. Confira o tipo e o valor."
          : "Não foi possível verificar o titular da chave agora. Tente novamente em alguns instantes.",
      }, { status: naoEncontrada ? 422 : 502 });
    }
    const confere = titularConfere(titular.cpfCnpj, doc);
    if (confere === null) {
      console.warn("[api/chave-pix] titular sem documento comparável na resposta do Asaas");
      return NextResponse.json({ error: "Não foi possível verificar o titular da chave agora. Tente novamente em alguns instantes." }, { status: 502 });
    }
    if (confere === false) {
      return NextResponse.json({ error: "O titular dessa chave Pix não corresponde ao CPF/CNPJ do seu cadastro." }, { status: 422 });
    }

    const agora = new Date().toISOString();
    const { error: updateError } = await db.from("perfis")
      .update({ chave_pix: normalizada, tipo_chave_pix: tipo, chave_pix_alterada_em: agora })
      .eq("id", perfil.id);
    if (updateError) {
      console.error("[api/chave-pix] erro ao salvar a chave", updateError.message);
      return NextResponse.json({ error: "Não foi possível salvar a chave agora. Tente novamente." }, { status: 500 });
    }

    const libera = liberadaEm(agora)!;
    await avisarTrocaChavePix({
      perfilId: perfil.id as string,
      nome: (perfil.nome as string | null) ?? null,
      telefone: (perfil.telefone as string | null) ?? null,
      email: user.email,
      liberadaEm: libera,
      primeiraChave: !perfil.chave_pix,
    });

    return NextResponse.json({ ok: true, liberadaEm: libera.toISOString() });
  } catch (e) {
    console.error("[api/chave-pix] erro inesperado:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Não foi possível salvar a chave agora. Tente novamente." }, { status: 500 });
  }
}

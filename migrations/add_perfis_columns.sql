-- ============================================================
-- Reserve Clinic — Migration completa
-- Cole no SQL Editor do Supabase e clique em Run
-- ============================================================

-- 1. PERFIS
CREATE TABLE IF NOT EXISTS perfis (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo                  TEXT DEFAULT 'clinica',
  nome                  TEXT,
  slug                  TEXT UNIQUE,
  telefone              TEXT,
  email_contato         TEXT,
  logo_url              TEXT,
  cor_primaria          TEXT,
  cor_secundaria        TEXT,
  endereco_cep          TEXT,
  endereco_rua          TEXT,
  endereco_numero       TEXT,
  endereco_cidade       TEXT,
  endereco_uf           TEXT,
  onboarding_concluido  BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS tipo                 TEXT DEFAULT 'clinica',
  ADD COLUMN IF NOT EXISTS telefone             TEXT,
  ADD COLUMN IF NOT EXISTS email_contato        TEXT,
  ADD COLUMN IF NOT EXISTS logo_url             TEXT,
  ADD COLUMN IF NOT EXISTS cor_primaria         TEXT,
  ADD COLUMN IF NOT EXISTS cor_secundaria       TEXT,
  ADD COLUMN IF NOT EXISTS endereco_cep         TEXT,
  ADD COLUMN IF NOT EXISTS endereco_rua         TEXT,
  ADD COLUMN IF NOT EXISTS endereco_numero      TEXT,
  ADD COLUMN IF NOT EXISTS endereco_cidade      TEXT,
  ADD COLUMN IF NOT EXISTS endereco_uf          TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_concluido BOOLEAN DEFAULT FALSE;

-- 2. CONFIGURACOES
CREATE TABLE IF NOT EXISTS configuracoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id   UUID UNIQUE REFERENCES perfis(id) ON DELETE CASCADE,
  agenda_config JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PACIENTES
CREATE TABLE IF NOT EXISTS pacientes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id  UUID REFERENCES perfis(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  telefone   TEXT,
  email      TEXT,
  status     TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONSULTAS
CREATE TABLE IF NOT EXISTS consultas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id         UUID REFERENCES perfis(id) ON DELETE CASCADE,
  paciente_id       UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  paciente_nome     TEXT,
  paciente_telefone TEXT,
  paciente_email    TEXT,
  data_hora         TIMESTAMPTZ NOT NULL,
  duracao_min       INTEGER DEFAULT 30,
  servico           TEXT,
  profissional      TEXT,
  valor             NUMERIC(10,2),
  status            TEXT NOT NULL DEFAULT 'aguardando',
  observacoes       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS (Row Level Security) — cada usuário vê só os próprios dados
-- ============================================================

ALTER TABLE perfis       ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas    ENABLE ROW LEVEL SECURITY;

-- perfis
DROP POLICY IF EXISTS "perfis_own" ON perfis;
CREATE POLICY "perfis_own" ON perfis
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- configuracoes
DROP POLICY IF EXISTS "config_own" ON configuracoes;
CREATE POLICY "config_own" ON configuracoes
  USING (perfil_id = auth.uid()) WITH CHECK (perfil_id = auth.uid());

-- pacientes
DROP POLICY IF EXISTS "pacientes_own" ON pacientes;
CREATE POLICY "pacientes_own" ON pacientes
  USING (perfil_id = auth.uid()) WITH CHECK (perfil_id = auth.uid());

-- consultas (leitura/escrita pelo dono + leitura pública para agendamento)
DROP POLICY IF EXISTS "consultas_own" ON consultas;
CREATE POLICY "consultas_own" ON consultas
  USING (perfil_id = auth.uid()) WITH CHECK (perfil_id = auth.uid());

DROP POLICY IF EXISTS "consultas_public_insert" ON consultas;
CREATE POLICY "consultas_public_insert" ON consultas
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "consultas_public_select" ON consultas;
CREATE POLICY "consultas_public_select" ON consultas
  FOR SELECT USING (true);

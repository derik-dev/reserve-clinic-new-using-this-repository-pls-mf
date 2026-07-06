-- ============================================================
-- Reserve Clinic — Tabela de profissionais
-- Cole no SQL Editor do Supabase e clique em Run
-- ============================================================

CREATE TABLE IF NOT EXISTS profissionais (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id        UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  nome             TEXT NOT NULL,
  especialidade    TEXT,
  whatsapp         TEXT,
  cpf              TEXT,
  anos_experiencia INTEGER,
  foto_url         TEXT,
  ativo            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profissionais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profissionais_own" ON profissionais;
CREATE POLICY "profissionais_own" ON profissionais
  USING (perfil_id = auth.uid())
  WITH CHECK (perfil_id = auth.uid());

-- ============================================================
-- Reserve Clinic — Colunas faltando
-- Cole no SQL Editor do Supabase e clique em Run
-- ============================================================

-- consultas: coluna de origem do agendamento
ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'interno';

-- perfis: chave PIX do profissional/clínica
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS pix_chave TEXT;

-- perfis: redes sociais e site
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS site      TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS tiktok    TEXT;

-- pacientes: campos extras do cadastro
ALTER TABLE pacientes
  ADD COLUMN IF NOT EXISTS cpf              TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento  DATE,
  ADD COLUMN IF NOT EXISTS observacoes      TEXT;

-- Política pública para leitura de perfis via slug (página de agendamento)
DROP POLICY IF EXISTS "perfis_public_select" ON perfis;
CREATE POLICY "perfis_public_select" ON perfis
  FOR SELECT USING (true);

-- Política pública para leitura de configuracoes (horários da agenda)
DROP POLICY IF EXISTS "config_public_select" ON configuracoes;
CREATE POLICY "config_public_select" ON configuracoes
  FOR SELECT USING (true);

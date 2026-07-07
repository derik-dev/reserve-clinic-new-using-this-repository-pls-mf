-- ============================================================
-- Reserve Clinic — Aplicar tudo de uma vez
-- Cole no SQL Editor do Supabase e clique em Run
-- ============================================================

-- 1. perfis: redes sociais + valor da consulta
ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS site           TEXT,
  ADD COLUMN IF NOT EXISTS instagram      TEXT,
  ADD COLUMN IF NOT EXISTS tiktok         TEXT,
  ADD COLUMN IF NOT EXISTS valor_consulta NUMERIC(10,2);

-- 2. configuracoes: coluna que guarda horários e profissionais da agenda
ALTER TABLE configuracoes
  ADD COLUMN IF NOT EXISTS agenda_config JSONB;

-- 3. agendamentos: corrigir telefone que não deveria ser obrigatório
ALTER TABLE agendamentos
  ALTER COLUMN cliente_telefone DROP NOT NULL;

-- 4. Política pública para leitura de perfis (página de agendamento)
DROP POLICY IF EXISTS "perfis_public_select" ON perfis;
CREATE POLICY "perfis_public_select" ON perfis
  FOR SELECT USING (true);

-- 5. Política pública para leitura de configuracoes (horários da agenda)
DROP POLICY IF EXISTS "config_public_select" ON configuracoes;
CREATE POLICY "config_public_select" ON configuracoes
  FOR SELECT USING (true);

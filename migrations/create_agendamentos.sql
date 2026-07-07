-- ============================================================
-- Reserve Clinic — Tabela de agendamentos com integração Asaas
-- Cole no SQL Editor do Supabase e clique em Run
-- ============================================================

CREATE TABLE IF NOT EXISTS agendamentos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id        UUID NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  cliente_nome     TEXT NOT NULL,
  cliente_telefone TEXT,
  cliente_email    TEXT,
  data             DATE NOT NULL,
  hora             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'aguardando_pagamento'
                   CHECK (status IN ('aguardando_pagamento', 'confirmado', 'cancelado')),
  pix_id           TEXT,
  observacoes      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: qualquer pessoa pode criar agendamentos (fluxo público)
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agendamentos_insert_public" ON agendamentos;
CREATE POLICY "agendamentos_insert_public" ON agendamentos
  FOR INSERT WITH CHECK (true);

-- Só o dono da clínica pode ver/atualizar seus agendamentos
DROP POLICY IF EXISTS "agendamentos_select_owner" ON agendamentos;
CREATE POLICY "agendamentos_select_owner" ON agendamentos
  FOR SELECT USING (auth.uid() = perfil_id);

DROP POLICY IF EXISTS "agendamentos_update_owner" ON agendamentos;
CREATE POLICY "agendamentos_update_owner" ON agendamentos
  FOR UPDATE USING (auth.uid() = perfil_id);

-- Índice para buscas por perfil
CREATE INDEX IF NOT EXISTS agendamentos_perfil_id_idx ON agendamentos (perfil_id);
CREATE INDEX IF NOT EXISTS agendamentos_pix_id_idx    ON agendamentos (pix_id);

-- Habilitar replicação para Supabase Realtime
-- Acesse Database → Replication → habilite a tabela "agendamentos"
-- (não pode ser feito via SQL — precisa do painel)

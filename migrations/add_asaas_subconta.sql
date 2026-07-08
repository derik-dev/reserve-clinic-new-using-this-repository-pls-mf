-- ============================================================
-- Reserve Clinic — Colunas para sub-conta Asaas por clínica
-- Cole no SQL Editor do Supabase e clique em Run
-- ============================================================

ALTER TABLE perfis
  ADD COLUMN IF NOT EXISTS cpf_cnpj        TEXT,
  ADD COLUMN IF NOT EXISTS endereco_bairro TEXT,
  ADD COLUMN IF NOT EXISTS asaas_conta_id  TEXT,
  ADD COLUMN IF NOT EXISTS asaas_api_key   TEXT,
  ADD COLUMN IF NOT EXISTS asaas_wallet_id TEXT;

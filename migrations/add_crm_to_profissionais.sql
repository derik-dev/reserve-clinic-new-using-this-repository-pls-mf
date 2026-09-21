-- Adiciona o registro profissional como texto, sem remover dados antigos.
ALTER TABLE profissionais
  ADD COLUMN IF NOT EXISTS crm TEXT;

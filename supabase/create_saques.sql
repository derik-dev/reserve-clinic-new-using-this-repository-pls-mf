-- Tabela de saques (registros criados antes de chamar a Asaas)
create table if not exists public.saques (
  id               uuid primary key default gen_random_uuid(),
  perfil_id        uuid not null references public.perfis(id) on delete cascade,
  valor            numeric(12,2) not null check (valor > 0),
  chave_pix        text not null,
  tipo_chave       text not null check (tipo_chave in ('CPF','CNPJ','EMAIL','PHONE','EVP')),
  asaas_transfer_id text,
  status           text not null default 'pendente' check (status in ('pendente','processando','falhou','concluido')),
  error_message    text,
  created_at       timestamptz not null default now(),
  approved_at      timestamptz
);

-- Apenas o service role (backend) pode inserir/atualizar
alter table public.saques enable row level security;

-- Usuário autenticado só lê os próprios registros (via perfil_id)
drop policy if exists "saques: usuario le proprio" on public.saques;
create policy "saques: usuario le proprio" on public.saques
  for select using (
    perfil_id in (
      select id from public.perfis where id = auth.uid()
    )
  );

-- Sem política de insert/update para usuário — apenas service role escreve

-- Trava contra saques simultâneos: no máximo um saque "pendente" por clínica.
-- Obrigatório para o /api/sacar (rode no SQL Editor do Supabase).
create unique index if not exists saques_um_pendente_por_perfil
  on public.saques (perfil_id)
  where status = 'pendente';

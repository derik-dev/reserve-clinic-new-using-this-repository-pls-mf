-- Reserve Clinic — schema completo
-- Rode este script no SQL editor do Supabase (uma vez).
-- Já assume que a tabela public.perfis existe (criada no onboarding).

------------------------------------------------------------
-- perfis: tornar slug consultável publicamente (booking)
------------------------------------------------------------
alter table if exists public.perfis enable row level security;

drop policy if exists "perfis_public_read" on public.perfis;
create policy "perfis_public_read"
  on public.perfis for select
  to anon, authenticated
  using (true);

drop policy if exists "perfis_owner_update" on public.perfis;
create policy "perfis_owner_update"
  on public.perfis for update
  to authenticated
  using (auth.uid() = id);

drop policy if exists "perfis_owner_insert" on public.perfis;
create policy "perfis_owner_insert"
  on public.perfis for insert
  to authenticated
  with check (auth.uid() = id);

------------------------------------------------------------
-- configuracoes: campo agenda_config (jsonb) + RLS
------------------------------------------------------------
alter table public.configuracoes
  add column if not exists agenda_config jsonb not null default '{}'::jsonb;

alter table public.configuracoes enable row level security;

drop policy if exists "configuracoes_select_own" on public.configuracoes;
create policy "configuracoes_select_own"
  on public.configuracoes for select
  to authenticated
  using (auth.uid() = perfil_id);

drop policy if exists "configuracoes_insert_own" on public.configuracoes;
create policy "configuracoes_insert_own"
  on public.configuracoes for insert
  to authenticated
  with check (auth.uid() = perfil_id);

drop policy if exists "configuracoes_update_own" on public.configuracoes;
create policy "configuracoes_update_own"
  on public.configuracoes for update
  to authenticated
  using (auth.uid() = perfil_id);

-- Leitura pública do agenda_config (para o link público respeitar horários/feriados)
drop policy if exists "configuracoes_public_read" on public.configuracoes;
create policy "configuracoes_public_read"
  on public.configuracoes for select
  to anon
  using (true);

------------------------------------------------------------
-- pacientes
------------------------------------------------------------
create table if not exists public.pacientes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  cpf text,
  data_nascimento date,
  observacoes text,
  status text not null default 'ativo',
  created_at timestamptz not null default now()
);

create index if not exists pacientes_perfil_id_idx on public.pacientes(perfil_id);
create index if not exists pacientes_nome_idx on public.pacientes(perfil_id, nome);

alter table public.pacientes enable row level security;

drop policy if exists "pacientes_select_own" on public.pacientes;
create policy "pacientes_select_own"
  on public.pacientes for select
  to authenticated
  using (auth.uid() = perfil_id);

drop policy if exists "pacientes_insert_own" on public.pacientes;
create policy "pacientes_insert_own"
  on public.pacientes for insert
  to authenticated
  with check (auth.uid() = perfil_id);

drop policy if exists "pacientes_update_own" on public.pacientes;
create policy "pacientes_update_own"
  on public.pacientes for update
  to authenticated
  using (auth.uid() = perfil_id);

drop policy if exists "pacientes_delete_own" on public.pacientes;
create policy "pacientes_delete_own"
  on public.pacientes for delete
  to authenticated
  using (auth.uid() = perfil_id);

------------------------------------------------------------
-- consultas
------------------------------------------------------------
create table if not exists public.consultas (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references auth.users(id) on delete cascade,
  paciente_id uuid references public.pacientes(id) on delete set null,
  paciente_nome text not null,
  paciente_telefone text,
  paciente_email text,
  data_hora timestamptz not null,
  duracao_min integer not null default 30,
  servico text,
  profissional text,
  valor numeric(10, 2),
  status text not null default 'aguardando',
  observacoes text,
  origem text not null default 'painel',
  created_at timestamptz not null default now()
);

create index if not exists consultas_perfil_id_idx on public.consultas(perfil_id);
create index if not exists consultas_data_hora_idx on public.consultas(perfil_id, data_hora);

alter table public.consultas enable row level security;

drop policy if exists "consultas_select_own" on public.consultas;
create policy "consultas_select_own"
  on public.consultas for select
  to authenticated
  using (auth.uid() = perfil_id);

drop policy if exists "consultas_insert_own" on public.consultas;
create policy "consultas_insert_own"
  on public.consultas for insert
  to authenticated
  with check (auth.uid() = perfil_id);

drop policy if exists "consultas_update_own" on public.consultas;
create policy "consultas_update_own"
  on public.consultas for update
  to authenticated
  using (auth.uid() = perfil_id);

drop policy if exists "consultas_delete_own" on public.consultas;
create policy "consultas_delete_own"
  on public.consultas for delete
  to authenticated
  using (auth.uid() = perfil_id);

-- Booking público (anônimo): permite inserir consulta com origem = 'publico'.
drop policy if exists "consultas_public_insert" on public.consultas;
create policy "consultas_public_insert"
  on public.consultas for insert
  to anon
  with check (origem = 'publico');

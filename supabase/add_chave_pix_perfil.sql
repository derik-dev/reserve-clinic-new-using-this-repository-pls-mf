-- Chave Pix de saque salva no perfil (cadastrada uma vez, com carência de 24h).

alter table public.perfis add column if not exists chave_pix text;
alter table public.perfis add column if not exists tipo_chave_pix text;
alter table public.perfis add column if not exists chave_pix_alterada_em timestamptz;

alter table public.perfis drop constraint if exists perfis_tipo_chave_pix_check;
alter table public.perfis
  add constraint perfis_tipo_chave_pix_check
  check (tipo_chave_pix is null or tipo_chave_pix in ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP'));

-- Só o servidor (service role) ou o SQL Editor podem mexer na chave. Quem está logado no
-- navegador (anon/authenticated) não consegue trocar a chave nem a data de carência
-- por uma chamada direta ao banco: a troca passa por /api/chave-pix (senha + titular).
create or replace function public.proteger_chave_pix()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and (
       new.chave_pix is distinct from old.chave_pix
    or new.tipo_chave_pix is distinct from old.tipo_chave_pix
    or new.chave_pix_alterada_em is distinct from old.chave_pix_alterada_em
  ) then
    raise exception 'A chave Pix só pode ser alterada pelo sistema.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists perfis_proteger_chave_pix on public.perfis;
create trigger perfis_proteger_chave_pix
  before update on public.perfis
  for each row execute function public.proteger_chave_pix();

-- E no INSERT: um perfil novo criado pelo navegador não pode já nascer com chave.
create or replace function public.proteger_chave_pix_insert()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    new.chave_pix := null;
    new.tipo_chave_pix := null;
    new.chave_pix_alterada_em := null;
  end if;
  return new;
end;
$$;

drop trigger if exists perfis_proteger_chave_pix_insert on public.perfis;
create trigger perfis_proteger_chave_pix_insert
  before insert on public.perfis
  for each row execute function public.proteger_chave_pix_insert();

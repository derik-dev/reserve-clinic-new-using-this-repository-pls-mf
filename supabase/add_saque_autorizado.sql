-- Autorização de saque por webhook (/api/webhook-saque).
-- Novo status "autorizado": o saque já foi aprovado pelo webhook (uma única vez) e aguarda o Asaas concluir.

alter table public.saques add column if not exists autorizado_em timestamptz;

-- Troca a constraint de status (descobre o nome atual, qualquer que seja) para incluir "autorizado".
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.saques'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%' and pg_get_constraintdef(oid) ilike '%pendente%'
  loop
    execute format('alter table public.saques drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.saques
  add constraint saques_status_check
  check (status in ('pendente', 'processando', 'autorizado', 'falhou', 'concluido'));

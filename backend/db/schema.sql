-- Extensões úteis
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Tabela principal de leads
create table if not exists public.hub_lead (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  service text check (service in ('landing','agente','combo')) not null default 'landing',
  stage text check (stage in ('prospect','qualificado','proposta','producao','testes','entregue')) not null default 'prospect',
  amount integer,                     -- centavos
  deadline timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tarefas por lead
create table if not exists public.hub_task (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.hub_lead(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  tag text check (tag in ('briefing','layout','conteudo','setup','qa','go-live')),

  created_at timestamptz not null default now()
);

-- Histórico de mudanças de estágio
create table if not exists public.hub_stage_history (
  id bigserial primary key,
  lead_id uuid not null references public.hub_lead(id) on delete cascade,
  from_stage text check (from_stage in ('prospect','qualificado','proposta','producao','testes','entregue')),
  to_stage text check (to_stage in ('prospect','qualificado','proposta','producao','testes','entregue')) not null,
  note text,
  created_at timestamptz not null default now()
);

-- Trigger de updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_updated_at on public.hub_lead;
create trigger trg_touch_updated_at
before update on public.hub_lead
for each row execute function public.touch_updated_at();

-- Índices
create index if not exists idx_hub_lead_stage on public.hub_lead(stage);
create index if not exists idx_hub_task_lead on public.hub_task(lead_id);
create index if not exists idx_hub_task_done on public.hub_task(done);
create index if not exists idx_stage_history_lead on public.hub_stage_history(lead_id, created_at desc);

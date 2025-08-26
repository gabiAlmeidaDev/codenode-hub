-- Verificar se as migrações já foram aplicadas
-- Esta migração adiciona suporte a colunas personalizadas

-- Adicionar tabela de colunas customizadas
create table if not exists public.hub_column (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6366f1', -- cor padrão (indigo)
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Adicionar coluna column_id à tabela hub_lead
alter table public.hub_lead 
add column if not exists column_id uuid references public.hub_column(id) on delete set null;

-- Adicionar índice para a coluna column_id
create index if not exists idx_hub_lead_column on public.hub_lead(column_id);

-- Inserir colunas padrão existentes (apenas se a tabela estiver vazia)
insert into public.hub_column (name, color, order_index) 
select * from (values 
  ('Prospect', '#60a5fa', 0),      -- blue-400
  ('Qualificado', '#818cf8', 1),   -- indigo-400
  ('Proposta', '#a78bfa', 2),      -- purple-400
  ('Produção', '#fbbf24', 3),      -- yellow-400
  ('Testes', '#f97316', 4),        -- orange-500
  ('Entregue', '#10b981', 5)       -- green-500
) as default_columns(name, color, order_index)
where not exists (select 1 from public.hub_column);

-- Atualizar os leads existentes para apontar para as novas colunas
-- Apenas para leads que ainda não têm column_id definido
with column_mapping as (
  select 
    id,
    name
  from public.hub_column
)
update public.hub_lead 
set column_id = cm.id
from column_mapping cm
where hub_lead.stage = lower(cm.name)
  and hub_lead.column_id is null;
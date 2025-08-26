-- Atualizar os leads existentes para apontar para as novas colunas
-- Primeiro, obter os IDs das colunas recém-criadas
with column_mapping as (
  select 
    id,
    name
  from public.hub_column
  where name in ('Prospect', 'Qualificado', 'Proposta', 'Produção', 'Testes', 'Entregue')
)
update public.hub_lead 
set column_id = cm.id
from column_mapping cm
where hub_lead.stage = lower(cm.name)
  and hub_lead.column_id is null;
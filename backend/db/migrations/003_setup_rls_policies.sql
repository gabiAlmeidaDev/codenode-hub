-- Ativar RLS nas tabelas
alter table public.hub_column enable row level security;
alter table public.hub_lead enable row level security;

-- Políticas para hub_column
create policy "Usuários podem ver colunas" on public.hub_column
  for select to authenticated using (true);

create policy "Usuários podem inserir colunas" on public.hub_column
  for insert to authenticated with check (true);

create policy "Usuários podem atualizar colunas" on public.hub_column
  for update to authenticated using (true);

create policy "Usuários podem deletar colunas" on public.hub_column
  for delete to authenticated using (true);

-- Políticas para hub_lead (atualizadas para usar column_id)
create policy "Usuários podem ver seus leads" on public.hub_lead
  for select to authenticated using (true);

create policy "Usuários podem inserir leads" on public.hub_lead
  for insert to authenticated with check (true);

create policy "Usuários podem atualizar leads" on public.hub_lead
  for update to authenticated using (true);

create policy "Usuários podem deletar leads" on public.hub_lead
  for delete to authenticated using (true);

-- Grant permissions
grant all on public.hub_column to authenticated;
grant all on public.hub_lead to authenticated;
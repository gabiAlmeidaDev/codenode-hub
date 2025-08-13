-- Alguns leads de exemplo
insert into public.hub_lead (name, phone, email, service, stage, amount, deadline, notes)
values
  ('Acme Lojas', '(48) 99999-0001', 'contato@acme.com', 'landing', 'prospect', 350000, now() + interval '7 days', 'Landing institucional'),
  ('Beta Cursos', null, 'beta@cursos.com', 'agente', 'qualificado', 1200000, now() + interval '15 days', 'Agente interno c/ integrações'),
  ('Clínica Zeta', '(11) 98888-2222', 'atendimento@zeta.com', 'combo', 'proposta', 2200000, now() + interval '25 days', 'Combo landing + agente');

-- Tarefas iniciais
insert into public.hub_task (lead_id, title, tag)
select id, 'Briefing inicial', 'briefing' from public.hub_lead limit 3;

insert into public.hub_task (lead_id, title, tag)
select id, 'Definir escopo', 'conteudo' from public.hub_lead limit 3;

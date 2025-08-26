#!/bin/bash
# Script para verificar e aplicar migrações

echo "Verificando status das migrações..."

# Verificar se as tabelas já existem
echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('hub_column', 'hub_lead');" | supabase postgresql psql

# Verificar estrutura da tabela hub_lead
echo "\d hub_lead" | supabase postgresql psql

# Verificar se a coluna column_id existe
echo "SELECT column_name FROM information_schema.columns WHERE table_name = 'hub_lead' AND column_name = 'column_id';" | supabase postgresql psql

echo "Se as tabelas e colunas já existirem, não é necessário aplicar as migrações."
echo "Caso contrário, aplique as migrações com:"
echo "supabase db push"
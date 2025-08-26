// src/api/columns.ts
import { supabase } from "@/lib/supabase";
import type { HubColumn } from "@/lib/types";

// Obter todas as colunas
export async function fetchColumns(): Promise<HubColumn[] | null> {
  const { data, error } = await supabase
    .from("hub_column")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Erro ao buscar colunas:", error);
    return null;
  }

  return data as HubColumn[];
}

// Criar nova coluna
export async function createColumn(
  column: Omit<HubColumn, "id" | "created_at" | "updated_at">
): Promise<HubColumn | null> {
  const { data, error } = await supabase
    .from("hub_column")
    .insert({
      ...column,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar coluna:", error);
    return null;
  }

  return data as HubColumn;
}

// Atualizar coluna
export async function updateColumn(
  id: string,
  updates: Partial<Omit<HubColumn, "id" | "created_at" | "updated_at">>
): Promise<HubColumn | null> {
  const { data, error } = await supabase
    .from("hub_column")
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar coluna:", error);
    return null;
  }

  if (!data) {
    console.error("Coluna não encontrada:", id);
    return null;
  }

  return data as HubColumn;
}

// Deletar coluna
export async function deleteColumn(id: string): Promise<boolean> {
  // Verificar se existem leads associados
  const { data: leads, error: leadsError } = await supabase
    .from("hub_lead")
    .select("id")
    .eq("column_id", id)
    .limit(1);

  if (leadsError) {
    console.error("Erro ao verificar leads associados:", leadsError);
    return false;
  }

  if (leads && leads.length > 0) {
    console.error("Não é possível deletar coluna com leads associados");
    return false;
  }

  // Deletar a coluna
  const { error } = await supabase
    .from("hub_column")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar coluna:", error);
    return false;
  }

  return true;
}

// Reordenar colunas
export async function reorderColumns(
  columns: { id: string; order_index: number }[]
): Promise<boolean> {
  // Atualizar a ordem de todas as colunas
  const updates = columns.map(({ id, order_index }) =>
    supabase
      .from("hub_column")
      .update({ order_index, updated_at: new Date().toISOString() })
      .eq("id", id)
  );

  const results = await Promise.all(updates);

  // Verificar se houve algum erro
  const errors = results.filter(result => result.error);
  if (errors.length > 0) {
    console.error("Erros ao reordenar colunas:", errors);
    return false;
  }

  return true;
}
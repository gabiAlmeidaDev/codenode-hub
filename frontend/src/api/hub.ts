// src/api/hub.ts
import { supabase } from "@/lib/supabase";
import type { HubLead, HubTask, HubFinanceEntry, HubSettings, Kpis, Stage } from "@/lib/types";

const API_BASE = "/api";

// === Leads ===

export async function fetchLeads(): Promise<HubLead[] | null> {
  const res = await fetch(`${API_BASE}/leads`);
  if (!res.ok) {
    console.error("Failed to fetch leads", await res.text());
    return null;
  }
  return res.json();
}

export async function createLead(lead: Partial<HubLead>): Promise<HubLead | null> {
  const res = await fetch(`${API_BASE}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
  if (!res.ok) {
    console.error("Failed to create lead", await res.text());
    return null;
  }
  return res.json();
}

export async function updateLead(id: string, updates: Partial<HubLead>): Promise<HubLead | null> {
  const res = await fetch(`${API_BASE}/leads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    console.error("Failed to update lead", await res.text());
    return null;
  }
  return res.json();
}

export async function deleteLead(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/leads/${id}`, { method: "DELETE" });
  return res.ok;
}

// Função para mover lead entre colunas
export async function moveLeadColumn(
  id: string,
  from: string | null,
  to: string | null,
  note?: string
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/leads/${id}/column`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, note }),
  });
  return res.ok;
}

// Função para reordenar leads em uma coluna
export async function reorderLeadsInColumn(columnId: string, ids: string[]): Promise<boolean> {
  const res = await fetch(`${API_BASE}/leads/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ columnId, ids }),
  });
  return res.ok;
}

// Função para reordenar leads em um stage (mantida para compatibilidade)
export async function reorderLeadsInStage(stage: string, ids: string[]): Promise<boolean> {
  const res = await fetch(`${API_BASE}/leads/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage, ids }),
  });
  return res.ok;
}

// === Tasks ===

export async function fetchTasks(leadId: string): Promise<HubTask[] | null> {
  const { data, error } = await supabase
    .from("hub_task")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return null;
  }

  return data as HubTask[];
}

export async function createTask(task: Omit<HubTask, "id" | "created_at">): Promise<HubTask | null> {
  const { data, error } = await supabase
    .from("hub_task")
    .insert({
      ...task,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data as HubTask;
}

export async function updateTask(id: string, updates: Partial<HubTask>): Promise<HubTask | null> {
  const { data, error } = await supabase
    .from("hub_task")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data as HubTask;
}

export async function deleteTask(id: string): Promise<boolean> {
  const { error } = await supabase.from("hub_task").delete().eq("id", id);
  return !error;
}

// === Finance ===

export async function fetchFinanceEntries(leadId: string): Promise<HubFinanceEntry[] | null> {
  const { data, error } = await supabase
    .from("hub_finance_entry")
    .select("*")
    .eq("lead_id", leadId)
    .order("due_date", { ascending: true });

  if (error) {
    console.error(error);
    return null;
  }

  return data as HubFinanceEntry[];
}

export async function createFinanceEntry(
  entry: Omit<HubFinanceEntry, "id" | "created_at" | "updated_at">
): Promise<HubFinanceEntry | null> {
  const { data, error } = await supabase
    .from("hub_finance_entry")
    .insert({
      ...entry,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data as HubFinanceEntry;
}

export async function updateFinanceEntry(
  id: string,
  updates: Partial<Omit<HubFinanceEntry, "id" | "created_at">>
): Promise<HubFinanceEntry | null> {
  const { data, error } = await supabase
    .from("hub_finance_entry")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data as HubFinanceEntry;
}

export async function deleteFinanceEntry(id: string): Promise<boolean> {
  const { error } = await supabase.from("hub_finance_entry").delete().eq("id", id);
  return !error;
}

// === Settings ===

export async function fetchSettings(): Promise<HubSettings | null> {
  const { data, error } = await supabase.from("hub_settings").select("*").limit(1).single();
  if (error && error.code !== "PGRST116") {
    // PGRST116 = row not found, which is fine
    console.error(error);
  }
  return data as HubSettings | null;
}

export async function updateSettings(updates: Partial<HubSettings>): Promise<HubSettings | null> {
  // Try to update existing row
  let { data, error } = await supabase
    .from("hub_settings")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .neq("id", "00000000-0000-0000-0000-000000000000") // dummy condition to trigger update
    .limit(1);

  // If no rows were updated, insert a new one
  if (!data || (data as any[]).length === 0) {
    const { data: newData, error: insertError } = await supabase
      .from("hub_settings")
      .insert({
        id: "00000000-0000-0000-0000-000000000000", // fixed ID
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      return null;
    }

    return newData as HubSettings;
  }

  return data[0] as HubSettings;
}

// === KPIs ===

export async function fetchKpis(): Promise<Kpis | null> {
  const res = await fetch(`${API_BASE}/kpis`);
  if (!res.ok) {
    console.error("Failed to fetch KPIs", await res.text());
    return null;
  }
  return res.json();
}
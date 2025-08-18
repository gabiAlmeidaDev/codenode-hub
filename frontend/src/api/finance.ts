// src/api/finance.ts
import { supabase } from "@/lib/supabase";
import type { HubFinanceEntry } from "@/lib/types";

// ---------- Finance Entries ----------
export async function fetchFinanceEntries() {
  const { data, error } = await supabase
    .from("hub_finance_entry")
    .select("*, lead:hub_lead(name)")
    .order("due_date", { ascending: true })
    .limit(1000);

  if (error) throw error;
  return data as (HubFinanceEntry & { lead: { name: string } | null })[];
}

export async function createFinanceEntry(entry: Omit<HubFinanceEntry, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("hub_finance_entry")
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data as HubFinanceEntry;
}

export async function updateFinanceEntry(id: string, patch: Partial<HubFinanceEntry>) {
  const { data, error } = await supabase
    .from("hub_finance_entry")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as HubFinanceEntry;
}

export async function deleteFinanceEntry(id: string) {
  const { error } = await supabase
    .from("hub_finance_entry")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
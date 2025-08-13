import { supabase } from "@/lib/supabase";

// Puxa tudo e a gente agrega no cliente (rápido de colocar de pé)
export async function fetchAnalyticsBase() {
  const [{ data: leads, error: e1 }, { data: tasks, error: e2 }] = await Promise.all([
    supabase.from("hub_lead").select("id, stage, service, amount, created_at"),
    supabase.from("hub_task").select("id, lead_id, done, tag, created_at"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { leads: leads ?? [], tasks: tasks ?? [] };
}

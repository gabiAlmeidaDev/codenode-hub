import { supabase } from "@/lib/supabase";

export async function globalSearch(query: string) {
  const q = query.trim();
  if (!q) return { leads: [], tasks: [] };

  const [{ data: leads, error: e1 }, { data: tasks, error: e2 }] = await Promise.all([
    supabase.from("hub_lead").select("id, name, stage").ilike("name", `%${q}%`).limit(10),
    supabase.from("hub_task").select("id, lead_id, title, done, tag").ilike("title", `%${q}%`).limit(10),
  ]);

  if (e1) throw e1;
  if (e2) throw e2;
  return { leads: leads ?? [], tasks: tasks ?? [] };
}

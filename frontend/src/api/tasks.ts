import { supabase } from "@/lib/supabase";

export type Task = {
  id: string;
  lead_id: string;
  title: string;
  tag: string | null;
  done: boolean;
  created_at: string;
};

export type NewTask = {
  lead_id: string;
  title: string;
  tag?: string | null;
};

export async function listTasksByLead(leadId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("hub_task")
    .select("id, lead_id, title, tag, done, created_at")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as Task[]) ?? [];
}

export async function createTaskQuick(payload: NewTask): Promise<Task> {
  const { data, error } = await supabase
    .from("hub_task")
    .insert({
      lead_id: payload.lead_id,
      title: payload.title,
      tag: payload.tag ?? null,
      done: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function toggleTaskDone(id: string, done: boolean) {
  const { error } = await supabase.from("hub_task").update({ done }).eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("hub_task").delete().eq("id", id);
  if (error) throw error;
}

import { supabase } from "@/lib/supabase";
import type { HubLead, HubTask, Kpis, Stage } from "@/lib/types";

// ---------- KPIs ----------
export async function fetchKpis(): Promise<Kpis> {
  // Leads nos últimos 7 dias
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [{ count: leads7d }, { count: total30 }, { count: delivered30 }, { count: inProduction }, { count: pendingTasks }] =
    await Promise.all([
      supabase.from("hub_lead").select("*", { count: "exact", head: true }).gte("created_at", since7.toISOString()),
      supabase.from("hub_lead").select("*", { count: "exact", head: true }).gte("created_at", since30.toISOString()),
      supabase
        .from("hub_lead")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", since30.toISOString())
        .eq("stage", "entregue"),
      supabase.from("hub_lead").select("*", { count: "exact", head: true }).eq("stage", "producao"),
      supabase.from("hub_task").select("*", { count: "exact", head: true }).eq("done", false),
    ]);

  const conv = total30 && total30 > 0 && delivered30 ? Math.round((delivered30 / total30) * 100) : 0;

  return {
    leads7d: leads7d ?? 0,
    conversion30d: conv,
    inProduction: inProduction ?? 0,
    pendingTasks: pendingTasks ?? 0,
  };
}

// ---------- Leads ----------
export async function fetchLeads(params?: { limit?: number; stage?: Stage; service?: string; search?: string }) {
  let q = supabase
    .from("hub_lead")
    .select("*")
    .order("created_at", { ascending: false });

  if (params?.stage) q = q.eq("stage", params.stage);
  if (params?.service) q = q.eq("service", params.service);
  if (params?.search) {
    // busca simples por nome/email/phone
    q = q.or(
      `name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`
    );
  }
  if (params?.limit) q = q.limit(params.limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as HubLead[];
}

export async function fetchLeadById(id: string) {
  const { data, error } = await supabase.from("hub_lead").select("*").eq("id", id).single();
  if (error) throw error;
  return data as HubLead;
}

// ---------- Tasks ----------
export async function fetchTasks(leadId: string) {
  const { data, error } = await supabase
    .from("hub_task")
    .select("*")
    .eq("lead_id", leadId)
    .order("done", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as HubTask[];
}

export async function toggleTask(taskId: string, done: boolean) {
  const { error } = await supabase.from("hub_task").update({ done }).eq("id", taskId);
  if (error) throw error;
}

// loga histórico
export async function addStageHistory(leadId: string, from_stage: Stage | null, to_stage: Stage) {
  const { error } = await supabase
    .from("hub_stage_history")
    .insert({ lead_id: leadId, from_stage, to_stage, note: "Kanban move" });
  if (error) throw error;
}

// move e persiste
export async function moveLeadStage(leadId: string, from: Stage, to: Stage) {
  if (from === to) return;
  const { error } = await supabase.from("hub_lead").update({ stage: to }).eq("id", leadId);
  if (error) throw error;
  await addStageHistory(leadId, from, to);
}

export async function createTaskQuick(leadId: string, title: string) {
    const { error } = await supabase.from("hub_task").insert({ lead_id: leadId, title, done: false });
    if (error) throw error;
  }
  

export async function updateLead(
    id: string,
    patch: Partial<Pick<HubLead, "name" | "stage" | "notes" | "service" | "amount" | "deadline">>
  ) {
    const { error } = await supabase.from("hub_lead").update(patch).eq("id", id);
    if (error) throw error;
  }
  

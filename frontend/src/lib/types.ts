// src/lib/types.ts
export type Stage = "prospect" | "qualificado" | "proposta" | "producao" | "testes" | "entregue";
export type Service = "landing" | "agente" | "combo";
export type TaskTag = "briefing" | "layout" | "conteudo" | "setup" | "qa" | "go-live";

export interface HubLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  service: Service;
  stage: Stage;
  amount: number | null; // centavos
  deadline: string | null; // ISO string
  notes: string | null;
  created_at: string; // ISO string
  updated_at: string; // ISO string
  order_index?: number; // índice para ordenação no pipeline
  column_id: string | null; // ID da coluna personalizada
}

export interface HubTask {
  id: string;
  lead_id: string;
  title: string;
  done: boolean;
  tag: TaskTag | null;
  created_at: string; // ISO string
}

export interface HubStageHistory {
  id: string;
  lead_id: string;
  from_stage: Stage | null;
  to_stage: Stage;
  note: string | null;
  created_at: string; // ISO string
}

export interface HubFinanceEntry {
  id: string;
  lead_id: string | null;
  title: string;
  amount: number; // centavos, positivo (receita) ou negativo (despesa)
  due_date: string; // ISO string
  paid_at: string | null; // ISO string
  notes: string | null;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

export interface HubSettings {
  id: string;
  wip_enabled: boolean;
  wip_limits: WipLimits;
  updated_at: string; // ISO string
}

export type WipLimits = Partial<Record<Stage, number>>;

export interface Kpis {
  leads7d: number;
  conversion30d: number;
  inProduction: number;
  pendingTasks: number;
}

export interface HubColumn {
  id: string;
  name: string;
  color: string;
  order_index: number;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}
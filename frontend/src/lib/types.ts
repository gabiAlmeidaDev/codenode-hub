export type Stage =
  | "prospect"
  | "qualificado"
  | "proposta"
  | "producao"
  | "testes"
  | "entregue";

export type Service = "landing" | "agente" | "combo";

export interface HubLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  service: Service;
  stage: Stage;
  amount: number | null;        // centavos
  deadline: string | null;      // ISO date
  notes: string | null;
  created_at: string;           // ISO
  updated_at: string;           // ISO
}

export interface HubTask {
  id: string;
  lead_id: string;
  title: string;
  done: boolean;
  tag: "briefing" | "layout" | "conteudo" | "setup" | "qa" | "go-live" | null;
  created_at: string;
}

export interface Kpis {
  leads7d: number;
  conversion30d: number;   // 0..100 (%)
  inProduction: number;
  pendingTasks: number;
}

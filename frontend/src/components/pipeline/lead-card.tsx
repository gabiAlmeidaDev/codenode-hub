import { useState } from "react";
import type { HubLead, Stage } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { formatBRL, shortDate } from "@/utils";
import { createTaskQuick } from "@/api/tasks";

const STAGES: Stage[] = ["prospect","qualificado","proposta","producao","testes","entregue"];

export default function LeadCard({
  lead,
  stage,
  onStageChanged,
}: {
  lead: HubLead;
  stage: Stage;
  onStageChanged: (id: string, from: Stage, to: Stage) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(lead.name);
  const [openQuickTask, setOpenQuickTask] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickTag, setQuickTag] = useState("");

  async function saveName() {
    const v = name.trim();
    if (!v || v === lead.name) { setEditing(false); setName(lead.name); return; }
    try {
      const { error } = await supabase.from("hub_lead").update({ name: v }).eq("id", lead.id);
      if (error) throw error;
    } catch {
      setName(lead.name);
    } finally {
      setEditing(false);
    }
  }

  async function createQuickTask() {
    const t = quickTitle.trim();
    if (!t) return;
    try {
      await createTaskQuick({ lead_id: lead.id, title: t, tag: quickTag || null });
      setQuickTitle(""); setQuickTag(""); setOpenQuickTask(false);
    } catch {}
  }

  return (
    <div className="kanban-card">
      {lead.deadline && (
        <div className="kanban-deadline" title={`Prazo: ${shortDate(lead.deadline)}`}>
          ⏰ {shortDate(lead.deadline)}
        </div>
      )}

      {/* Topo: nome + seletor */}
      <div className="kanban-card__top">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className="w-full bg-transparent border border-[hsl(220,12%,18%)] rounded-xl px-3 py-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setEditing(false); setName(lead.name); } }}
              onBlur={saveName}
              autoFocus
            />
          ) : (
            <div
              className="kanban-card__name"
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              title="Clique para renomear"
            >
              {name || "—"}
            </div>
          )}
        </div>

        <select
          className="kanban-card__stage"
          value={stage}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const to = e.target.value as Stage;
            if (to !== stage) onStageChanged(lead.id, stage, to);
          }}
        >
          {STAGES.map((s) => (
            <option key={s} value={s} className="bg-[hsl(222,37%,10%)] capitalize">{s}</option>
          ))}
        </select>
      </div>

      {/* Meta */}
      <div className="kanban-card__meta">
        <span className="capitalize">{lead.service || "—"}</span>
        {lead.amount != null && <span>{formatBRL(lead.amount)}</span>}
      </div>

      {/* Ações */}
      <div className="kanban-card__actions">
        <button
          className="px-2 py-1 text-xs rounded-lg border border-[hsl(220,12%,18%)] hover:bg-[hsl(222,37%,14%)]"
          onClick={(e) => { e.stopPropagation(); setOpenQuickTask((v) => !v); }}
        >
          + Tarefa
        </button>
        {stage !== "entregue" && (
          <button
            className="px-2 py-1 text-xs rounded-lg border border-[hsl(220,12%,18%)] hover:bg-[hsl(222,37%,14%)]"
            onClick={(e) => { e.stopPropagation(); onStageChanged(lead.id, stage, "entregue"); }}
          >
            ✓ Entregue
          </button>
        )}
      </div>

      {/* Formulário compacto */}
      {openQuickTask && (
        <div className="mt-3 rounded-xl border border-[hsl(220,12%,18%)] p-3 bg-[hsl(222,37%,12%)]">
          <div className="text-xs text-[hsl(215,12%,65%)] mb-2">Nova tarefa</div>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-transparent border border-[hsl(220,12%,18%)] rounded-xl px-3 py-1 text-sm"
              placeholder="Título…"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createQuickTask(); }}
            />
            <input
              className="w-28 bg-transparent border border-[hsl(220,12%,18%)] rounded-xl px-3 py-1 text-sm"
              placeholder="Tag"
              value={quickTag}
              onChange={(e) => setQuickTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createQuickTask(); }}
            />
            <button className="btn-primary" onClick={createQuickTask}>Criar</button>
          </div>
        </div>
      )}
    </div>
  );
}

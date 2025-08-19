import React from "react";
import { useState } from "react";
import type { HubLead, Stage } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { formatBRL, shortDate } from "@/utils";
import { createTaskQuick } from "@/api/tasks";
import { Edit3, Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
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

  // Função para obter a cor do badge baseada no estágio
  const getStageColor = (stage: Stage) => {
    switch (stage) {
      case "prospect": return "bg-blue-500/20 text-blue-400";
      case "qualificado": return "bg-indigo-500/20 text-indigo-400";
      case "proposta": return "bg-purple-500/20 text-purple-400";
      case "producao": return "bg-yellow-500/20 text-yellow-400";
      case "testes": return "bg-orange-500/20 text-orange-400";
      case "entregue": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div 
      className="kanban-card cursor-pointer"
      onClick={() => navigate(`/leads/${lead.id}`)}
    >
      {/* Topo: nome + seletor */}
      <div className="kanban-card__top">
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setEditing(false); setName(lead.name); } }}
              onBlur={saveName}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className="kanban-card__name flex items-center gap-2"
              onClick={(e) => { 
                e.stopPropagation(); 
                setEditing(true); 
              }}
              title="Clique para renomear"
            >
              <span className="truncate">{name || "—"}</span>
              <Edit3 size={12} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          )}
        </div>

        <select
          className={`kanban-card__stage ${getStageColor(stage)}`}
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
          className="px-2 py-1 text-xs rounded-lg border border-[hsl(220,12%,18%)] hover:bg-[hsl(222,37%,14%)] flex items-center gap-1 transition"
          onClick={(e) => { e.stopPropagation(); setOpenQuickTask((v) => !v); }}
        >
          <Plus size={12} />
          Tarefa
        </button>
        {stage !== "entregue" && (
          <button
            className="px-2 py-1 text-xs rounded-lg border border-[hsl(220,12%,18%)] hover:bg-[hsl(222,37%,14%)] flex items-center gap-1 transition"
            onClick={(e) => { e.stopPropagation(); onStageChanged(lead.id, stage, "entregue"); }}
          >
            <Check size={12} />
            Entregue
          </button>
        )}
      </div>

      {/* Data de prazo (se houver) */}
      {lead.deadline && (
        <div className="kanban-deadline" title={`Prazo: ${shortDate(lead.deadline)}`}>
          ⏰ {shortDate(lead.deadline)}
        </div>
      )}

      {/* Formulário compacto */}
      {openQuickTask && (
        <div 
          className="mt-3 rounded-xl border border-[hsl(220,12%,18%)] p-3 bg-[hsl(222,37%,12%)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-xs text-[hsl(215,12%,65%)] mb-2">Nova tarefa</div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              className="flex-1 bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 w-full"
              placeholder="Título…"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createQuickTask(); }}
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                className="flex-1 sm:flex-none bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 w-full"
                placeholder="Tag"
                value={quickTag}
                onChange={(e) => setQuickTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createQuickTask(); }}
              />
              <button className="btn-primary px-3 py-1 text-sm rounded-xl" onClick={createQuickTask}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

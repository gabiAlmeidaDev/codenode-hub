import React, { useState } from "react";
import type { HubLead, Stage, Service } from "@/lib/types";
import { formatBRL, shortDate } from "@/utils";
import { Edit3, Plus, X } from "lucide-react";

const STAGES: Stage[] = ["prospect","qualificado","proposta","producao","testes","entregue"];
const SERVICES: Service[] = ["landing", "agente", "combo"];

interface CardData {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  service: Service;
  stage: Stage;
  amount: number | null;
  deadline: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  done: boolean;
  tag: string | null;
  createdAt: string;
}

export default function LeadCard({
  lead,
  stage,
  onStageChanged,
}: {
  lead: HubLead;
  stage: Stage;
  onStageChanged: (id: string, from: Stage, to: Stage) => void;
}) {
  // Estado local para os dados do card
  const [cardData, setCardData] = useState<CardData>({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    service: lead.service,
    stage: lead.stage,
    amount: lead.amount,
    deadline: lead.deadline,
    notes: lead.notes,
    createdAt: lead.created_at,
    updatedAt: lead.updated_at
  });
  
  // Estado para as tarefas
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Estados de UI
  const [isEditing, setIsEditing] = useState(false);
  const [openQuickTask, setOpenQuickTask] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickTag, setQuickTag] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("");

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

  // Função para salvar o nome
  const saveName = () => {
    setIsEditing(false);
  };

  // Função para criar tarefa rápida
  const createQuickTask = () => {
    if (quickTitle.trim()) {
      const newTask: Task = {
        id: `temp-${Date.now()}`,
        title: quickTitle,
        done: false,
        tag: quickTag || null,
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, newTask]);
      setQuickTitle("");
      setQuickTag("");
    }
    setOpenQuickTask(false);
  };

  // Função para alternar tarefa
  const toggleTask = (taskId: string, done: boolean) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, done } : task
    ));
  };

  // Função para criar nova tarefa
  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      const newTask: Task = {
        id: `temp-${Date.now()}`,
        title: newTaskTitle,
        done: false,
        tag: newTaskTag || null,
        createdAt: new Date().toISOString()
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
      setNewTaskTag("");
    }
  };

  // Função para salvar todas as alterações
  const saveAllChanges = () => {
    // Aqui você pode implementar a lógica para salvar as alterações
    // Por enquanto, vamos apenas fechar o modo de edição
    setIsEditing(false);
  };

  return (
    <div className="kanban-card cursor-pointer">
      {/* Nome do cliente - Fixado no topo */}
      <div className="mb-1.5">
        {isEditing ? (
          <input
            className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-md px-2.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
            value={cardData.name}
            onChange={(e) => setCardData({...cardData, name: e.target.value})}
            onBlur={saveName}
            autoFocus
          />
        ) : (
          <div
            className="font-medium text-sm truncate block w-full"
            onClick={() => setIsEditing(true)}
            title="Clique para editar"
          >
            {cardData.name || "—"}
          </div>
        )}
      </div>

      {/* Dropdown */}
      <div className="mb-1.5">
        <select
          className={`kanban-card__stage ${getStageColor(stage)} text-xs w-full`}
          value={stage}
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

      {/* Tipo de serviço e valor */}
      <div className="kanban-card__meta mb-2 text-xs">
        <div className="capitalize">{cardData.service || "—"}</div>
        {cardData.amount != null && <div>{formatBRL(cardData.amount)}</div>}
      </div>

      {/* Ações */}
      <div className="kanban-card__actions mb-5 text-xs">
        <button
          className="px-2 py-1 text-xs rounded-md border border-[hsl(220,12%,18%)] hover:bg-[hsl(222,37%,14%)] flex items-center gap-1 transition"
          onClick={() => setOpenQuickTask((v) => !v)}
        >
          <Plus size={10} />
          Tarefa
        </button>
      </div>

      {/* Data de prazo (se houver) */}
      {cardData.deadline && (
        <div className="kanban-deadline text-[9px]" title={`Prazo: ${shortDate(cardData.deadline)}`}>
          ⏰ {shortDate(cardData.deadline)}
        </div>
      )}

      {/* Formulário compacto */}
      {openQuickTask && (
        <div 
          className="mt-3 rounded-xl border border-[hsl(220,12%,18%)] p-3 bg-[hsl(222,37%,12%)]"
        >
          <div className="text-[10px] text-[hsl(215,12%,65%)] mb-2">Nova tarefa</div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <input
              className="flex-1 bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-md px-2.5 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-violet-500 w-full"
              placeholder="Título…"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createQuickTask(); }}
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                className="flex-1 sm:flex-none bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-md px-2.5 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-violet-500 w-full"
                placeholder="Tag"
                value={quickTag}
                onChange={(e) => setQuickTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createQuickTask(); }}
              />
              <button className="btn-primary px-2.5 py-1 text-[10px] rounded-md" onClick={createQuickTask}>Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* Botão para editar card completo */}
      <button
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-[hsl(222,37%,14%)] transition"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        <Edit3 size={12} />
      </button>

      {/* Modal de edição completa */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-[hsl(222,37%,10%)] border border-[hsl(220,12%,18%)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(220,12%,18%)]">
              <input
                type="text"
                className="bg-transparent text-xl font-bold w-full focus:outline-none"
                value={cardData.name}
                onChange={(e) => setCardData({...cardData, name: e.target.value})}
              />
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-[hsl(222,37%,14%)] rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[hsl(215,12%,65%)] mb-1 block">
                    Telefone
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={cardData.phone || ""}
                    onChange={(e) => setCardData({...cardData, phone: e.target.value || null})}
                  />
                </div>

                <div>
                  <label className="text-sm text-[hsl(215,12%,65%)] mb-1 block">
                    Email
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={cardData.email || ""}
                    onChange={(e) => setCardData({...cardData, email: e.target.value || null})}
                  />
                </div>

                <div>
                  <label className="text-sm text-[hsl(215,12%,65%)] mb-1 block">
                    Serviço
                  </label>
                  <select
                    className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={cardData.service}
                    onChange={(e) => setCardData({...cardData, service: e.target.value as Service})}
                  >
                    {SERVICES.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-[hsl(215,12%,65%)] mb-1 block">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={cardData.amount || ""}
                    onChange={(e) => setCardData({...cardData, amount: e.target.value ? Number(e.target.value) : null})}
                  />
                </div>

                <div>
                  <label className="text-sm text-[hsl(215,12%,65%)] mb-1 block">
                    Prazo
                  </label>
                  <input
                    type="date"
                    className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={cardData.deadline ? cardData.deadline.split("T")[0] : ""}
                    onChange={(e) => setCardData({...cardData, deadline: e.target.value || null})}
                  />
                </div>

                <div>
                  <label className="text-sm text-[hsl(215,12%,65%)] mb-1 block">
                    Etapa
                  </label>
                  <select
                    className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                    value={cardData.stage}
                    onChange={(e) => setCardData({...cardData, stage: e.target.value as Stage})}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s} className="capitalize">{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="text-sm text-[hsl(215,12%,65%)] mb-1 block">
                  Notas
                </label>
                <textarea
                  className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[100px]"
                  value={cardData.notes || ""}
                  onChange={(e) => setCardData({...cardData, notes: e.target.value || null})}
                />
              </div>

              {/* Tarefas */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Tarefas</h3>
                
                {/* Nova tarefa */}
                <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                  <input
                    className="flex-1 bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 w-full"
                    placeholder="Nova tarefa..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateTask(); }}
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <input
                      className="flex-1 sm:flex-none bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 w-full"
                      placeholder="Tag"
                      value={newTaskTag}
                      onChange={(e) => setNewTaskTag(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleCreateTask(); }}
                    />
                    <button 
                      className="btn-primary px-4 py-2 text-sm rounded-xl"
                      onClick={handleCreateTask}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* Lista de tarefas */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center gap-3 p-3 bg-[hsl(222,37%,12%)] border border-[hsl(220,12%,18%)] rounded-xl"
                    >
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={(e) => toggleTask(task.id, e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className={`flex-1 ${task.done ? "line-through text-[hsl(215,12%,65%)]" : ""}`}>
                        {task.title}
                      </span>
                      {task.tag && (
                        <span className="text-xs bg-[hsl(222,37%,14%)] px-2 py-1 rounded">
                          {task.tag}
                        </span>
                      )}
                      <span className="text-xs text-[hsl(215,12%,65%)]">
                        {new Date(task.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ))}
                  
                  {tasks.length === 0 && (
                    <div className="text-center py-8 text-[hsl(215,12%,65%)]">
                      Nenhuma tarefa cadastrada
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-[hsl(220,12%,18%)]">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm rounded-xl border border-[hsl(220,12%,18%)] hover:bg-[hsl(222,37%,14%)] transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveAllChanges}
                className="btn-primary px-4 py-2 text-sm rounded-xl"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
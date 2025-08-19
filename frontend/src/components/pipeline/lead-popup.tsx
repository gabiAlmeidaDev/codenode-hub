import React, { useState, useEffect } from "react";
import type { HubLead, Stage, Service } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { formatBRL, shortDate } from "@/utils";
import { X, Calendar, DollarSign, Tag, User, Phone, Mail, FileText } from "lucide-react";
import { fetchTasks, createTaskQuick, toggleTask } from "@/api/tasks";
import { updateLead } from "@/api/hub";

interface LeadPopupProps {
  lead: HubLead;
  onClose: () => void;
  onStageChange: (id: string, from: Stage, to: Stage) => void;
}

export default function LeadPopup({ lead, onClose, onStageChange }: LeadPopupProps) {
  const [name, setName] = useState(lead.name);
  const [phone, setPhone] = useState(lead.phone || "");
  const [email, setEmail] = useState(lead.email || "");
  const [service, setService] = useState<Service>(lead.service);
  const [stage, setStage] = useState<Stage>(lead.stage);
  const [amount, setAmount] = useState<number | null>(lead.amount);
  const [deadline, setDeadline] = useState<string | null>(lead.deadline);
  const [notes, setNotes] = useState(lead.notes || "");
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const STAGES: Stage[] = ["prospect", "qualificado", "proposta", "producao", "testes", "entregue"];
  const SERVICES: Service[] = ["landing", "agente", "combo"];

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const data = await fetchTasks(lead.id);
      setTasks(data);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges() {
    setSaving(true);
    try {
      // Atualiza o lead
      await updateLead(lead.id, {
        name,
        phone: phone || null,
        email: email || null,
        service,
        stage,
        amount,
        deadline,
        notes
      });

      // Se o stage mudou, notifica o pai
      if (stage !== lead.stage) {
        onStageChange(lead.id, lead.stage, stage);
      }

      onClose();
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateTask() {
    if (!newTaskTitle.trim()) return;
    try {
      await createTaskQuick(lead.id, newTaskTitle);
      setNewTaskTitle("");
      setNewTaskTag("");
      loadTasks(); // Recarrega as tarefas
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
    }
  }

  async function handleToggleTask(taskId: string, done: boolean) {
    try {
      await toggleTask(taskId, done);
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, done } : task
      ));
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
    }
  }

  return (
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
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button 
            onClick={onClose}
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
              <label className="text-sm text-[hsl(215,12%,65%)] flex items-center gap-2 mb-1">
                <Phone size={14} />
                Telefone
              </label>
              <input
                type="text"
                className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-[hsl(215,12%,65%)] flex items-center gap-2 mb-1">
                <Mail size={14} />
                Email
              </label>
              <input
                type="text"
                className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-[hsl(215,12%,65%)] flex items-center gap-2 mb-1">
                <Tag size={14} />
                Serviço
              </label>
              <select
                className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={service}
                onChange={(e) => setService(e.target.value as Service)}
              >
                {SERVICES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-[hsl(215,12%,65%)] flex items-center gap-2 mb-1">
                <DollarSign size={14} />
                Valor (R$)
              </label>
              <input
                type="number"
                className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={amount || ""}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : null)}
              />
            </div>

            <div>
              <label className="text-sm text-[hsl(215,12%,65%)] flex items-center gap-2 mb-1">
                <Calendar size={14} />
                Prazo
              </label>
              <input
                type="date"
                className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={deadline ? deadline.split("T")[0] : ""}
                onChange={(e) => setDeadline(e.target.value || null)}
              />
            </div>

            <div>
              <label className="text-sm text-[hsl(215,12%,65%)] flex items-center gap-2 mb-1">
                <Tag size={14} />
                Etapa
              </label>
              <select
                className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={stage}
                onChange={(e) => setStage(e.target.value as Stage)}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="text-sm text-[hsl(215,12%,65%)] flex items-center gap-2 mb-1">
              <FileText size={14} />
              Notas
            </label>
            <textarea
              className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[100px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
                    onChange={(e) => handleToggleTask(task.id, e.target.checked)}
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
                    {new Date(task.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
              
              {tasks.length === 0 && !loading && (
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
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-[hsl(220,12%,18%)] hover:bg-[hsl(222,37%,14%)] transition"
          >
            Cancelar
          </button>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="btn-primary px-4 py-2 text-sm rounded-xl flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { listTasksByLead, createTaskQuick, toggleTaskDone, deleteTask, type Task } from "@/api/tasks";
import { shortDate, formatBRL } from "@/utils";

type Stage = "prospect" | "qualificado" | "proposta" | "producao" | "testes" | "entregue";

type HubLead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage: Stage;
  service: string | null;
  amount: number | null;
  deadline: string | null;
  created_at: string;
  notes?: string | null;
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<HubLead | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // formulário rápido de tarefa
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("hub_lead")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        setLead(data as HubLead);

        const t = await listTasksByLead(id);
        setTasks(t);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const pending = useMemo(() => tasks.filter(t => !t.done), [tasks]);
  const done = useMemo(() => tasks.filter(t => t.done), [tasks]);

  async function onCreateTask() {
    const t = title.trim();
    if (!id || !t) return;
    try {
      const created = await createTaskQuick({ lead_id: id, title: t, tag: tag || null });
      setTasks(prev => [created, ...prev]);
      setTitle("");
      setTag("");
    } catch (e) {
      console.error(e);
      alert("Falha ao criar tarefa");
    }
  }

  async function onToggleTask(task: Task) {
    try {
      setTasks(prev => prev.map(x => (x.id === task.id ? { ...x, done: !x.done } : x))); // otimista
      await toggleTaskDone(task.id, !task.done);
    } catch (e) {
      console.error(e);
      alert("Falha ao atualizar tarefa");
    }
  }

  async function onDeleteTask(task: Task) {
    if (!confirm("Excluir esta tarefa?")) return;
    try {
      setTasks(prev => prev.filter(x => x.id !== task.id)); // otimista
      await deleteTask(task.id);
    } catch (e) {
      console.error(e);
      alert("Falha ao excluir tarefa");
    }
  }

  if (loading) {
    return <div className="card p-4">Carregando…</div>;
  }
  if (!lead) {
    return (
      <div className="card p-4">
        Lead não encontrado. <button className="btn ml-2" onClick={() => navigate("/leads")}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do lead */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xl font-semibold truncate">{lead.name}</div>
            <div className="text-sm text-[hsl(215,12%,70%)] flex flex-wrap gap-4 mt-1">
              {lead.email && <span>{lead.email}</span>}
              {lead.phone && <span>{lead.phone}</span>}
              <span className="capitalize">Estágio: {lead.stage}</span>
              {lead.service && <span className="capitalize">Serviço: {lead.service}</span>}
              {lead.amount != null && <span>Valor: {formatBRL(lead.amount)}</span>}
              {lead.deadline && <span>Prazo: {shortDate(lead.deadline)}</span>}
              <span>Criado: {shortDate(lead.created_at)}</span>
            </div>
          </div>
          <button className="btn" onClick={() => navigate("/leads")}>Voltar</button>
        </div>
      </div>

      {/* Criar tarefa rápida */}
      <div className="card p-4">
        <div className="text-sm font-medium mb-2">Nova tarefa</div>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 bg-transparent border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm"
            placeholder="Título…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onCreateTask(); }}
          />
          <input
            className="w-40 bg-transparent border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm"
            placeholder="Tag (opcional)"
            value={tag}
            onChange={e => setTag(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onCreateTask(); }}
          />
          <button className="btn-primary" onClick={onCreateTask}>Criar</button>
        </div>
      </div>

      {/* Tarefas */}
      <div className="grid md:grid-cols-2 gap-4">
        <TaskList title={`Pendentes (${pending.length})`} items={pending} onToggle={onToggleTask} onDelete={onDeleteTask} />
        <TaskList title={`Concluídas (${done.length})`} items={done} onToggle={onToggleTask} onDelete={onDeleteTask} />
      </div>
    </div>
  );
}

function TaskList({
  title,
  items,
  onToggle,
  onDelete,
}: {
  title: string;
  items: Task[];
  onToggle: (t: Task) => void;
  onDelete: (t: Task) => void;
}) {
  return (
    <div className="card p-3">
      <div className="text-sm font-medium mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-[hsl(215,12%,70%)] text-sm">Nada aqui.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((t) => (
            <li key={t.id} className="flex items-center gap-2 border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => onToggle(t)}
                className="cursor-pointer"
                title="Concluir"
              />
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${t.done ? "line-through opacity-70" : ""}`}>{t.title}</div>
                <div className="text-[10px] text-[hsl(215,12%,70%)]">
                  {t.tag ? <span>#{t.tag} • </span> : null}
                  {shortDate(t.created_at)}
                </div>
              </div>
              <button className="btn" onClick={() => onDelete(t)} title="Excluir">Excluir</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

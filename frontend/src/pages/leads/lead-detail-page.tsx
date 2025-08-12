import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { HubLead, HubTask } from "@/lib/types";
import { fetchLeadById, fetchTasks, toggleTask, updateLead } from "@/api/hub";
import { formatBRL, shortDate } from "@/utils";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<HubLead | null>(null);
  const [tasks, setTasks] = useState<HubTask[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [l, t] = await Promise.all([fetchLeadById(id), fetchTasks(id)]);
      setLead(l);
      setTasks(t);
    })();
  }, [id]);

  async function handleToggle(task: HubTask) {
    await toggleTask(task.id, !task.done);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
  }

  async function handleSaveNotes(notes: string) {
    if (!lead) return;
    setSaving(true);
    try {
      await updateLead(lead.id, { notes });
      setLead({ ...lead, notes });
    } finally {
      setSaving(false);
    }
  }

  if (!lead) return <div className="text-[hsl(215,12%,65%)]">Carregando…</div>;

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">{lead.name}</div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 col-span-2 space-y-2">
          <div className="text-sm text-[hsl(215,12%,65%)]">
            Serviço: <span className="capitalize">{lead.service}</span> • Estágio: <span className="capitalize">{lead.stage}</span> • Valor: {formatBRL(lead.amount)} • Prazo: {shortDate(lead.deadline)}
          </div>

          <div className="font-medium mt-4 mb-2">Checklist</div>
          <ul className="space-y-2 text-sm">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => handleToggle(t)}
                  className="w-4 h-4 accent-[hsl(280,80%,60%)]"
                />
                <span className={t.done ? "line-through text-[hsl(215,12%,65%)]" : ""}>{t.title}</span>
                {t.tag && <span className="text-[hsl(215,12%,65%)] text-xs ml-auto">#{t.tag}</span>}
              </li>
            ))}
            {tasks.length === 0 && <li className="text-[hsl(215,12%,65%)]">Sem tarefas…</li>}
          </ul>
        </div>

        <div className="card p-4">
          <div className="font-medium mb-3">Notas</div>
          <textarea
            className="w-full h-40 bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl p-3 text-sm outline-none"
            defaultValue={lead.notes ?? ""}
            onBlur={(e) => handleSaveNotes(e.target.value)}
            placeholder="Anotações do projeto…"
          />
          <div className="text-[hsl(215,12%,65%)] text-xs mt-2">
            {saving ? "Salvando…" : "As notas salvam automaticamente ao sair do campo."}
          </div>
        </div>
      </div>
    </div>
  );
}

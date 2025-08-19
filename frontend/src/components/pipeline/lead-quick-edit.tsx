import React from "react";
import { useState } from "react";
import type { HubLead, Stage } from "@/lib/types";
import { updateLead, moveLeadStage, createTaskQuick } from "@/api/hub";
import StageSelect from "./stage-select";
import { formatBRL, parseBRLtoCents, shortDate } from "@/utils";
import { useToast } from "@/components/common/toast";

export default function LeadQuickEdit({
  lead,
  onClose,
  onUpdated, // recebe patch e info se stage mudou
}: {
  lead: HubLead;
  onClose: () => void;
  onUpdated: (patch: Partial<HubLead>, stageChanged?: { from: Stage; to: Stage }) => void;
}) {
  const { show } = useToast();

  const [name, setName] = useState<string>(lead.name);
  const [stage, setStage] = useState<Stage>(lead.stage);
  const [amount, setAmount] = useState<string>(formatBRL(lead.amount));
  const [deadline, setDeadline] = useState<string>(lead.deadline ? lead.deadline.slice(0, 10) : "");
  const [taskTitle, setTaskTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      // 1) Atualiza campos simples (nome, valor, prazo)
      const cents = parseBRLtoCents(amount);
      const patch: Partial<HubLead> = {
        name: name.trim() || lead.name,
        amount: cents ?? null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      };
      await updateLead(lead.id, patch);

      // 2) Se mudou estágio, persiste e sinaliza mudança
      let stageChanged: { from: Stage; to: Stage } | undefined;
      if (stage !== lead.stage) {
        await moveLeadStage(lead.id, lead.stage, stage);
        stageChanged = { from: lead.stage, to: stage };
        patch.stage = stage;
      }

      // 3) Task rápida opcional
      if (taskTitle.trim()) {
        await createTaskQuick(lead.id, taskTitle.trim());
      }

      onUpdated(patch, stageChanged);
      show({ type: "success", title: "Lead atualizado", description: "Dados salvos com sucesso." });
      onClose();
    } catch (e: any) {
      console.error(e);
      show({
        type: "error",
        title: "Erro ao salvar",
        description: e?.message || "Verifique a conexão e as políticas (RLS).",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="card p-5 w-full max-w-md">
        <div className="text-lg font-semibold mb-1">Editar lead</div>
        <div className="text-[hsl(215,12%,65%)] text-xs mb-4">Atualizado: {shortDate(lead.updated_at)}</div>

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="text-[hsl(215,12%,65%)]">Nome</span>
            <input
              className="mt-1 w-full bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do lead"
            />
          </label>

          <label className="block text-sm">
            <span className="text-[hsl(215,12%,65%)]">Estágio</span>
            <div className="mt-1">
              <StageSelect value={stage} onChange={setStage} />
            </div>
          </label>

          <label className="block text-sm">
            <span className="text-[hsl(215,12%,65%)]">Valor (BRL)</span>
            <input
              className="mt-1 w-full bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl px-3 py-2"
              placeholder="R$ 0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[hsl(215,12%,65%)]">Prazo</span>
            <input
              type="date"
              className="mt-1 w-full bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl px-3 py-2"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[hsl(215,12%,65%)]">Criar tarefa rápida (opcional)</span>
            <input
              className="mt-1 w-full bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl px-3 py-2"
              placeholder="Título da tarefa…"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}


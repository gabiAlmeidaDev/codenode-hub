import React, { useState } from "react";
import type { Stage } from "@/lib/types";
import { X } from "lucide-react";

interface CreateCardModalProps {
  stages: Stage[];
  onCreate: (name: string, stage: Stage) => void;
  onClose: () => void;
}

export default function CreateCardModal({ stages, onCreate, onClose }: CreateCardModalProps) {
  const [name, setName] = useState("");
  const [stage, setStage] = useState<Stage>(stages[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), stage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-[hsl(222,37%,10%)] border border-[hsl(220,12%,18%)] rounded-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[hsl(220,12%,18%)]">
          <h3 className="text-lg font-semibold">Novo Card</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[hsl(222,37%,14%)] rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-[hsl(215,12%,65%)] mb-1">
              Nome do Cliente
            </label>
            <input
              type="text"
              className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do cliente"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-[hsl(215,12%,65%)] mb-1">
              Etapa
            </label>
            <select
              className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
            >
              {stages.map((s) => (
                <option key={s} value={s} className="capitalize">
                  {s === "prospect" && "Prospect"}
                  {s === "qualificado" && "Qualificado"}
                  {s === "proposta" && "Proposta"}
                  {s === "producao" && "Produção"}
                  {s === "testes" && "Testes"}
                  {s === "entregue" && "Entregue"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-[hsl(220,12%,18%)] hover:bg-[hsl(222,37%,14%)] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-sm rounded-xl"
              disabled={!name.trim()}
            >
              Criar Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
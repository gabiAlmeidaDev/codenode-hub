// src/components/pipeline/column-modal.tsx
import React, { useState, useEffect } from "react";
import type { HubColumn } from "@/lib/types";
import { X } from "lucide-react";

interface ColumnModalProps {
  column?: HubColumn; // Se fornecido, é uma edição; caso contrário, é criação
  onSave: (column: Omit<HubColumn, "id" | "created_at" | "updated_at">) => void;
  onClose: () => void;
}

// Cores predefinidas para as colunas
const PREDEFINED_COLORS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Blue", value: "#60a5fa" },
  { name: "Green", value: "#10b981" },
  { name: "Yellow", value: "#fbbf24" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#a78bfa" },
];

export default function ColumnModal({ column, onSave, onClose }: ColumnModalProps) {
  const [name, setName] = useState(column?.name || "");
  const [color, setColor] = useState(column?.color || "#6366f1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      color,
      order_index: column?.order_index || 0
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
         onClick={onClose}>
      <div 
        className="bg-[hsl(222,37%,10%)] border border-[hsl(220,12%,18%)] rounded-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[hsl(220,12%,18%)]">
          <h3 className="text-lg font-semibold">
            {column ? "Editar Coluna" : "Nova Coluna"}
          </h3>
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
              Nome da Coluna
            </label>
            <input
              type="text"
              className="w-full bg-[hsl(222,37%,14%)] border border-[hsl(220,12%,18%)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome da coluna"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[hsl(215,12%,65%)] mb-1">
              Cor
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PREDEFINED_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`h-10 rounded-lg border-2 transition ${
                    color === c.value 
                      ? "border-white ring-2 ring-violet-500" 
                      : "border-[hsl(220,12%,18%)]"
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                />
              ))}
            </div>
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
            >
              {column ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
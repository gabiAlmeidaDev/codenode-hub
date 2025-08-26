// src/components/pipeline/column-header.tsx
import React, { useState } from "react";
import type { HubColumn } from "@/lib/types";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import ColumnModal from "./column-modal";

interface ColumnHeaderProps {
  column: HubColumn;
  onEdit: (id: string, updates: Partial<Omit<HubColumn, "id" | "created_at" | "updated_at">>) => void;
  onDelete: (id: string) => void;
}

export default function ColumnHeader({ column, onEdit, onDelete }: ColumnHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEdit = (updates: Partial<Omit<HubColumn, "id" | "created_at" | "updated_at">>) => {
    onEdit(column.id, updates);
    setShowEditModal(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja deletar a coluna "${column.name}"?`)) {
      onDelete(column.id);
    }
    setShowMenu(false);
  };

  // Função para obter a cor do texto baseada na cor de fundo
  const getTextColorClass = (bgColor: string) => {
    // Esta é uma implementação simplificada
    // Em produção, você pode querer usar uma biblioteca como tinycolor2
    // Para cores escuras, usar texto branco; para cores claras, usar texto preto
    return "text-white";
  };

  return (
    <>
      <div 
        className={`px-3 py-2 text-base font-medium flex items-center justify-between ${getTextColorClass(column.color)}`}
        style={{ color: column.color }}
      >
        <span className="capitalize">{column.name}</span>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-black/20 rounded transition"
          >
            <MoreHorizontal size={16} />
          </button>
          
          {showMenu && (
            <div 
              className="absolute right-0 top-full mt-1 w-48 bg-[hsl(222,37%,10%)] border border-[hsl(220,12%,18%)] rounded-xl shadow-lg z-10"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => {
                  setShowEditModal(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-[hsl(222,37%,14%)] rounded-t-xl flex items-center gap-2"
              >
                <Edit size={16} />
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left text-sm hover:bg-[hsl(222,37%,14%)] rounded-b-xl flex items-center gap-2 text-red-400"
              >
                <Trash2 size={16} />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <ColumnModal
          column={column}
          onSave={handleEdit}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
// src/hooks/useColumns.ts
import { useState, useEffect } from "react";
import type { HubColumn } from "@/lib/types";
import { fetchColumns, createColumn, updateColumn, deleteColumn, reorderColumns } from "@/api/columns";

export function useColumns() {
  const [columns, setColumns] = useState<HubColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar colunas
  const loadColumns = async () => {
    setLoading(true);
    setError(null);
    
    const data = await fetchColumns();
    if (data) {
      // Ordenar colunas pelo order_index
      const sortedColumns = [...data].sort((a, b) => a.order_index - b.order_index);
      setColumns(sortedColumns);
    } else {
      setError("Falha ao carregar colunas");
    }
    
    setLoading(false);
  };

  // Criar coluna
  const addColumn = async (column: Omit<HubColumn, "id" | "created_at" | "updated_at">) => {
    const newColumn = await createColumn(column);
    if (newColumn) {
      // Adicionar a nova coluna na posição correta
      const updatedColumns = [...columns, newColumn]
        .sort((a, b) => a.order_index - b.order_index);
      setColumns(updatedColumns);
      return newColumn;
    }
    return null;
  };

  // Atualizar coluna
  const editColumn = async (id: string, updates: Partial<Omit<HubColumn, "id" | "created_at" | "updated_at">>) => {
    const updatedColumn = await updateColumn(id, updates);
    if (updatedColumn) {
      setColumns(prev => 
        prev.map(col => col.id === id ? { ...col, ...updatedColumn } : col)
      );
      return updatedColumn;
    }
    return null;
  };

  // Deletar coluna
  const removeColumn = async (id: string) => {
    const success = await deleteColumn(id);
    if (success) {
      setColumns(prev => prev.filter(col => col.id !== id));
      return true;
    }
    return false;
  };

  // Reordenar colunas
  const reorder = async (newOrder: { id: string; order_index: number }[]) => {
    const success = await reorderColumns(newOrder);
    if (success) {
      // Atualizar a ordem local
      const updatedColumns = [...columns];
      newOrder.forEach(({ id, order_index }) => {
        const index = updatedColumns.findIndex(col => col.id === id);
        if (index !== -1) {
          updatedColumns[index] = { ...updatedColumns[index], order_index };
        }
      });
      
      // Ordenar pela nova ordem
      updatedColumns.sort((a, b) => a.order_index - b.order_index);
      setColumns(updatedColumns);
      return true;
    }
    return false;
  };

  // Efeito para carregar colunas na inicialização
  useEffect(() => {
    loadColumns();
  }, []);

  return {
    columns,
    loading,
    error,
    loadColumns,
    addColumn,
    editColumn,
    removeColumn,
    reorder
  };
}
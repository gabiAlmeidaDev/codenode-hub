// src/pages/pipeline/pipeline-page.tsx
import React, { useState } from "react";
import { useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";

import LeadCard from "@/components/pipeline/lead-card";
import CreateCardModal from "@/components/pipeline/create-card-modal";
import ColumnModal from "@/components/pipeline/column-modal";
import ColumnHeader from "@/components/pipeline/column-header";
import type { HubLead, HubColumn } from "@/lib/types";
import { fetchLeads, moveLeadColumn, reorderLeadsInColumn } from "@/api/hub";
import { supabase } from "@/lib/supabase";
import { useColumns } from "@/hooks/useColumns";

export default function PipelinePage() {
  const [all, setAll] = useState<HubLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateColumnModal, setShowCreateColumnModal] = useState(false);
  
  // Hook para gerenciar colunas
  const { columns, loading: columnsLoading, addColumn, editColumn, removeColumn, reorder } = useColumns();
  
  // Função para abrir o modal de criação de card
  const openCreateModal = () => {
    setShowCreateModal(true);
  };
  
  // Função para fechar o modal de criação de card
  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const createNewLead = async (name: string, columnId: string) => {
    try {
      // Garantir que o nome não esteja vazio
      const validName = name.trim() || "Cliente sem nome";
      
      const { data, error } = await supabase
        .from("hub_lead")
        .insert({
          name: validName,
          column_id: columnId,
          service: "landing", // Valor padrão para o campo service
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Atualiza o estado local
      setAll(prev => [...prev, data]);
      
      // Fecha o modal
      closeCreateModal();
    } catch (err) {
      console.error("Erro ao criar lead:", err);
    }
  };

  // DnD sensores
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // para saber de onde saiu
  const activeIdRef = useRef<string | null>(null);
  const fromColumnRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchLeads();
        setAll(rows ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Agrupa por column_id e ordena por order_index (se houver), fallback created_at
  const byColumn = useMemo(() => {
    const map: Record<string, HubLead[]> = {};
    
    // Inicializar com todas as colunas
    columns.forEach(col => {
      map[col.id] = [];
    });
    
    // Preencher com leads
    for (const l of all) {
      const columnId = l.column_id || 'uncategorized';
      if (!map[columnId]) {
        map[columnId] = [];
      }
      map[columnId].push(l);
    }
    
    // Ordenar leads em cada coluna
    Object.keys(map).forEach(columnId => {
      map[columnId].sort((a, b) => {
        const ao = a.order_index ?? 0;
        const bo = b.order_index ?? 0;
        if (ao !== bo) return ao - bo;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });
    
    return map;
  }, [all, columns]);

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    activeIdRef.current = id;
    const item = all.find((l) => l.id === id);
    fromColumnRef.current = item?.column_id ?? null;
    console.log("Drag start:", { id, item });
  }

  function handleDragOver(e: DragOverEvent) {
    const activeId = activeIdRef.current;
    if (!activeId) return;

    const overId = e.over?.id;
    if (!overId) return;

    const overKey = String(overId);
    console.log("Drag over:", { activeId, overId, overKey });

    // destino é coluna?
    if (overKey.startsWith("col:")) {
      const to = overKey.replace("col:", "");
      const item = all.find((l) => l.id === activeId);
      if (!item || item.column_id === to) return;

      console.log("Movendo card para coluna:", { from: item.column_id, to });

      // UI otimista: move para o topo da coluna destino
      setAll((prev) => {
        const src = [...prev];
        const idx = src.findIndex((l) => l.id === activeId);
        if (idx === -1) return prev;
        const moved = { ...src[idx], column_id: to, order_index: 0 };
        src.splice(idx, 1);

        // insere antes do primeiro item dessa coluna ou no final se estiver vazia
        const firstIndexOfCol = src.findIndex((l) => l.column_id === to);
        const insertAt = firstIndexOfCol === -1 ? src.length : firstIndexOfCol;
        src.splice(insertAt, 0, moved);
        return src;
      });
      return;
    }

    // destino é outro card? reordenar dentro da coluna do 'over'
    const target = all.find((l) => l.id === overKey);
    const active = all.find((l) => l.id === activeId);
    if (!target || !active) return;

    const from = active.column_id;
    const to = target.column_id;

    // se mudou de coluna: mover e inserir antes do alvo
    if (from !== to) {
      setAll((prev) => {
        const src = [...prev];
        const iFrom = src.findIndex((l) => l.id === activeId);
        const iOver = src.findIndex((l) => l.id === target.id);
        if (iFrom === -1 || iOver === -1) return prev;

        const moved = { ...src[iFrom], column_id: to, order_index: target.order_index - 0.5 };
        src.splice(iFrom, 1);
        // inserir no índice global do alvo (antes dele)
        const insertAt = src.findIndex((l) => l.id === target.id);
        src.splice(insertAt === -1 ? src.length : insertAt, 0, moved);
        
        // Atualizar order_index da coluna destino
        const colItems = src.filter((l) => l.column_id === to);
        colItems.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        colItems.forEach((item, index) => {
          const idx = src.findIndex((l) => l.id === item.id);
          if (idx !== -1) {
            src[idx] = { ...src[idx], order_index: index };
          }
        });
        
        return src;
      });
      return;
    }

    // mesma coluna: reordenar
    if (from === to) {
      const ids = byColumn[from].map((x) => x.id);
      const oldIndex = ids.indexOf(activeId);
      const newIndex = ids.indexOf(target.id);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        setAll((prev) => {
          const src = [...prev];
          const activeItem = src.find((l) => l.id === activeId);
          const targetItem = src.find((l) => l.id === target.id);
          
          if (!activeItem || !targetItem) return prev;
          
          // Remover o item ativo
          const activeIndex = src.findIndex((l) => l.id === activeId);
          src.splice(activeIndex, 1);
          
          // Inserir antes do target
          const targetIndex = src.findIndex((l) => l.id === target.id);
          src.splice(targetIndex, 0, {
            ...activeItem,
            order_index: targetItem.order_index - 0.5 // Valor temporário
          });
          
          // Atualizar os order_index
          const sortedColumn = src
            .filter((l) => l.column_id === from)
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
          
          sortedColumn.forEach((lead, index) => {
            const idx = src.findIndex((l) => l.id === lead.id);
            if (idx !== -1) {
              src[idx] = { ...src[idx], order_index: index };
            }
          });
          
          return src;
        });
      }
    }
  }

  async function handleDragEnd() {
    const activeId = activeIdRef.current;
    const from = fromColumnRef.current;
    activeIdRef.current = null;
    fromColumnRef.current = null;
    if (!activeId) return;

    console.log("Drag end:", { activeId, from });

    // Depois do estado final, persistir:
    try {
      const item = all.find((l) => l.id === activeId);
      if (!item) return;

      const to = item.column_id;
      if (from && from !== to) {
        console.log("Movendo lead no banco:", { activeId, from, to });
        // Atualizar para usar column_id em vez de stage
        const success = await moveLeadColumn(activeId, from, to);
        
        if (!success) throw new Error("Failed to move lead column");
      }
      // Reordenar IDs na coluna atual
      const ids = all
        .filter((l) => l.column_id === to)
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((l) => l.id);
      await reorderLeadsInColumn(to, ids);
    } catch (err) {
      console.error(err);
      // rollback simples: refetch
      try {
        const rows = await fetchLeads();
        setAll(rows ?? []);
      } catch {}
    }
  }

  // === Render
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Pipeline</div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateColumnModal(true)}
            className="btn-secondary px-4 py-2 text-sm rounded-xl flex items-center gap-2"
          >
            <Plus size={16} />
            Nova Coluna
          </button>
          <button
            onClick={openCreateModal}
            className="btn-primary px-4 py-2 text-sm rounded-xl flex items-center gap-2"
          >
            <Plus size={16} />
            Novo Card
          </button>
        </div>
      </div>

      {(loading || columnsLoading) ? (
        <div className="card p-4">Carregando…</div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {columns.map((col) => (
              <Column 
                key={col.id} 
                column={col} 
                count={byColumn[col.id]?.length || 0}
                onEdit={editColumn}
                onDelete={removeColumn}
              >
                <div className="space-y-3">
                  {byColumn[col.id]?.map((lead) => (
                    <SortableItem key={lead.id} id={lead.id}>
                      <LeadCard
                        lead={lead}
                        stage={col.id} // Usar column_id como stage por enquanto
                        onStageChanged={async (id, from, to) => {
                          // permite mudar via <select> do card
                          if (from === to) return;
                          // otimista
                          setAll((prev) => {
                            const idx = prev.findIndex((l) => l.id === id);
                            if (idx === -1) return prev;
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], column_id: to };
                            return copy;
                          });
                          // persiste
                          const success = await moveLeadColumn(id, from, to);
                          
                          if (!success) {
                            // rollback
                            const rows = await fetchLeads();
                            setAll(rows ?? []);
                          }
                        }}
                      />
                    </SortableItem>
                  ))}
                </div>
              </Column>
            ))}
          </div>
        </DndContext>
      )}

      {/* Modal de criação de card */}
      {showCreateModal && (
        <CreateCardModal
          columns={columns}
          onCreate={createNewLead}
          onClose={closeCreateModal}
        />
      )}

      {/* Modal de criação de coluna */}
      {showCreateColumnModal && (
        <ColumnModal
          onSave={(column) => {
            addColumn(column);
            setShowCreateColumnModal(false);
          }}
          onClose={() => setShowCreateColumnModal(false)}
        />
      )}
    </div>
  );
}

/* =======================
   Componentes locais
   ======================= */

function Column({
  column,
  count,
  children,
  onEdit,
  onDelete
}: {
  column: HubColumn;
  count: number;
  children: React.ReactNode;
  onEdit: (id: string, updates: Partial<Omit<HubColumn, "id" | "created_at" | "updated_at">>) => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${column.id}` });
  
  // Função para obter a cor do header baseada na cor da coluna
  const getHeaderColorStyle = () => {
    return { color: column.color };
  };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border border-[hsl(220,12%,18%)] bg-[hsl(222,37%,11%)] p-3 ${
        isOver ? "ring-1 ring-violet-500/40" : ""
      }`}
    >
      <ColumnHeader 
        column={column} 
        onEdit={onEdit} 
        onDelete={onDelete} 
      />
      <div className="mt-2 space-y-3 min-h-[120px]">
        {children}
        {count === 0 && (
          <div className="h-[120px] flex items-center justify-center text-[hsl(215,12%,65%)] text-sm rounded-2xl border border-dashed border-[hsl(220,12%,18%)]">
            Arraste um card aqui
          </div>
        )}
      </div>
    </div>
  );
}

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 0,
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}
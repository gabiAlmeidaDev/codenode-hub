// src/pages/pipeline/pipeline-page.tsx
import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import LeadCard from "@/components/pipeline/lead-card";
import type { HubLead, Stage } from "@/lib/types";
import { fetchLeads, moveLeadStage, reorderLeadsInStage } from "@/api/hub";

// ---- colunas fixas e rótulos
const STAGES: Stage[] = [
  "prospect",
  "qualificado",
  "proposta",
  "producao",
  "testes",
  "entregue",
];

const PRETTY: Record<Stage, string> = {
  prospect: "Prospect",
  qualificado: "Qualificado",
  proposta: "Proposta",
  producao: "Produção",
  testes: "Testes",
  entregue: "Entregue",
};

export default function PipelinePage() {
  const [all, setAll] = useState<HubLead[]>([]);
  const [loading, setLoading] = useState(true);

  // DnD sensores (um só e confiável)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // para saber de onde saiu
  const activeIdRef = useRef<string | null>(null);
  const fromStageRef = useRef<Stage | null>(null);

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

  // Agrupa por stage e ordena por order_index (se houver), fallback created_at
  const byStage = useMemo(() => {
    const map: Record<Stage, HubLead[]> = {
      prospect: [],
      qualificado: [],
      proposta: [],
      producao: [],
      testes: [],
      entregue: [],
    };
    for (const l of all) map[l.stage].push(l);
    for (const s of STAGES) {
      map[s].sort((a, b) => {
        const ao = a.order_index ?? 0;
        const bo = b.order_index ?? 0;
        if (ao !== bo) return ao - bo;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    }
    return map;
  }, [all]);

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    activeIdRef.current = id;
    const item = all.find((l) => l.id === id);
    fromStageRef.current = item?.stage ?? null;
  }

  function handleDragOver(e: DragOverEvent) {
    const activeId = activeIdRef.current;
    if (!activeId) return;

    const overId = e.over?.id;
    if (!overId) return;

    const overKey = String(overId);

    // destino é coluna?
    if (overKey.startsWith("col:")) {
      const to = overKey.replace("col:", "") as Stage;
      const item = all.find((l) => l.id === activeId);
      if (!item || item.stage === to) return;

      // UI otimista: move para o topo da coluna destino
      setAll((prev) => {
        const src = [...prev];
        const idx = src.findIndex((l) => l.id === activeId);
        if (idx === -1) return prev;
        const moved = { ...src[idx], stage: to, order_index: 0 };
        src.splice(idx, 1);

        // insere antes do primeiro item dessa coluna
        const firstIndexOfCol = src.findIndex((l) => l.stage === to);
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

    const from = active.stage;
    const to = target.stage;

    // se mudou de coluna: mover e inserir antes do alvo
    if (from !== to) {
      setAll((prev) => {
        const src = [...prev];
        const iFrom = src.findIndex((l) => l.id === activeId);
        const iOver = src.findIndex((l) => l.id === target.id);
        if (iFrom === -1 || iOver === -1) return prev;

        const moved = { ...src[iFrom], stage: to, order_index: 0 };
        src.splice(iFrom, 1);
        // inserir no índice global do alvo (antes dele)
        const insertAt = src.findIndex((l) => l.id === target.id);
        src.splice(insertAt === -1 ? src.length : insertAt, 0, moved);
        return src;
      });
      return;
    }

    // mesma coluna: reordenar
    const ids = byStage[from].map((x) => x.id);
    const oldIndex = ids.indexOf(activeId);
    const newIndex = ids.indexOf(target.id);
    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const orderedIds = arrayMove(ids, oldIndex, newIndex);
      setAll((prev) => {
        const copy = [...prev];
        // reordena somente os da coluna
        const inCol = copy.filter((l) => l.stage === from);
        const dict = Object.fromEntries(inCol.map((l) => [l.id, l]));
        const reordered = orderedIds.map((id, i) => {
          const obj = { ...(dict[id] as HubLead) };
          obj.order_index = i;
          return obj;
        });
        const others = copy.filter((l) => l.stage !== from);
        return [...others, ...reordered];
      });
    }
  }

  async function handleDragEnd(_: DragEndEvent) {
    const activeId = activeIdRef.current;
    const from = fromStageRef.current;
    activeIdRef.current = null;
    fromStageRef.current = null;
    if (!activeId) return;

    // Depois do estado final, persistir:
    try {
      const item = all.find((l) => l.id === activeId);
      if (!item) return;

      const to = item.stage;
      if (from && from !== to) {
        await moveLeadStage(activeId, from, to);
      }
      // Reordenar IDs no estágio atual
      const ids = byStage[to].map((l) => l.id);
      await reorderLeadsInStage(to, ids);
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
      <div className="text-xl font-semibold">Pipeline</div>

      {loading ? (
        <div className="card p-4">Carregando…</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {STAGES.map((col) => (
              <Column key={col} id={col} title={PRETTY[col]} count={byStage[col].length}>
                <SortableContext
                  items={byStage[col].map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {byStage[col].map((lead) => (
                    <Item key={lead.id} id={lead.id}>
                      <LeadCard
                        lead={lead}
                        stage={col}
                        onStageChanged={(id, from, to) => {
                          // permite mudar via <select> do card
                          if (from === to) return;
                          // otimista
                          setAll((prev) => {
                            const idx = prev.findIndex((l) => l.id === id);
                            if (idx === -1) return prev;
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], stage: to, order_index: 0 };
                            return copy;
                          });
                          // persiste
                          moveLeadStage(id, from, to)
                            .then(async () => {
                              const ids = byStage[to].map((l) => l.id);
                              await reorderLeadsInStage(to, ids);
                            })
                            .catch(async () => {
                              // rollback
                              const rows = await fetchLeads();
                              setAll(rows ?? []);
                            });
                        }}
                      />
                    </Item>
                  ))}
                </SortableContext>
              </Column>
            ))}
          </div>
        </DndContext>
      )}
    </div>
  );
}

/* =======================
   Componentes locais
   ======================= */

function Column({
  id,
  title,
  count,
  children,
}: {
  id: Stage;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${id}` });
  
  // Função para obter a cor do header baseada no estágio
  const getHeaderColor = (stage: Stage) => {
    switch (stage) {
      case "prospect": return "text-blue-400";
      case "qualificado": return "text-indigo-400";
      case "proposta": return "text-purple-400";
      case "producao": return "text-yellow-400";
      case "testes": return "text-orange-400";
      case "entregue": return "text-green-400";
      default: return "text-[hsl(215,12%,80%)]";
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl border border-[hsl(220,12%,18%)] bg-[hsl(222,37%,11%)] p-3 ${
        isOver ? "ring-1 ring-violet-500/40" : ""
      }`}
    >
      <div className={`px-2 py-1 text-sm font-medium flex items-center justify-between ${getHeaderColor(id)}`}>
        <span className="capitalize">{title}</span>
        <span className="opacity-70 text-xs">({count})</span>
      </div>
      <div className="mt-2 space-y-3 min-h-[120px]">{children}</div>
    </div>
  );
}

function Item({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}



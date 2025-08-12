import { useEffect, useMemo, useState, ReactNode } from "react";
import type { HubLead, Stage } from "@/lib/types";
import { fetchLeads, moveLeadStage } from "@/api/hub";
import { formatBRL, shortDate } from "@/utils";
import LeadCard from "@/components/pipeline/lead-card";
import { supabase } from "@/lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useToast } from "@/components/common/toast";
import Skeleton from "@/components/common/skeleton";

import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  rectIntersection, useDraggable, useDroppable,
} from "@dnd-kit/core";

const COLUMNS: Stage[] = ["prospect", "qualificado", "proposta", "producao", "testes", "entregue"];
type ByStage = Record<Stage, HubLead[]>;

/** Draggable wrapper (reusa seu C3) */
function DraggableWrapper({ lead, stage, children }: { lead: HubLead; stage: Stage; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { stageFrom: stage },
  });
  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={isDragging ? "opacity-70" : "opacity-100"}>
      {children}
    </div>
  );
}

/** Droppable column */
function DroppableColumn({ stage, count, children }: { stage: Stage; count: number; children: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  return (
    <div className="card p-3">
      <div className="text-sm font-medium capitalize mb-2">
        {stage} <span className="text-[hsl(215,12%,65%)]">({count})</span>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[60px] rounded-xl p-1 transition-colors ${isOver ? "bg-[hsl(222,37%,14%)]" : "bg-transparent"}`}
      >
        {children}
        {count === 0 && <div className="text-[hsl(215,12%,65%)] text-sm">—</div>}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { show } = useToast();
  const [loading, setLoading] = useState(true);

  // snapshot bruto e filtrado
  const [all, setAll] = useState<HubLead[]>([]);
  const [byStage, setByStage] = useState<ByStage>({
    prospect: [], qualificado: [], proposta: [], producao: [], testes: [], entregue: [],
  });

  // filtros
  const [query, setQuery] = useState("");
  const [activeStages, setActiveStages] = useState<Set<Stage>>(new Set(COLUMNS)); // chips
  const [service, setService] = useState<"" | "landing" | "agente" | "combo">("");

  // DnD
  const [activeLead, setActiveLead] = useState<HubLead | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const leadMap = useMemo(() => {
    const map = new Map<string, HubLead>();
    all.forEach((l) => map.set(l.id, l));
    return map;
  }, [all]);

  // carrega snapshot
  useEffect(() => {
    (async () => {
      setLoading(true);
      const rows = await fetchLeads({ limit: 2000 });
      setAll(rows);
      setLoading(false);
    })();
  }, []);

  // aplica filtros → byStage
  useEffect(() => {
    const q = query.trim().toLowerCase();
    const filtered = all.filter((l) => {
      const okStage = activeStages.has(l.stage);
      const okService = service ? l.service === service : true;
      const okQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q) ||
        (l.phone ?? "").toLowerCase().includes(q);
      return okStage && okService && okQuery;
    });
    const grouped: ByStage = { prospect: [], qualificado: [], proposta: [], producao: [], testes: [], entregue: [] };
    filtered.forEach((l) => grouped[l.stage].push(l));
    setByStage(grouped);
  }, [all, query, activeStages, service]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("lead-stage-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "hub_lead" }, // <- sem 'columns'
        (payload: RealtimePostgresChangesPayload<HubLead>) => {
          const rec = payload.new as HubLead;
          const from = (payload.old as HubLead).stage;
          const to = rec.stage;
  
          setAll((prev) => {
            const idx = prev.findIndex((l) => l.id === rec.id);
            if (idx === -1) return prev;
            const clone = [...prev];
            // atualiza tudo que possa ter mudado
            clone[idx] = { ...clone[idx], ...rec };
            return clone;
          });
  
          // Se quiser mover só quando stage mudar:
          //if (from !== to) { ... (já cobrimos acima via setAll) }
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
      

  // DnD handlers
  function handleDragStart(event: any) {
    const id = event.active?.id as string | undefined;
    if (!id) return;
    setActiveLead(leadMap.get(id) ?? null);
  }
  async function handleDragEnd(event: any) {
    const { active, over } = event;
    setActiveLead(null);
    if (!active || !over) return;
    const leadId = active.id as string;
    const from = active.data?.current?.stageFrom as Stage | undefined;
    const to = over.id as Stage;
    if (!from || !to || from === to) return;

    // otimista: move em 'all' (que recalcula por filtros)
    setAll((prev) => {
      const idx = prev.findIndex((l) => l.id === leadId);
      if (idx === -1) return prev;
      const clone = [...prev];
      clone[idx] = { ...clone[idx], stage: to };
      return clone;
    });

    try {
      await moveLeadStage(leadId, from, to);
      show({ type: "success", title: "Estágio atualizado", description: `De ${from} → ${to}` });
    } catch (e) {
      // rollback
      setAll((prev) => {
        const idx = prev.findIndex((l) => l.id === leadId);
        if (idx === -1) return prev;
        const clone = [...prev];
        clone[idx] = { ...clone[idx], stage: from! };
        return clone;
      });
      show({ type: "error", title: "Falha ao mover", description: "Verifique a conexão/RLS." });
      console.error(e);
    }
  }

  // chamado pelo modal de edição rápida (C4)
  function moveInColumns(leadId: string, from: Stage, to: Stage) {
    if (from === to) return;
    setAll((prev) => {
      const idx = prev.findIndex((l) => l.id === leadId);
      if (idx === -1) return prev;
      const clone = [...prev];
      clone[idx] = { ...clone[idx], stage: to };
      return clone;
    });
    show({ type: "success", title: "Estágio alterado", description: `De ${from} → ${to}` });
  }

  // UI — filtros
  function toggleStage(s: Stage) {
    setActiveStages((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Pipeline</div>

        {/* Filtros rápidos */}
        <div className="flex items-center gap-2">
          <input
            className="bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl px-3 py-2 text-sm w-64"
            placeholder="Buscar por nome, email, telefone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl px-3 py-2 text-sm"
            value={service}
            onChange={(e) => setService(e.target.value as any)}
          >
            <option className="bg-[hsl(222,37%,10%)]" value="">Todos os serviços</option>
            <option className="bg-[hsl(222,37%,10%)]" value="landing">Landing</option>
            <option className="bg-[hsl(222,37%,10%)]" value="agente">Agente</option>
            <option className="bg-[hsl(222,37%,10%)]" value="combo">Combo</option>
          </select>
        </div>
      </div>

      {/* Chips de estágio */}
      <div className="flex flex-wrap gap-2">
        {COLUMNS.map((s) => {
          const active = activeStages.has(s);
          return (
            <button
              key={s}
              onClick={() => toggleStage(s)}
              className={`px-3 py-1 rounded-2xl text-xs border border-[hsl(220,12%,18%)] capitalize ${
                active ? "bg-[hsl(222,37%,14%)]" : "opacity-70"
              }`}
              title={active ? "Incluído no filtro" : "Excluído do filtro"}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* GRID */}
      {loading ? (
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-3">
              <Skeleton className="h-4 w-40 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={(e) => {
            const id = e.active?.id as string | undefined;
            if (!id) return;
            setActiveLead(leadMap.get(id) ?? null);
          }}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-6 gap-3">
            {COLUMNS.map((col) => (
              <DroppableColumn key={col} stage={col} count={byStage[col].length}>
                {byStage[col].map((lead) => (
                  <DraggableWrapper key={lead.id} lead={lead} stage={col}>
                    <LeadCard lead={lead} stage={col} onStageChanged={moveInColumns} />
                  </DraggableWrapper>
                ))}
              </DroppableColumn>
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <div className="rounded-2xl border border-[hsl(220,12%,18%)] p-3 bg-[hsl(222,37%,12%)] opacity-90">
                <div className="font-medium">{activeLead.name}</div>
                <div className="text-[hsl(215,12%,65%)] text-xs flex gap-3">
                  <span className="capitalize">{activeLead.service}</span>
                  <span>{formatBRL(activeLead.amount)}</span>
                  <span>⏰ {shortDate(activeLead.deadline)}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <div className="text-[hsl(215,12%,65%)] text-xs">
        Dica: use os chips para filtrar etapas e a busca para funilar por nome, email ou telefone.
      </div>
    </div>
  );
}

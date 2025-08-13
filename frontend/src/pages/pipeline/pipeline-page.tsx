import { useEffect, useMemo, useState, ReactNode } from "react";
import type { HubLead, Stage, HubSettings, WipLimits } from "@/lib/types";
import { fetchLeads, moveLeadStage, reorderLeadsInStage } from "@/api/hub";
import { getSettings, setWipEnabled, setWipLimits } from "@/api/settings";
import { formatBRL, shortDate } from "@/utils";
import LeadCard from "@/components/pipeline/lead-card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/common/toast";
import Skeleton from "@/components/common/skeleton";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
  useDroppable,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ======== Constantes ======== */
const COLUMNS: Stage[] = [
  "prospect",
  "qualificado",
  "proposta",
  "producao",
  "testes",
  "entregue",
];

type ByStage = Record<Stage, HubLead[]>;

/* ======== Utils locais ======== */
function findStageByLeadId(by: ByStage, id: string): Stage | null {
  for (const s of COLUMNS) {
    if (by[s].some((l) => l.id === id)) return s;
  }
  return null;
}

function SortableItem({
  lead,
  children,
}: {
  lead: HubLead;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lead.id }); // ← só useSortable (nada de useDraggable aqui)

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "opacity-70" : ""}
    >
      {children}
    </div>
  );
}

function DroppableColumn({
  stage,
  count,
  wipEnabled,
  limit,
  children,
}: {
  stage: Stage;
  count: number;
  wipEnabled: boolean;
  limit: number | null;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  const overLimit = wipEnabled && limit !== null && count > limit;

  return (
    <div className={`card p-3 ${overLimit ? "border-red-500/40" : ""}`}>
      <div className="text-sm font-medium capitalize mb-2 flex items-center gap-2">
        <span>{stage}</span>
        <span
          className={`text-[hsl(215,12%,65%)] ${
            overLimit ? "text-red-400" : ""
          }`}
        >
          ({count}
          {limit ? `/${limit}` : ""})
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[60px] rounded-xl p-1 transition-colors ${
          isOver ? "bg-[hsl(222,37%,14%)]" : "bg-transparent"
        }`}
      >
        {children}
        {count === 0 && (
          <div className="text-[hsl(215,12%,65%)] text-sm">—</div>
        )}
      </div>
    </div>
  );
}

/* ======== Modal de WIP ======== */
function WipModal({
  open,
  onClose,
  settings,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  settings: HubSettings;
  onSave: (limits: WipLimits) => Promise<void>;
}) {
  const [local, setLocal] = useState<WipLimits>(settings.wip_limits || {});
  useEffect(() => {
    setLocal(settings.wip_limits || {});
  }, [settings]);
  const cols: Stage[] = COLUMNS;

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="card p-5 w-full max-w-md">
        <div className="text-lg font-semibold mb-3">Limites WIP por coluna</div>
        <div className="space-y-2">
          {cols.map((c) => (
            <label
              key={c}
              className="flex items-center justify-between gap-3 text-sm capitalize"
            >
              <span>{c}</span>
              <input
                type="number"
                min={0}
                placeholder="sem limite"
                className="w-24 bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl px-3 py-1 text-right"
                value={local[c] ?? ""}
                onChange={(e) => {
                  const v =
                    e.target.value === ""
                      ? undefined
                      : Math.max(0, Number(e.target.value));
                  setLocal((prev) => ({ ...prev, [c]: v as any }));
                }}
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              await onSave(local);
              onClose();
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ======== Página ======== */
export default function PipelinePage() {
  const { show } = useToast();

  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState<HubLead[]>([]);
  const [byStage, setByStage] = useState<ByStage>({
    prospect: [],
    qualificado: [],
    proposta: [],
    producao: [],
    testes: [],
    entregue: [],
  });

  // filtros
  const [query, setQuery] = useState("");
  const [activeStages, setActiveStages] = useState<Set<Stage>>(
    new Set(COLUMNS),
  );
  const [service, setService] = useState<"" | "landing" | "agente" | "combo">(
    "",
  );

  // DnD
  const [activeLead, setActiveLead] = useState<HubLead | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // WIP settings
  const [settings, setSettings] = useState<HubSettings | null>(null);
  const [wipOpen, setWipOpen] = useState(false);

  // order_index
  const [supportsOrderIndex, setSupportsOrderIndex] = useState(true);

  const leadMap = useMemo(() => {
    const m = new Map<string, HubLead>();
    all.forEach((l) => m.set(l.id, l));
    return m;
  }, [all]);

  /* Carrega leads + settings */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [rows, s] = await Promise.all([fetchLeads({ limit: 2000 }), getSettings()]);
      setAll(rows);
      setSettings(s);
      setLoading(false);
      const anyOrder = rows.some(
        (r: any) => typeof r.order_index === "number",
      );
      setSupportsOrderIndex(anyOrder);
    })();
  }, []);

  /* Aplica filtros e ordena */
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

    const grouped: ByStage = {
      prospect: [],
      qualificado: [],
      proposta: [],
      producao: [],
      testes: [],
      entregue: [],
    };
    filtered.forEach((l) => grouped[l.stage].push(l));

    // order: order_index asc (null last), then created_at desc
    COLUMNS.forEach((col) => {
      grouped[col].sort((a, b) => {
        const ai = a.order_index ?? Number.POSITIVE_INFINITY;
        const bi = b.order_index ?? Number.POSITIVE_INFINITY;
        if (ai !== bi) return ai - bi;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    });

    setByStage(grouped);
  }, [all, query, activeStages, service]);

  /* Realtime */
  useEffect(() => {
    const channel = supabase
      .channel("lead-stage-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "hub_lead" },
        (payload) => {
          const rec = payload.new as HubLead;
          setAll((prev) => {
            const idx = prev.findIndex((l) => l.id === rec.id);
            if (idx === -1) return prev;
            const clone = [...prev];
            clone[idx] = { ...clone[idx], ...rec };
            return clone;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* DnD handlers */
  function handleDragStart(e: any) {
    const id = e.active?.id as string | undefined;
    if (!id) return;
    setActiveLead(leadMap.get(id) ?? null);
  }

  async function handleDragEnd(e: any) {
    const { active, over } = e;
    setActiveLead(null);
    if (!active || !over) return;

    const draggedId = active.id as string;

    // Descobrir 'from' pelo estado atual
    const from = findStageByLeadId(byStage, draggedId);
    if (!from) return;

    // Descobrir 'to':
    // - se o over.id for o id de uma coluna (Stage), usa direto;
    // - se for id de item, acha a coluna onde o 'over.id' está.
    let to: Stage | null = null;
    const overId = over.id as string;
    if ((COLUMNS as string[]).includes(overId)) {
      to = overId as Stage;
    } else {
      to = findStageByLeadId(byStage, overId);
    }
    if (!to) return;

    // 1) reorder dentro da mesma coluna
    if (from === to) {
      const col = byStage[from];
      const oldIndex = col.findIndex((l) => l.id === draggedId);
      const newIndex = col.findIndex((l) => l.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      // UI otimista
      setByStage((prev) => {
        const next = { ...prev, [from]: arrayMove(prev[from], oldIndex, newIndex) };
        return next as ByStage;
      });

      if (supportsOrderIndex) {
        const orderedIds = arrayMove(col, oldIndex, newIndex).map((l) => l.id);
        try {
          await reorderLeadsInStage(from, orderedIds);
        } catch (err) {
          // rollback visual (não crítico)
          setByStage((prev) => ({ ...prev, [from]: col }) as ByStage);
          console.error(err);
          show({
            type: "error",
            title: "Não foi possível salvar a nova ordem.",
          });
        }
      }
      return;
    }
    // 2) mover entre colunas (WIP + posição alvo)
      const wipEnabled = settings?.wip_enabled ?? false;
      const limit = (settings?.wip_limits?.[to] ?? null) as number | null;
      const destCol = byStage[to];
      const destCount = destCol.length;

      if (wipEnabled && limit !== null && destCount + 1 > limit) {
        show({ type: "error", title: "Limite da coluna atingido", description: `A coluna "${to}" aceita até ${limit} cards.` });
        return;
      }

      /** calcula índice de inserção na coluna destino */
      function calcTargetIndex(): number {
        const overId = e.over.id as string;

        // soltou na “área” da coluna -> fim da lista
        if ((COLUMNS as string[]).includes(overId)) return destCol.length;

        // soltou sobre um item -> antes/depois do item conforme metade do cartão
        const overIndex = destCol.findIndex((l) => l.id === overId);
        if (overIndex === -1) return destCol.length;

        // heurística: metade de baixo -> depois; metade de cima -> antes
        const activeTop = e.active?.rect?.current?.translated?.top ?? 0;
        const overTop = (e.over as any)?.rect?.top ?? 0;
        const overHeight = (e.over as any)?.rect?.height ?? 0;
        const isBelow = activeTop > overTop + overHeight / 2;

        return overIndex + (isBelow ? 1 : 0);
      }

      const insertIndex = calcTargetIndex();

      // UI otimista: remove do 'from' e insere em 'to' na posição calculada
        setByStage((prev) => {
        const next: ByStage = {
          prospect: [...prev.prospect],
          qualificado: [...prev.qualificado],
          proposta: [...prev.proposta],
          producao: [...prev.producao],
          testes: [...prev.testes],
          entregue: [...prev.entregue],
        };

        const fromList = next[from];
        const toList = next[to];

        const dragged = fromList.find((l) => l.id === draggedId);
        if (!dragged) return prev;

        // tira do from
        next[from] = fromList.filter((l) => l.id !== draggedId);

        // insere no to na posição alvo
        const newLead = { ...dragged, stage: to, order_index: insertIndex };
        toList.splice(insertIndex, 0, newLead);

        // reindexa order_index localmente (0..n) para a coluna destino
        toList.forEach((l, i) => (l.order_index = i));

        return next;
      });

      try {
        // persiste estágio
        await moveLeadStage(draggedId, from, to);

        // persiste ordem da coluna destino (se suportado)
        if (supportsOrderIndex) {
          const orderedIds = (byStage[to].slice(0, insertIndex)   // antes
            .map((l) => l.id))
            .concat([draggedId])                                  // o card novo
            .concat(byStage[to].slice(insertIndex).map((l) => l.id)); // depois
          await reorderLeadsInStage(to, orderedIds);
        }

        show({ type: "success", title: "Estágio atualizado", description: `De ${from} → ${to}` });
      } catch (err) {
        // rollback simples: volta o stage no array 'all'
        setAll((prev) => {
          const idx = prev.findIndex((l) => l.id === draggedId);
          if (idx === -1) return prev;
          const clone = [...prev];
          clone[idx] = { ...clone[idx], stage: from };
          return clone;
        });
        console.error(err);
        show({ type: "error", title: "Falha ao mover", description: "Verifique conexão/RLS." });
      }
  }

  /* UI helpers */
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Pipeline</div>

        <div className="flex items-center gap-2">
          {/* WIP controls */}
          {settings && (
            <div className="flex items-center gap-2 mr-2">
              <label className="flex items-center gap-2 text-xs text-[hsl(215,12%,65%)]">
                <input
                  type="checkbox"
                  checked={!!settings.wip_enabled}
                  onChange={async (e) => {
                    try {
                      const updated = await setWipEnabled(e.target.checked);
                      setSettings(updated);
                      show({
                        type: "success",
                        title: `WIP ${e.target.checked ? "ativado" : "desativado"}`,
                      });
                    } catch (err) {
                      console.error(err);
                      show({ type: "error", title: "Erro ao salvar WIP" });
                    }
                  }}
                />
                Enforce WIP
              </label>
              <button
                className="btn btn-ghost text-xs"
                onClick={() => setWipOpen(true)}
              >
                Configurar WIP
              </button>
            </div>
          )}

          {/* Filtros rápidos */}
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
            <option className="bg-[hsl(222,37%,10%)]" value="">
              Todos os serviços
            </option>
            <option className="bg-[hsl(222,37%,10%)]" value="landing">
              Landing
            </option>
            <option className="bg-[hsl(222,37%,10%)]" value="agente">
              Agente
            </option>
            <option className="bg-[hsl(222,37%,10%)]" value="combo">
              Combo
            </option>
          </select>
        </div>
      </div>

      {/* Chips de estágio */}
      <div className="flex flex-wrap gap-2">
        {COLUMNS.map((s) => {
          const active = activeStages.has(s);
          const limit = (settings?.wip_limits?.[s] ?? null) as number | null;
          const enabled = settings?.wip_enabled ?? false;
          return (
            <button
              key={s}
              onClick={() => toggleStage(s)}
              className={`px-3 py-1 rounded-2xl text-xs border border-[hsl(220,12%,18%)] capitalize ${
                active ? "bg-[hsl(222,37%,14%)]" : "opacity-70"
              }`}
              title={
                active
                  ? "Incluído no filtro"
                  : "Excluído do filtro"
              }
            >
              {s}
              {enabled && limit ? ` (${limit})` : ""}
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
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-6 gap-3">
            {COLUMNS.map((col) => (
              <DroppableColumn
                key={col}
                stage={col}
                count={byStage[col].length}
                wipEnabled={!!settings?.wip_enabled}
                limit={(settings?.wip_limits?.[col] ?? null) as number | null}
              >
                <SortableContext
                  items={byStage[col].map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {byStage[col].map((lead) => (
                    <SortableItem key={lead.id} lead={lead}>
                      <LeadCard
                        lead={lead}
                        stage={col}
                        onStageChanged={(id, from, to) => {
                          const enabled = settings?.wip_enabled ?? false;
                          const limit = (settings?.wip_limits?.[to] ?? null) as number | null;
                          const destCount = byStage[to].length;
                          if (enabled && limit !== null && destCount + 1 > limit) {
                            show({
                              type: "error",
                              title: "Limite da coluna atingido",
                              description: `A coluna "${to}" aceita até ${limit} cards.`,
                            });
                            return;
                          }
                          // UI: muda de coluna, topo
                          setAll((prev) => {
                            const idx = prev.findIndex((l) => l.id === id);
                            if (idx === -1) return prev;
                            const clone = [...prev];
                            clone[idx] = { ...clone[idx], stage: to, order_index: 0 };
                            return clone;
                          });
                        }}
                      />
                    </SortableItem>
                  ))}
                </SortableContext>
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

      {/* Modal WIP */}
      {settings && (
        <WipModal
          open={wipOpen}
          onClose={() => setWipOpen(false)}
          settings={settings}
          onSave={async (limits) => {
            try {
              const updated = await setWipLimits(limits);
              setSettings(updated);
              show({ type: "success", title: "WIP atualizado" });
            } catch (err) {
              console.error(err);
              show({ type: "error", title: "Erro ao salvar limites" });
            }
          }}
        />
      )}

      <div className="text-[hsl(215,12%,65%)] text-xs">
        Dica: arraste para reordenar. O WIP pode bloquear mover para colunas
        lotadas.
      </div>
    </div>
  );
}

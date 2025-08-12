import { useState } from "react";
import { Link } from "react-router-dom";
import type { HubLead, Stage } from "@/lib/types";
import { formatBRL, shortDate } from "@/utils";
import LeadQuickEdit from "./lead-quick-edit";
import { MoreHorizontal, Clock } from "lucide-react";

export default function LeadCard({
  lead,
  stage,
  onStageChanged, // callback para mover entre colunas quando estágio muda no modal
}: {
  lead: HubLead;
  stage: Stage;
  onStageChanged?: (leadId: string, from: Stage, to: Stage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [localLead, setLocalLead] = useState<HubLead>(lead);

  return (
    <div className="relative rounded-2xl border border-[hsl(220,12%,18%)] p-3 select-none transition-transform duration-200 ease-gentle bg-[hsl(222,37%,12%)]">
      {/* Título / Nome */}
      <div className="font-medium leading-snug">
        <Link className="hover:underline" to={`/leads/${localLead.id}`}>
          {localLead.name}
        </Link>
      </div>

      {/* Linha principal: serviço + valor */}
      <div className="mt-1 text-[hsl(215,12%,65%)] text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="capitalize">{localLead.service}</span>
          <span>{formatBRL(localLead.amount)}</span>
        </div>
      </div>

      {/* Rodapé dentro do card: relógio + prazo (direita) */}
      <div className="mt-3 flex items-center justify-end text-[hsl(215,12%,65%)] text-xs">
        <Clock size={12} className="mr-1" />
        <span>{shortDate(localLead.deadline)}</span>
      </div>

      {/* Botão de menu (kebab) */}
      <button
        className="absolute right-2 top-2 p-1 rounded-xl hover:bg-[hsl(222,37%,14%)]"
        onClick={() => setMenu((s) => !s)}
        title="Ações"
        type="button"
      >
        <MoreHorizontal size={16} />
      </button>

      {/* Menu de ações */}
      {menu && (
        <div
          className="absolute right-2 top-8 card p-2 text-sm z-10 w-44"
          onMouseLeave={() => setMenu(false)}
        >
          <button
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[hsl(222,37%,14%)]"
            onClick={() => {
              setMenu(false);
              setOpen(true);
            }}
            type="button"
          >
            Editar rápido
          </button>
          <Link
            className="block px-3 py-2 rounded-xl hover:bg-[hsl(222,37%,14%)]"
            to={`/leads/${localLead.id}`}
          >
            Abrir detalhe
          </Link>
        </div>
      )}

      {/* Modal de edição rápida */}
      {open && (
        <LeadQuickEdit
          lead={localLead}
          onClose={() => setOpen(false)}
          onUpdated={(patch, stageChanged) => {
            // atualiza dados locais (nome/valor/prazo/estágio)
            setLocalLead((prev) => ({ ...prev, ...patch }));
            // se mudou estágio, pede pra página mover o card de coluna
            if (stageChanged && onStageChanged) {
              onStageChanged(localLead.id, stageChanged.from, stageChanged.to);
            }
          }}
        />
      )}
    </div>
  );
}

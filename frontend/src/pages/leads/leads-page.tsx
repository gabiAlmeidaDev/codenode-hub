import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "@/components/common/skeleton";
import { formatBRL, shortDate } from "@/utils";
import type { HubLead, Stage } from "@/lib/types";
import { fetchLeads } from "@/api/hub";
import { Search, Filter } from "lucide-react";

export default function LeadsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<HubLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<"" | Stage>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchLeads({ limit: 500 });
        setRows(data ?? []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const data = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter(l => {
      const okStage = stage ? l.stage === stage : true;
      const okQ =
        !ql ||
        l.name.toLowerCase().includes(ql) ||
        (l.email ?? "").toLowerCase().includes(ql) ||
        (l.phone ?? "").toLowerCase().includes(ql);
      return okStage && okQ;
    });
  }, [rows, q, stage]);

  const stageLabels: Record<Stage, string> = {
    prospect: "Prospect",
    qualificado: "Qualificado",
    proposta: "Proposta",
    producao: "Produção",
    testes: "Testes",
    entregue: "Entregue"
  };

  const serviceLabels: Record<string, string> = {
    landing: "Landing Page",
    agente: "Agente",
    combo: "Combo"
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-xl font-semibold">Leads</div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(215,12%,65%)]" size={16} />
            <input
              className="w-full bg-[hsl(222,37%,12%)] border border-[hsl(220,12%,18%)] rounded-2xl pl-10 pr-4 py-2 text-sm placeholder-[hsl(215,12%,65%)] focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Buscar por nome, email ou telefone…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <button 
            className="flex items-center gap-2 px-3 py-2 bg-[hsl(222,37%,12%)] border border-[hsl(220,12%,18%)] rounded-2xl text-sm hover:bg-[hsl(222,37%,14%)] transition"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filtros
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-[hsl(215,12%,70%)] mb-1">Estágio</label>
              <select
                className="w-full bg-[hsl(222,37%,12%)] border border-[hsl(220,12%,18%)] rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={stage}
                onChange={e => setStage(e.target.value as any)}
              >
                <option value="">Todos os estágios</option>
                {(["prospect","qualificado","proposta","producao","testes","entregue"] as Stage[]).map(s => (
                  <option key={s} value={s}>{stageLabels[s]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[hsl(215,12%,65%)]">
              <tr className="border-b border-[hsl(220,12%,18%)]">
                <th className="text-left p-3">Lead</th>
                <th className="text-left p-3">Estágio</th>
                <th className="text-left p-3">Serviço</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Prazo</th>
                <th className="text-left p-3">Criado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-3" colSpan={6}>
                      <Skeleton className="h-6" />
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td className="p-6 text-[hsl(215,12%,65%)] text-center" colSpan={6}>
                    Nenhum lead encontrado.
                  </td>
                </tr>
              ) : (
                data.map((lead) => (
                  <Row key={lead.id} lead={lead} stageLabels={stageLabels} serviceLabels={serviceLabels} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ lead, stageLabels, serviceLabels }: { 
  lead: HubLead; 
  stageLabels: Record<Stage, string>;
  serviceLabels: Record<string, string>;
}) {
  const navigate = useNavigate();
  
  // Função para obter a cor do badge baseada no estágio
  const getStageColor = (stage: Stage) => {
    switch (stage) {
      case "prospect": return "bg-blue-500/20 text-blue-400";
      case "qualificado": return "bg-indigo-500/20 text-indigo-400";
      case "proposta": return "bg-purple-500/20 text-purple-400";
      case "producao": return "bg-yellow-500/20 text-yellow-400";
      case "testes": return "bg-orange-500/20 text-orange-400";
      case "entregue": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <tr
      className="border-b border-[hsl(220,12%,18%)] hover:bg-[hsl(222,37%,14%)] cursor-pointer transition"
      onClick={() => navigate(`/leads/${lead.id}`)}
    >
      <td className="p-3">
        <div className="flex flex-col">
          <span className="font-medium">{lead.name}</span>
          <div className="text-xs text-[hsl(215,12%,65%)] flex gap-2 mt-1">
            {lead.email && <span>{lead.email}</span>}
            {lead.phone && <span>{lead.phone}</span>}
          </div>
        </div>
      </td>
      <td className="p-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageColor(lead.stage)}`}>
          {stageLabels[lead.stage]}
        </span>
      </td>
      <td className="p-3">
        <span className="capitalize">
          {lead.service ? serviceLabels[lead.service] : "—"}
        </span>
      </td>
      <td className="p-3">
        {lead.amount != null ? formatBRL(lead.amount) : "—"}
      </td>
      <td className="p-3">
        {lead.deadline ? shortDate(lead.deadline) : "—"}
      </td>
      <td className="p-3">
        {shortDate(lead.created_at)}
      </td>
    </tr>
  );
}

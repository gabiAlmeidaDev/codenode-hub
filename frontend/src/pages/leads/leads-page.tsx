import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import Skeleton from "@/components/common/skeleton";
import { formatBRL, shortDate } from "@/utils";
import type { HubLead, Stage } from "@/lib/types";
import CopyText from "@/components/common/copy-text";

export default function LeadsPage() {
  const [rows, setRows] = useState<HubLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<"" | Stage>("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("hub_lead")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) console.error(error);
      setRows((data as HubLead[]) ?? []);
      setLoading(false);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Leads</div>
        <div className="flex items-center gap-2">
          <input
            className="bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl px-3 py-2 text-sm w-64"
            placeholder="Buscar por nome/email/telefone…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <select
            className="bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl px-3 py-2 text-sm capitalize"
            value={stage}
            onChange={e => setStage(e.target.value as any)}
          >
            <option className="bg-[hsl(222,37%,10%)]" value="">Todos estágios</option>
            {["prospect","qualificado","proposta","producao","testes","entregue"].map(s =>
              <option key={s} className="bg-[hsl(222,37%,10%)] capitalize" value={s}>{s}</option>
            )}
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[hsl(215,12%,65%)]">
            <tr className="border-b border-[hsl(220,12%,18%)]">
              <th className="text-left p-3">Nome</th>
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
                <tr key={i}><td className="p-3" colSpan={6}><Skeleton className="h-6" /></td></tr>
              ))
            ) : data.length === 0 ? (
              <tr><td className="p-6 text-[hsl(215,12%,65%)]" colSpan={6}>Nenhum lead.</td></tr>
            ) : (
              data.map((l) => <Row key={l.id} lead={l} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ lead }: { lead: HubLead }) {
  const navigate = useNavigate();
  return (
    <tr
      className="border-b border-[hsl(220,12%,18%)] hover:bg-[hsl(222,37%,14%)] cursor-pointer"
      onClick={() => navigate(`/leads/${lead.id}`)}
    >
      <td className="p-3">
        <div className="flex flex-col">
        <span className="font-medium">{lead.name}</span>
        <div className="text-xs text-[hsl(215,12%,65%)] flex gap-3">
          {lead.email ? <CopyText text={lead.email}>{lead.email}</CopyText> : null}
          {lead.phone ? <CopyText text={lead.phone}>{lead.phone}</CopyText> : null}
    </div>
  </div>
</td>
      <td className="p-3">{lead.amount != null ? formatBRL(lead.amount) : "—"}</td>
      <td className="p-3">{lead.deadline ? shortDate(lead.deadline) : "—"}</td>
      <td className="p-3">{shortDate(lead.created_at)}</td>
    </tr>
  );
}

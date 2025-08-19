import React from "react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";

type Stage = "prospect" | "qualificado" | "proposta" | "producao" | "testes" | "entregue";
type LeadRow = { id: string; stage: Stage; amount: number | null; created_at: string };

export default function DashboardPage() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error }: PostgrestSingleResponse<LeadRow[]> = await supabase
        .from("hub_lead")
        .select("id, stage, amount, created_at")
        .limit(1000);
      if (error) console.error(error);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  const total = rows.length;
  const sum = useMemo(
    () => rows.reduce((acc, r) => acc + (r.amount ?? 0), 0),
    [rows]
  );
  const byStage = useMemo(() => {
    const map: Record<Stage, number> = {
      prospect: 0, qualificado: 0, proposta: 0, producao: 0, testes: 0, entregue: 0,
    };
    rows.forEach(r => { map[r.stage]++; });
    return map;
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">Dashboard</div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-sm text-[hsl(215,12%,70%)]">Leads</div>
          <div className="text-2xl font-semibold">{loading ? "…" : total}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[hsl(215,12%,70%)]">Valor total</div>
          <div className="text-2xl font-semibold">
            {loading ? "…" : sum.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-[hsl(215,12%,70%)]">Fechados</div>
          <div className="text-2xl font-semibold">{loading ? "…" : byStage.entregue}</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="text-sm font-medium mb-2">Por estágio</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {Object.entries(byStage).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-[hsl(220,12%,18%)] px-3 py-2 text-center">
              <div className="text-[11px] text-[hsl(215,12%,70%)] capitalize">{k}</div>
              <div className="text-lg font-semibold">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

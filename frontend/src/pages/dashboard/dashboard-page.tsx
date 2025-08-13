import { useEffect, useMemo, useState } from "react";
import { fetchAnalyticsBase } from "@/api/analytics";
import { formatBRL } from "@/utils";
import Skeleton from "@/components/common/skeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

type LeadRow = { id: string; stage: string; service: string; amount: number | null; created_at: string };
type TaskRow = { id: string; lead_id: string; done: boolean; tag: string | null; created_at: string };

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { leads, tasks } = await fetchAnalyticsBase();
      setLeads(leads as any[]);
      setTasks(tasks as any[]);
      setLoading(false);
    })();
  }, []);

  // KPIs básicos
  const kpis = useMemo(() => {
    const totalLeads = leads.length;
    const emProposta = leads.filter(l => l.stage === "proposta").length;
    const emProducao = leads.filter(l => l.stage === "producao").length;
    const totalTasks = tasks.length;
    const tasksDone = tasks.filter(t => t.done).length;
    const pipeValor = (leads.reduce((acc, l) => acc + (l.amount ?? 0), 0) || 0);

    return {
      totalLeads, emProposta, emProducao, totalTasks, tasksDone, pipeValor
    };
  }, [leads, tasks]);

  // Funil por estágio
  const porEstagio = useMemo(() => {
    const order = ["prospect","qualificado","proposta","producao","testes","entregue"];
    const map = new Map<string, number>();
    leads.forEach(l => map.set(l.stage, (map.get(l.stage) ?? 0) + 1));
    return order.map(s => ({ stage: s, count: map.get(s) ?? 0 }));
  }, [leads]);

  // Tarefas por tag (pizza)
  const porTag = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach(t => {
      const tag = t.tag ?? "sem-tag";
      map.set(tag, (map.get(tag) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([tag, count]) => ({ tag, count }));
  }, [tasks]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Dashboard</div>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-3">
          <KPI label="Leads" value={kpis.totalLeads} />
          <KPI label="Propostas" value={kpis.emProposta} />
          <KPI label="Em produção" value={kpis.emProducao} />
          <KPI label="Tasks" value={kpis.totalTasks} />
          <KPI label="Concluídas" value={kpis.tasksDone} />
          <KPI label="Valor no funil" value={formatBRL(kpis.pipeValor)} />
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-sm font-medium mb-2">Leads por estágio</div>
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={porEstagio}>
                  <XAxis dataKey="stage" tick={{ fill: "hsl(215,12%,70%)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "hsl(215,12%,70%)", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "hsl(222,37%,12%)", border: "1px solid hsl(220,12%,18%)", color: "white" }} />
                  <Bar dataKey="count" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="text-sm font-medium mb-2">Tarefas por tag</div>
          {loading ? (
            <Skeleton className="h-64" />
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie dataKey="count" data={porTag} outerRadius={90} nameKey="tag">
                    {porTag.map((_, i) => <Cell key={i} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(222,37%,12%)", border: "1px solid hsl(220,12%,18%)", color: "white" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-4 flex flex-col justify-center gap-1">
      <div className="text-[hsl(215,12%,65%)] text-xs">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

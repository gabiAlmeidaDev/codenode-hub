import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { fetchKpis } from "@/api/hub";
import type { Kpis } from "@/lib/types";

const KpiCard = ({ label, value, to }: { label: string; value: string | number; to: string }) => (
  <Link to={to} className="card p-5 block">
    <div className="text-sm text-[hsl(215,12%,65%)]">{label}</div>
    <div className="text-2xl font-semibold mt-1">{value}</div>
  </Link>
);

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchKpis();
        setKpis(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div
        className="rounded-2xl p-6"
        style={{ background: "linear-gradient(120deg, hsl(280 80% 20% / 0.35), hsl(200 90% 20% / 0.28))" }}
      >
        <div className="text-2xl font-semibold">Bem-vinda ao Hub</div>
        <div className="text-[hsl(215,12%,65%)]">Tudo clicável, escuro e elegante.</div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Leads (7d)" value={loading ? "…" : kpis?.leads7d ?? 0} to="/leads" />
        <KpiCard label="Conversão (30d)" value={loading ? "…" : `${kpis?.conversion30d ?? 0}%`} to="/leads" />
        <KpiCard label="Em Produção" value={loading ? "…" : kpis?.inProduction ?? 0} to="/pipeline" />
        <KpiCard label="Tasks Pendentes" value={loading ? "…" : kpis?.pendingTasks ?? 0} to="/leads" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-medium mb-3">Funil por estágio</div>
          <div className="h-56 flex items-center justify-center text-[hsl(215,12%,65%)]">
            Gráfico (entra no v0.2)
          </div>
        </div>
        <div className="card p-5">
          <div className="font-medium mb-3">Tarefas por tag</div>
          <div className="h-56 flex items-center justify-center text-[hsl(215,12%,65%)]">
            Gráfico (entra no v0.2)
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="font-medium mb-3">Próximas tarefas</div>
        <div className="text-[hsl(215,12%,65%)] text-sm">
          Lista (v0.1) • hoje conectamos os KPIs e roteiro de navegação
        </div>
      </div>
    </motion.div>
  );
}

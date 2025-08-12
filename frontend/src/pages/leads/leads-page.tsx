import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLeads } from "@/api/hub";
import type { HubLead } from "@/lib/types";
import { formatBRL, shortDate } from "@/utils";

export default function LeadsPage() {
  const [rows, setRows] = useState<HubLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchLeads({ limit: 100 });
        setRows(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Leads</div>
        <button className="btn btn-primary">Novo lead</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[hsl(215,12%,65%)]">
              <th className="p-3">Nome</th>
              <th className="p-3">Serviço</th>
              <th className="p-3">Estágio</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Prazo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-3 text-[hsl(215,12%,65%)]" colSpan={6}>
                  Carregando…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td className="p-3 text-[hsl(215,12%,65%)]" colSpan={6}>
                  Nenhum lead encontrado.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[hsl(220,12%,18%)]">
                <td className="p-3">{row.name}</td>
                <td className="p-3 capitalize">{row.service}</td>
                <td className="p-3 capitalize">{row.stage}</td>
                <td className="p-3">{formatBRL(row.amount)}</td>
                <td className="p-3">{shortDate(row.deadline)}</td>
                <td className="p-3 text-right">
                  <Link className="btn" to={`/leads/${row.id}`}>
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

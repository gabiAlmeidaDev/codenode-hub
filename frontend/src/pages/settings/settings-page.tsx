import { useEffect, useState } from "react";
import { getSettings, setWipEnabled, setWipLimits } from "@/api/settings";
import type { HubSettings, WipLimits, Stage } from "@/lib/types";
import Skeleton from "@/components/common/skeleton";
import { useToast } from "@/components/common/toast";

const COLUMNS: Stage[] = ["prospect","qualificado","proposta","producao","testes","entregue"];

export default function SettingsPage() {
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [s, setS] = useState<HubSettings | null>(null);
  const [local, setLocal] = useState<WipLimits>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const ss = await getSettings();     // já retorna defaults se não existir
        setS(ss);
        setLocal(ss.wip_limits || {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !s) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-20" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold">Settings</div>

      <div className="card p-4 space-y-3">
        <div className="text-sm font-medium">Work-in-Progress (WIP)</div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={s.wip_enabled}
            onChange={async (e) => {
              try {
                const updated = await setWipEnabled(e.target.checked);
                setS(updated);
                show({ type: "success", title: `WIP ${e.target.checked ? "ativado" : "desativado"}` });
              } catch (err) {
                console.error(err);
                show({ type: "error", title: "Erro ao salvar WIP" });
              }
            }}
          />
          Enforce WIP
        </label>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COLUMNS.map((c) => (
            <label key={c} className="flex items-center justify-between gap-3 text-sm capitalize">
              <span>{c}</span>
              <input
                type="number"
                min={0}
                placeholder="sem limite"
                className="w-28 bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl px-3 py-1 text-right"
                value={local[c] ?? ""}
                onChange={(e) => {
                  const v = e.target.value === "" ? undefined : Math.max(0, Number(e.target.value));
                  setLocal((prev) => ({ ...prev, [c]: v as any }));
                }}
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            onClick={async () => {
              try {
                const updated = await setWipLimits(local);
                setS(updated);
                show({ type: "success", title: "Limites atualizados" });
              } catch (err) {
                console.error(err);
                show({ type: "error", title: "Erro ao salvar limites" });
              }
            }}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

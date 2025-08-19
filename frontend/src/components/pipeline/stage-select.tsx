import React from "react";
import type { Stage } from "@/lib/types";

const STAGES: Stage[] = ["prospect","qualificado","proposta","producao","testes","entregue"];

export default function StageSelect({
  value, onChange
}: { value: Stage; onChange: (s: Stage) => void }) {
  return (
    <select
      className="bg-transparent text-xs border border-[hsl(220,12%,18%)] rounded-2xl px-2 py-1 capitalize"
      value={value}
      onChange={(e) => onChange(e.target.value as Stage)}
    >
      {STAGES.map(s => <option className="bg-[hsl(222,37%,10%)]" key={s} value={s}>{s}</option>)}
    </select>
  );
}

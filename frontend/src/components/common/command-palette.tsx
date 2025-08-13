import { Command } from "cmdk";
import { useState, useEffect } from "react";
import { globalSearch } from "@/api/search";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/common/toast";

const { show } = useToast();

export function CommandPalette({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ leads: any[]; tasks: any[] }>({
    leads: [],
    tasks: [],
  });
  const navigate = useNavigate();

  // limpa quando fecha
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({ leads: [], tasks: [] });
      setLoading(false);
    }
  }, [open]);

  // busca
  useEffect(() => {
    if (!query) {
      setResults({ leads: [], tasks: [] });
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const r = await globalSearch(query);
        setResults(r);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-24"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[560px] rounded-2xl overflow-hidden shadow-2xl border border-[hsl(220,12%,18%)]"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          label="Busca global"
          className="bg-[hsl(222,37%,8%)] text-white"
          shouldFilter={false} // filtramos via Supabase
        >
          <div className="border-b border-[hsl(220,12%,18%)]">
            <Command.Input
              autoFocus
              placeholder="Digite para buscar…"
              value={query}
              onValueChange={setQuery}
              className="w-full p-3 text-base bg-[hsl(222,37%,10%)] text-white outline-none"
            />
          </div>

          <Command.List className="max-h-[60vh] overflow-auto">
            {loading && (
              <div className="p-3 text-sm text-[hsl(215,12%,65%)]">Buscando…</div>
            )}

            {!loading && (
              <>
                <Command.Group
                  heading="Ações rápidas"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[hsl(215,12%,65%)]"
                >

                  <Command.Item
                    onSelect={() => { 
                      navigate("/leads"); 
                      setOpen(false); 
                      }}
                    >
                      Ir para Leads
                  </Command.Item>

                  <Command.Item 
                    onSelect={() => { 
                      navigate("/settings"); 
                      setOpen(false); }}
                      >
                        Ir para Settings
                  </Command.Item>

                  <Command.Item
                    onSelect={() => {
                      navigate("/dashboard");
                      setOpen(false);
                    }}
                  >
                    Ir para Dashboard
                  </Command.Item>
                  <Command.Item
                    onSelect={() => {
                      navigate("/pipeline");
                      setOpen(false);
                    }}
                  >
                    Ir para Pipeline
                  </Command.Item>
                  {/* Comente/ajuste esta rota se ainda não existir */}
                  <Command.Item
                    onSelect={() => {
                      // Se não houver /leads/new, troque por /pipeline
                      navigate("/leads/new");
                      setOpen(false);
                    }}
                  >
                    Novo Lead
                  </Command.Item>
                </Command.Group>

                <Command.Group
                  heading="Leads"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[hsl(215,12%,65%)]"
                >
                  {results.leads.map((l) => (
                    <Command.Item
                      key={l.id}
                      onSelect={() => {
                        navigate(`/leads/${l.id}`);
                        setOpen(false);
                      }}
                    >
                      <span className="font-medium">{l.name}</span>
                      <span className="ml-auto text-xs text-[hsl(215,12%,65%)] capitalize">
                        {l.stage}
                      </span>
                    </Command.Item>
                  ))}
                  {results.leads.length === 0 && (
                    <div className="p-3 text-sm text-[hsl(215,12%,65%)]">
                      Nenhum lead encontrado
                    </div>
                  )}
                </Command.Group>

                <Command.Group
                  heading="Tarefas"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-[hsl(215,12%,65%)]"
                >
                  {results.tasks.map((t) => (
                    <Command.Item
                      key={t.id}
                      onSelect={() => {
                        // abrir lead da tarefa
                        navigate(`/leads/${t.lead_id}`);
                        setOpen(false);
                      }}
                    >
                      <span>{t.title}</span>
                      {t.tag && (
                        <span className="ml-auto text-xs text-[hsl(215,12%,65%)]">
                          {t.tag}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                  {results.tasks.length === 0 && (
                    <div className="p-3 text-sm text-[hsl(215,12%,65%)]">
                      Nenhuma tarefa encontrada
                    </div>
                  )}
                </Command.Group>
              </>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

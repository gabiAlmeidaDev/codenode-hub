import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { LayoutGrid, KanbanSquare, Users, Settings, Wallet } from 'lucide-react';

export default function AppLayout() {
  const navigate = useNavigate();

  // Atalho de teste (sem palette por enquanto)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        // Apenas um aviso discreto enquanto a palette está desligada
        console.info("⌘/Ctrl+K capturado (Command Palette desativada)");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(222,37%,10%)] text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex md:w-60 flex-col border-r border-[hsl(220,12%,18%)] h-screen sticky top-0">
          <div className="h-14 flex items-center px-4 border-b border-[hsl(220,12%,18%)]">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-lg font-semibold tracking-tight"
              title="Ir para Dashboard"
            >
              CodeNode Hub
            </button>
          </div>

          <nav className="flex-1 p-2">
            <NavItem to="/dashboard" icon={LayoutGrid} label="Dashboard" />
            <NavItem to="/pipeline" icon={KanbanSquare} label="Pipeline" />
            <NavItem to="/leads" icon={Users} label="Leads" />
            <NavItem to="/finance" icon={Wallet} label="Financeiro" />
            <NavItem to="/settings" icon={Settings} label="Settings" />
          </nav>

          <div className="p-3 text-[hsl(215,12%,65%)] text-xs border-t border-[hsl(220,12%,18%)]">
            Layout estável — extras off
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <header className="h-14 sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-[hsl(222,37%,10%)/0.7] bg-[hsl(222,37%,10%)]/80 border-b border-[hsl(220,12%,18%)]">
            <div className="h-full px-4 flex items-center justify-between gap-3">
              <div className="md:hidden font-semibold">CodeNode Hub</div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => console.info("Command Palette desativada neste modo")}
                  className="px-3 py-1.5 rounded-xl border border-[hsl(220,12%,18%)] hover:bg-[hsl(222,37%,14%)] transition"
                  title="Abrir busca (Ctrl/Cmd+K)"
                >
                  Buscar…
                  <kbd className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[hsl(222,37%,16%)] border border-[hsl(220,12%,18%)]">
                    ⌘K
                  </kbd>
                </button>
              </div>
            </div>
          </header>

          {/* Conteúdo das rotas */}
          <main className="p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
          "border border-transparent",
          isActive
            ? "bg-[hsl(222,37%,14%)] border-[hsl(220,12%,18%)]"
            : "hover:bg-[hsl(222,37%,14%)]",
        ].join(" ")
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

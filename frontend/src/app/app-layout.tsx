import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CommandPalette } from "@/components/common/command-palette";
import GlobalHotkeys from "@/app/global-hotkeys";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [openCmd, setOpenCmd] = useState(false);
  const navigate = useNavigate();

  // Atalhos globais: Cmd/Ctrl+K e "/" abrem a palette
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && key === "k") {
        e.preventDefault();
        setOpenCmd((o) => !o);
      }
      if (key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpenCmd(true);
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
            <NavItem to="/dashboard" label="Dashboard" />
            <NavItem to="/pipeline" label="Pipeline" />
            <NavItem to="/leads" label="Leads" />
            <NavItem to="/settings" label="Settings" />
          </nav>

          <div className="p-3 text-[hsl(215,12%,65%)] text-xs border-t border-[hsl(220,12%,18%)]">
            ⌘/Ctrl + K abre a busca
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <header className="h-14 sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-[hsl(222,37%,10%)/0.7] bg-[hsl(222,37%,10%)]/80 border-b border-[hsl(220,12%,18%)]">
            <div className="h-full px-4 flex items-center justify-between gap-3">
              {/* Mobile logo */}
              <div className="md:hidden font-semibold">CodeNode Hub</div>

              {/* Quick actions (direita) */}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setOpenCmd(true)}
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

          {/* Conteúdo */}
          <main className="p-4">{children}</main>
        </div>
      </div>

      {/* Command Palette global */}
      <CommandPalette open={openCmd} setOpen={setOpenCmd} />

      <GlobalHotkeys openCmd={() => setOpenCmd(true)} />
    </div>
  );
}

/* ===== Item do Sidebar ===== */
function NavItem({ to, label, optional = false }: { to: string; label: string; optional?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "block rounded-xl px-3 py-2 text-sm transition",
          "border border-transparent",
          isActive
            ? "bg-[hsl(222,37%,14%)] border-[hsl(220,12%,18%)]"
            : "hover:bg-[hsl(222,37%,14%)]",
          optional ? "opacity-70 hover:opacity-100" : "",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

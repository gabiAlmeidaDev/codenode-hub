import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastType = "success" | "error" | "info";
type Toast = { id: string; title: string; description?: string; type?: ToastType; duration?: number };

const ToastCtx = createContext<{
  show: (t: Omit<Toast, "id">) => void;
}>({ show: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, any>>({});

  const show = useCallback((t: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    const toast: Toast = { id, type: "info", duration: 2800, ...t };
    setToasts((list) => [toast, ...list]);
    timers.current[id] = setTimeout(() => dismiss(id), toast.duration);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    if (timers.current[id]) clearTimeout(timers.current[id]);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed right-4 bottom-4 flex flex-col gap-2 z-[9999]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-[hsl(220,12%,18%)] bg-[hsl(222,37%,12%)]/95 shadow-glow p-3 min-w-[280px]"
          >
            <div className="text-sm font-semibold">
              {t.type === "success" ? "✅ " : t.type === "error" ? "⚠️ " : "ℹ️ "}{t.title}
            </div>
            {t.description && <div className="text-[hsl(215,12%,65%)] text-xs mt-1">{t.description}</div>}
            <button className="text-[hsl(215,12%,65%)] text-xs mt-2 underline" onClick={() => dismiss(t.id)}>
              fechar
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

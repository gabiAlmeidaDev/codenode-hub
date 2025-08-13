import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function GlobalHotkeys({ openCmd }: { openCmd: () => void }) {
  const navigate = useNavigate();
  const buffer = useRef<string[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const typing = tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable;
      const key = e.key.toLowerCase();

      // atalhos globais que não devem disparar quando digitando
      if (!typing) {
        // Cmd/Ctrl + K já existe no layout, deixamos lá
        if (key === "/") { e.preventDefault(); openCmd(); return; }
        if (key === "n") { e.preventDefault(); navigate("/leads/new"); return; }
      }

      // Sequência (g + {d,p,l,s})
      if (!typing) {
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => { buffer.current = []; }, 900);

        if (key.length === 1 && /^[a-z]$/.test(key)) {
          buffer.current.push(key);
          // só guardamos os 2 últimos
          if (buffer.current.length > 2) buffer.current.shift();

          if (buffer.current.length === 2 && buffer.current[0] === "g") {
            if (buffer.current[1] === "d") { e.preventDefault(); navigate("/dashboard"); buffer.current = []; return; }
            if (buffer.current[1] === "p") { e.preventDefault(); navigate("/pipeline");  buffer.current = []; return; }
            if (buffer.current[1] === "l") { e.preventDefault(); navigate("/leads");     buffer.current = []; return; }
            if (buffer.current[1] === "s") { e.preventDefault(); navigate("/settings");  buffer.current = []; return; }
          }
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, openCmd]);

  return null;
}

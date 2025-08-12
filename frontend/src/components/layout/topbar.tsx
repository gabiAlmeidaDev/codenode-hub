
import { useState } from 'react'

export default function Topbar() {
  const [query, setQuery] = useState('')
  return (
    <div className="h-[64px] border-b border-[hsl(220,12%,18%)] flex items-center justify-between px-6 bg-[hsl(222,37%,10%)]">
      <input
        className="w-96 bg-transparent border border-[hsl(220,12%,18%)] rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(280,80%,60%)]"
        placeholder="Busca global (placeholder)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="text-[hsl(215,12%,65%)] text-sm">v0 • seed</div>
    </div>
  )
}

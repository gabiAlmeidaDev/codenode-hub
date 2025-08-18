
import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, KanbanSquare, Users, Settings } from 'lucide-react'

const NavItem = ({ to, icon: Icon, label }: any) => {
  const { pathname } = useLocation()
  const active = pathname === to
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-2xl mx-3 my-1 transition-colors ${active ? 'bg-[hsl(222,37%,12%)] text-white' : 'text-[hsl(215,12%,65%)] hover:bg-[hsl(222,37%,12%)]'}`}>
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}

export default function Sidebar() {
  return (
    <div className="h-full border-r border-[hsl(220,12%,18%)] bg-[hsl(222,37%,10%)]">
      <div className="px-4 py-5">
        <div className="text-lg font-semibold tracking-tight">CodeNode Hub</div>
        <div className="text-xs text-[hsl(215,12%,65%)]">Dark • Elegant</div>
      </div>
      <nav className="mt-2">
        <NavItem to="/" icon={LayoutGrid} label="Dashboard" />
        <NavItem to="/pipeline" icon={KanbanSquare} label="Pipeline" />
        <NavItem to="/leads" icon={Users} label="Leads" />
        <NavItem to="/settings" icon={Settings} label="Settings" />
        <NavItem to="/finance"  label="Financeiro" />
      </nav>
    </div>
  )
}

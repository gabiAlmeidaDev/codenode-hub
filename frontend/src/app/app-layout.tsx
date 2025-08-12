
import { ReactNode } from 'react'
import Sidebar from '@/components/layout/sidebar'
import Topbar from '@/components/layout/topbar'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[260px_1fr] grid-rows-[64px_1fr] min-h-screen">
      <aside className="row-span-2">
        <Sidebar />
      </aside>
      <header className="">
        <Topbar />
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}

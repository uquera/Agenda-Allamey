"use client"

import { useState } from "react"
import PacienteSidebar from "./PacienteSidebar"
import PacienteHeader from "./PacienteHeader"

interface PacienteShellProps {
  user: { name?: string | null; email: string }
  children: React.ReactNode
}

export default function PacienteShell({ user, children }: PacienteShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <PacienteSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <PacienteHeader user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

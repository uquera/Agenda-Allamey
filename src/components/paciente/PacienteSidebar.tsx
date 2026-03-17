"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Clock, FileText, BookOpen, LogOut, Home, ShieldCheck } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/paciente", label: "Inicio", icon: Home, exact: true },
  { href: "/paciente/agendar", label: "Solicitar cita", icon: CalendarDays },
  { href: "/paciente/citas", label: "Mis citas", icon: Clock },
  { href: "/paciente/sesiones", label: "Mis sesiones", icon: FileText },
  { href: "/paciente/materiales", label: "Mis materiales", icon: BookOpen },
  { href: "/paciente/consentimiento", label: "Consentimiento", icon: ShieldCheck },
]

export default function PacienteSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen shadow-sm shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: "#8B1A2C" }}
          >
            AS
          </div>
          <div>
            <p className="font-bold text-sm text-gray-800 leading-tight">Allamey Sanz</p>
            <p className="text-xs text-gray-400">Portal de paciente</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              style={isActive ? { backgroundColor: "#8B1A2C" } : undefined}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Cerrar sesión */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all w-full"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

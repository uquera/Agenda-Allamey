"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Bell,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  BookOpen,
  CreditCard,
  Settings,
  BarChart2,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { BRAND } from "@/lib/brand"
import { signOut } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/pacientes", label: "Pacientes", icon: Users },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/sesiones", label: "Sesiones", icon: FileText },
  { href: "/admin/materiales", label: "Materiales", icon: BookOpen },
  { href: "/admin/pagos", label: "Pagos", icon: CreditCard },
  { href: "/admin/morbilidad", label: "Morbilidad", icon: BarChart2 },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
]

interface AdminHeaderProps {
  user: { name?: string | null; email: string }
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : BRAND.initials

  return (
    <>
      <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Hamburger — solo móvil/tablet */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-50 text-gray-500 active:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </button>
          <div>
            <p className="text-xs text-gray-400 capitalize">{today}</p>
            <h1 className="text-base font-semibold text-gray-800 capitalize">
              Buenos días, {BRAND.doctorTitle}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Botón cerrar sesión — visible en móvil/tablet */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-sm font-bold transition-colors shadow-sm"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} />
            <span>Salir</span>
          </button>
          {/* Bell — solo escritorio */}
          <button className="hidden md:flex relative p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
            <Bell size={18} />
          </button>
          <Avatar className="w-8 h-8">
            <AvatarFallback
              className="text-white text-xs font-semibold"
              style={{ backgroundColor: "var(--brand)" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Drawer móvil */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />

          {/* Panel lateral */}
          <div className="absolute left-0 top-0 h-full w-72 bg-white flex flex-col shadow-2xl">

            {/* Usuario + cerrar */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Avatar className="w-11 h-11">
                  <AvatarFallback
                    className="text-white text-sm font-bold"
                    style={{ backgroundColor: "var(--brand)" }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {user.name ?? BRAND.doctorTitle}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 shrink-0"
                aria-label="Cerrar menú"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cerrar sesión — destacado arriba del drawer */}
            <div className="px-4 pt-4 pb-2">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors shadow-sm"
              >
                <LogOut size={18} />
                Cerrar sesión / Cambiar usuario
              </button>
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
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    style={isActive ? { backgroundColor: "var(--brand)" } : undefined}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

          </div>
        </div>
      )}
    </>
  )
}

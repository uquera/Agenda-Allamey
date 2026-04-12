"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { CalendarDays, Clock, FileText, BookOpen, LogOut, Home, ShieldCheck, ClipboardList, Lock, FolderOpen } from "lucide-react"
import { BRAND } from "@/lib/brand"
import { MODULES, type ModuleKey } from "@/lib/modules"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const navItems: {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
  module?: ModuleKey
}[] = [
  { href: "/paciente",                label: "Inicio",           icon: Home,          exact: true },
  { href: "/paciente/agendar",        label: "Solicitar cita",   icon: CalendarDays,  module: "agendar" },
  { href: "/paciente/citas",          label: "Mis citas",        icon: Clock,         module: "agendar" },
  { href: "/paciente/sesiones",       label: "Mis sesiones",     icon: FileText,      module: "sesiones" },
  { href: "/paciente/materiales",     label: "Mis materiales",   icon: BookOpen,      module: "materiales" },
  { href: "/paciente/documentos",     label: "Mis documentos",   icon: FolderOpen,    module: "documentos" },
  { href: "/paciente/anamnesis",      label: "Historia clínica", icon: ClipboardList, module: "anamnesis" },
  { href: "/paciente/consentimiento", label: "Consentimiento",   icon: ShieldCheck,   module: "consentimiento" },
]

export default function PacienteSidebar({ consentimientoFirmado = true }: { consentimientoFirmado?: boolean }) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(
    (item) => !item.module || MODULES[item.module]
  )

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-col h-screen shadow-sm shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <Image
              src="/logo-vertical.png"
              alt={BRAND.name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-bold text-sm text-gray-800 leading-tight">{BRAND.name}</p>
            <p className="text-xs text-gray-400">Portal de paciente</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const isConsentimiento = item.href === "/paciente/consentimiento"
          const bloqueado = !consentimientoFirmado && !isConsentimiento

          if (bloqueado) {
            return (
              <Link
                key={item.href}
                href="/paciente/consentimiento"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 opacity-50 hover:opacity-70 transition-opacity"
                title="Firma el consentimiento informado para acceder"
              >
                <span className="flex items-center gap-3">
                  <item.icon size={18} />
                  {item.label}
                </span>
                <Lock size={13} className="shrink-0" />
              </Link>
            )
          }

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
              style={isActive ? { backgroundColor: "var(--brand)" } : undefined}
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

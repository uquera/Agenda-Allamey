"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CalendarDays, Clock, BookOpen, ClipboardList } from "lucide-react"
import { MODULES } from "@/lib/modules"
import { cn } from "@/lib/utils"

export default function MobileNav() {
  const pathname = usePathname()

  const items = [
    { href: "/paciente",            label: "Inicio",     icon: Home,          exact: true },
    MODULES.agendar    ? { href: "/paciente/agendar",    label: "Cita",       icon: CalendarDays } : null,
    MODULES.agendar    ? { href: "/paciente/citas",      label: "Mis citas",  icon: Clock } : null,
    MODULES.materiales ? { href: "/paciente/materiales", label: "Materiales", icon: BookOpen } : null,
    MODULES.anamnesis  ? { href: "/paciente/anamnesis",  label: "Historia",   icon: ClipboardList } : null,
  ].filter(Boolean) as { href: string; label: string; icon: React.ElementType; exact?: boolean }[]

  // Limit to 5 items for bottom nav
  const visible = items.slice(0, 5)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 safe-area-pb">
      {visible.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-center min-w-0",
              isActive ? "text-white" : "text-gray-400"
            )}
            style={isActive ? { backgroundColor: "var(--brand)" } : undefined}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium leading-tight truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

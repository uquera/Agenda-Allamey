"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, Menu } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface AdminHeaderProps {
  user: { name?: string | null; email: string }
  onMenuClick: () => void
}

export default function AdminHeader({ user, onMenuClick }: AdminHeaderProps) {
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AS"

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburguesa visible solo en móvil */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-xs text-gray-400 capitalize">{today}</p>
          <h1 className="text-base font-semibold text-gray-800 capitalize">
            Buenos días, Dra. Allamey
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
          <Bell size={18} />
        </button>
        <Avatar className="w-8 h-8">
          <AvatarFallback
            className="text-white text-xs font-semibold"
            style={{ backgroundColor: "#8B1A2C" }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

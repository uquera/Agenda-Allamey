"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { BRAND } from "@/lib/brand"

interface AdminHeaderProps {
  user: { name?: string | null; email: string }
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : BRAND.initials

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
      <div>
        <p className="text-xs text-gray-400 capitalize">{today}</p>
        <h1 className="text-base font-semibold text-gray-800 capitalize">
          Buenos días, {BRAND.doctorTitle}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors">
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
  )
}

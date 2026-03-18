"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PacienteHeaderProps {
  user: { name?: string | null; email: string }
}

export default function PacienteHeader({ user }: PacienteHeaderProps) {
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "P"
  const firstName = user.name?.split(" ")[0] || "Paciente"

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
      <div>
        <p className="text-xs text-gray-400 capitalize">{today}</p>
        <h1 className="text-base font-semibold text-gray-800">
          Hola, {firstName}
        </h1>
      </div>
      <Avatar className="w-8 h-8">
        <AvatarFallback
          className="text-white text-xs font-semibold"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    </header>
  )
}

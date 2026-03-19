"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface PacienteHeaderProps {
  user: { name?: string | null; email: string }
}

export default function PacienteHeader({ user }: PacienteHeaderProps) {
  const [today, setToday] = useState("")
  useEffect(() => {
    setToday(format(new Date(), "EEEE d 'de' MMMM", { locale: es }))
  }, [])

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0] ?? "").join("").toUpperCase().slice(0, 2) || "P"
    : "P"
  const firstName = user.name?.split(" ")[0] || "Paciente"

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
      <div>
        <p
          suppressHydrationWarning
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontWeight: 400,
            fontSize: "0.72rem",
            color: "#9ca3af",
            textTransform: "capitalize",
            letterSpacing: "0.01em",
          }}
        >
          {today}
        </p>
        <h1
          style={{
            fontFamily: "var(--font-sans), sans-serif",
            fontWeight: 700,
            fontSize: "1.05rem",
            color: "#1f2937",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          Hola,{" "}
          <span style={{ color: "var(--brand)" }}>{firstName}</span>
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

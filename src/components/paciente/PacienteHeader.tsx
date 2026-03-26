"use client"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { signOut } from "next-auth/react"

interface PacienteHeaderProps {
  user: { name?: string | null; email: string }
}

export default function PacienteHeader({ user }: PacienteHeaderProps) {
  const [today, setToday] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setToday(format(new Date(), "EEEE d 'de' MMMM", { locale: es }))
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside as EventListener)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside as EventListener)
    }
  }, [menuOpen])

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

      {/* Avatar con dropdown */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ focusRingColor: "var(--brand)" } as React.CSSProperties}
          aria-label="Menú de usuario"
          aria-expanded={menuOpen}
        >
          <Avatar className="w-8 h-8">
            <AvatarFallback
              className="text-white text-xs font-semibold"
              style={{ backgroundColor: "var(--brand)" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>

        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
            {/* Info del usuario */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user.name ?? "Paciente"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>

            {/* Cerrar sesión */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

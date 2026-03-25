"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

interface Props {
  periodo: string
  year: number
  month: number   // 1–12
  week: number
  years: number[]
}

export default function MorbilidadFilters({ periodo, year, month, week, years }: Props) {
  const router = useRouter()
  const [p, setP] = useState(periodo)
  const [y, setY] = useState(year)
  const [m, setM] = useState(month)
  const [w, setW] = useState(week)

  function navegar(np = p, ny = y, nm = m, nw = w) {
    const params = new URLSearchParams({ periodo: np, year: String(ny) })
    if (np === "month") params.set("month", String(nm))
    if (np === "week")  params.set("week",  String(nw))
    router.push(`/admin/morbilidad?${params.toString()}`)
  }

  function handlePeriodo(nuevo: string) {
    setP(nuevo)
    navegar(nuevo, y, m, w)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Tabs de período */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
        {(["year", "month", "week"] as const).map((opt, i) => {
          const label = opt === "year" ? "Año" : opt === "month" ? "Mes" : "Semana"
          return (
            <button
              key={opt}
              onClick={() => handlePeriodo(opt)}
              className={[
                "px-4 py-2 transition-colors",
                i > 0 ? "border-l border-gray-200" : "",
                p === opt ? "text-white" : "text-gray-500 hover:bg-gray-50",
              ].join(" ")}
              style={p === opt ? { backgroundColor: "var(--brand)" } : undefined}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Selector de año */}
      <select
        value={y}
        onChange={(e) => { const ny = Number(e.target.value); setY(ny); navegar(p, ny, m, w) }}
        className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2"
        style={{ ["--tw-ring-color" as string]: "var(--brand)" }}
      >
        {years.map((yr) => (
          <option key={yr} value={yr}>{yr}</option>
        ))}
      </select>

      {/* Selector de mes (solo si período = mes) */}
      {p === "month" && (
        <select
          value={m}
          onChange={(e) => { const nm = Number(e.target.value); setM(nm); navegar(p, y, nm, w) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none"
        >
          {MESES.map((label, idx) => (
            <option key={idx + 1} value={idx + 1}>{label}</option>
          ))}
        </select>
      )}

      {/* Selector de semana (solo si período = semana) */}
      {p === "week" && (
        <select
          value={w}
          onChange={(e) => { const nw = Number(e.target.value); setW(nw); navegar(p, y, m, nw) }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none"
        >
          {Array.from({ length: 53 }, (_, i) => i + 1).map((wn) => (
            <option key={wn} value={wn}>Semana {wn}</option>
          ))}
        </select>
      )}
    </div>
  )
}

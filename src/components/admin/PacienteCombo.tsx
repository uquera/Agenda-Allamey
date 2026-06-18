"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Check, ChevronDown } from "lucide-react"

interface Paciente {
  id: string
  nombre: string
}

export default function PacienteCombo({
  pacientes,
  value,
  onChange,
  placeholder = "— Seleccionar paciente —",
}: {
  pacientes: Paciente[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  const selected = pacientes.find((p) => p.id === value)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  const filtro = query.trim().toLowerCase()
  const lista = filtro
    ? pacientes.filter((p) => p.nombre.toLowerCase().includes(filtro))
    : pacientes

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
      >
        <span className={selected ? "text-gray-700" : "text-gray-400"}>
          {selected ? selected.nombre : placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search size={15} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full text-sm outline-none bg-transparent"
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {lista.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400 text-center">Sin resultados</p>
            ) : (
              lista.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onChange(p.id)
                    setOpen(false)
                    setQuery("")
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    p.id === value ? "text-[var(--brand)] font-medium" : "text-gray-700"
                  }`}
                >
                  <span className="truncate">{p.nombre}</span>
                  {p.id === value && <Check size={15} className="shrink-0" style={{ color: "var(--brand)" }} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { CheckCircle, Star } from "lucide-react"
import { BRAND } from "@/lib/brand"

const LABELS: Record<number, string> = {
  1: "Deficiente", 2: "Regular", 3: "Bueno", 4: "Muy bueno", 5: "Excelente",
}

const LABEL_COLOR: Record<number, string> = {
  1: "text-red-500", 2: "text-orange-500", 3: "text-amber-500",
  4: "text-teal-600", 5: "text-green-600",
}

export default function ResenaPublicaForm({
  token, profesionalNombre,
}: {
  token: string
  citaId: string
  profesionalNombre: string
}) {
  const [calificacion, setCalificacion] = useState(0)
  const [hover, setHover] = useState(0)
  const [comentario, setComentario] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviada, setEnviada] = useState(false)
  const [error, setError] = useState("")

  async function enviar() {
    if (!calificacion) { setError("Selecciona una calificación"); return }
    setLoading(true)
    setError("")
    const res = await fetch(`/api/resena-publica/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calificacion, comentario }),
    })
    if (res.ok) {
      setEnviada(true)
    } else {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? "Error al enviar. Intenta de nuevo.")
    }
    setLoading(false)
  }

  if (enviada) {
    return (
      <div className="text-center py-6 space-y-3">
        <CheckCircle size={52} className="mx-auto text-green-500" />
        <p className="text-lg font-bold text-gray-800">¡Muchas gracias!</p>
        <p className="text-sm text-gray-500">
          Tu calificación de <strong>{calificacion}★ {LABELS[calificacion]}</strong> fue registrada.
          Tu opinión ayuda a {profesionalNombre} a seguir creciendo.
        </p>
      </div>
    )
  }

  const active = hover || calificacion

  return (
    <div className="space-y-6">
      {/* Estrellas grandes */}
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCalificacion(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={44}
              className={`transition-colors ${
                n <= active
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-200 fill-gray-100"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Label de la calificación */}
      <div className="text-center h-6">
        {active > 0 && (
          <p className={`text-base font-semibold ${LABEL_COLOR[active]}`}>
            {LABELS[active]}
          </p>
        )}
      </div>

      {/* Comentario */}
      <div>
        <label className="text-sm text-gray-600 font-medium mb-2 block">
          Cuéntanos más <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="¿Qué fue lo que más te gustó? ¿Algo que podamos mejorar?"
          maxLength={400}
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:border-transparent transition"
          style={{ outlineColor: BRAND.color }}
        />
        <p className="text-right text-xs text-gray-300 mt-1">{comentario.length}/400</p>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <button
        onClick={enviar}
        disabled={loading || !calificacion}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: BRAND.color }}
      >
        {loading ? "Enviando..." : "Enviar calificación"}
      </button>
    </div>
  )
}

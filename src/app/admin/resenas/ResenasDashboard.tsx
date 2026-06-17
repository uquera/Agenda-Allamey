"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Star, Eye, EyeOff, MessageSquare, Reply } from "lucide-react"
import StarRating, { StarDisplay } from "@/components/ui/StarRating"
import { BRAND } from "@/lib/brand"

interface Resena {
  id: string
  calificacion: number
  comentario: string | null
  respuesta: string | null
  respondidoEn: string | null
  visible: boolean
  createdAt: string
  fechaCita: string
  pacienteNombre: string
}

export default function ResenasDashboard({
  resenas: inicial,
  promedio,
  total,
}: {
  resenas: Resena[]
  promedio: number
  total: number
}) {
  const [resenas, setResenas] = useState(inicial)
  const [editando, setEditando] = useState<string | null>(null)
  const [borrador, setBorrador] = useState("")
  const [guardando, setGuardando] = useState(false)

  async function patch(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/resenas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return res.ok ? res.json() : null
  }

  async function toggleVisible(r: Resena) {
    const updated = await patch(r.id, { visible: !r.visible })
    if (updated) {
      setResenas((prev) => prev.map((x) => (x.id === r.id ? { ...x, visible: updated.visible } : x)))
    }
  }

  async function guardarRespuesta(id: string) {
    setGuardando(true)
    const updated = await patch(id, { respuesta: borrador })
    setGuardando(false)
    if (updated) {
      setResenas((prev) =>
        prev.map((x) =>
          x.id === id
            ? { ...x, respuesta: updated.respuesta, respondidoEn: updated.respondidoEn }
            : x
        )
      )
      setEditando(null)
      setBorrador("")
    }
  }

  // Distribución de estrellas
  const dist = [5, 4, 3, 2, 1].map((n) => ({
    estrellas: n,
    count: resenas.filter((r) => r.calificacion === n).length,
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star size={24} style={{ color: BRAND.color }} /> Reseñas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Calificaciones que dejan tus pacientes tras cada sesión.
        </p>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row gap-6 items-center">
        <div className="text-center shrink-0">
          <div className="text-5xl font-bold text-gray-900">{promedio.toFixed(1)}</div>
          <div className="mt-1 flex justify-center">
            <StarRating value={Math.round(promedio)} size="md" />
          </div>
          <div className="text-xs text-gray-400 mt-1">{total} {total === 1 ? "reseña" : "reseñas"}</div>
        </div>
        <div className="flex-1 w-full space-y-1.5">
          {dist.map((d) => {
            const pct = total > 0 ? (d.count / total) * 100 : 0
            return (
              <div key={d.estrellas} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-gray-500">{d.estrellas}</span>
                <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-gray-400">{d.count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista */}
      {resenas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aún no hay reseñas. Aparecerán aquí cuando marques una cita como completada y el paciente califique.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resenas.map((r) => (
            <div
              key={r.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 ${r.visible ? "border-gray-100" : "border-gray-200 bg-gray-50/60"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <StarRating value={r.calificacion} size="sm" />
                    <span className="text-sm font-semibold text-gray-700">{r.pacienteNombre}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Sesión del {format(new Date(r.fechaCita), "d MMM yyyy", { locale: es })}
                    {" · "}
                    calificó {format(new Date(r.createdAt), "d MMM", { locale: es })}
                  </p>
                </div>
                <button
                  onClick={() => toggleVisible(r)}
                  title={r.visible ? "Visible como testimonio público" : "Oculta"}
                  className={`shrink-0 inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition ${
                    r.visible
                      ? "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
                      : "border-gray-200 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {r.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                  {r.visible ? "Pública" : "Oculta"}
                </button>
              </div>

              {r.comentario && (
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">“{r.comentario}”</p>
              )}

              {/* Respuesta */}
              {editando === r.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={borrador}
                    onChange={(e) => setBorrador(e.target.value)}
                    rows={2}
                    placeholder="Escribe una respuesta pública..."
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => guardarRespuesta(r.id)}
                      disabled={guardando}
                      className="text-xs px-3 py-1.5 rounded-lg text-white font-medium disabled:opacity-50"
                      style={{ backgroundColor: BRAND.color }}
                    >
                      {guardando ? "Guardando..." : "Guardar respuesta"}
                    </button>
                    <button
                      onClick={() => { setEditando(null); setBorrador("") }}
                      className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : r.respuesta ? (
                <div className="mt-3 ml-4 pl-3 border-l-2" style={{ borderColor: BRAND.color }}>
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">Tu respuesta:</p>
                  <p className="text-sm text-gray-600">{r.respuesta}</p>
                  <button
                    onClick={() => { setEditando(r.id); setBorrador(r.respuesta ?? "") }}
                    className="text-xs text-gray-400 hover:text-gray-600 mt-1"
                  >
                    Editar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditando(r.id); setBorrador("") }}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
                >
                  <Reply size={13} /> Responder
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, Clock, Monitor, MapPin, X } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const estadoColor: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  APROBADA: "bg-green-100 text-green-700",
  RECHAZADA: "bg-red-100 text-red-700",
  REAGENDADA: "bg-blue-100 text-blue-700",
  COMPLETADA: "bg-gray-100 text-gray-600",
  CANCELADA: "bg-gray-100 text-gray-400",
}

const estadoLabel: Record<string, string> = {
  PENDIENTE: "Pendiente de aprobación",
  APROBADA: "Confirmada",
  RECHAZADA: "Rechazada",
  REAGENDADA: "Reagendada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
}

export type CitaData = {
  id: string
  fecha: string
  modalidad: string
  estado: string
  motivoConsulta: string | null
  linkSesion: string | null
  notasAdmin: string | null
  puedeCancel: boolean
  bloqueadaPorTiempo: boolean
}

export default function CitaCard({ cita }: { cita: CitaData }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function cancelar() {
    setCargando(true)
    const res = await fetch(`/api/citas/${cita.id}`, { method: "DELETE" })
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || "Error al cancelar la cita")
      setCargando(false)
      setConfirmando(false)
    }
  }

  const cancelable = ["PENDIENTE", "APROBADA"].includes(cita.estado)

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--brand-light)" }}
      >
        <CalendarDays size={18} style={{ color: "var(--brand)" }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-gray-800 capitalize">
              {format(new Date(cita.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={12} />
                {format(new Date(cita.fecha), "HH:mm")}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                {cita.modalidad === "ONLINE" ? <Monitor size={12} /> : <MapPin size={12} />}
                {cita.modalidad === "ONLINE" ? "Online" : "Presencial"}
              </span>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoColor[cita.estado]} shrink-0`}>
            {estadoLabel[cita.estado]}
          </span>
        </div>

        {cita.motivoConsulta && (
          <p className="text-xs text-gray-400 mt-2 line-clamp-2">{cita.motivoConsulta}</p>
        )}

        {cita.estado === "APROBADA" && cita.linkSesion && (
          <a
            href={cita.linkSesion}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium mt-2 hover:underline"
            style={{ color: "var(--brand)" }}
          >
            <Monitor size={11} />
            Unirse a la videollamada
          </a>
        )}

        {cita.notasAdmin && (
          <p className="text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 mt-2 text-gray-500">
            {cita.notasAdmin}
          </p>
        )}

        {/* Cancelación */}
        {cancelable && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {cita.bloqueadaPorTiempo ? (
              <p className="text-xs text-gray-400 italic flex items-center gap-1">
                <X size={11} className="shrink-0" />
                No se puede cancelar con menos de 24h de antelación
              </p>
            ) : confirmando ? (
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-600">¿Confirmar cancelación?</p>
                <button
                  onClick={cancelar}
                  disabled={cargando}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                >
                  {cargando ? "Cancelando..." : "Sí, cancelar"}
                </button>
                <button
                  onClick={() => setConfirmando(false)}
                  disabled={cargando}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Volver
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmando(true)}
                className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
              >
                <X size={11} />
                Cancelar cita
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

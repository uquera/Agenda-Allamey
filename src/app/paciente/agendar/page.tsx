"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { BRAND } from "@/lib/brand"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  CalendarDays, Monitor, MapPin, CheckCircle, Loader2,
  ChevronLeft, ChevronRight, Clock, Ban, Circle,
} from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, getDaysInMonth, getDay, isBefore, startOfDay, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

type EstadoDia = "disponible" | "bloqueado" | "sin_horario" | "completo"
type Paso = 1 | 2 | 3

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export default function AgendarPage() {
  const router = useRouter()
  const [paso, setPaso] = useState<Paso>(1)
  const [mesActual, setMesActual] = useState(new Date())
  const [estadosMes, setEstadosMes] = useState<Record<string, EstadoDia>>({})
  const [loadingMes, setLoadingMes] = useState(false)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null)
  const [slots, setSlots] = useState<{ hora: string; estado: "disponible" | "bloqueado" | "ocupado"; motivo?: string }[]>([])
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [modalidad, setModalidad] = useState<"PRESENCIAL" | "ONLINE">("PRESENCIAL")
  const [motivo, setMotivo] = useState("")
  const [notas, setNotas] = useState("")
  const [loading, setLoading] = useState(false)

  const cargarMes = useCallback(async (mes: Date) => {
    setLoadingMes(true)
    try {
      const y = mes.getFullYear()
      const m = mes.getMonth() + 1
      const res = await fetch(`/api/disponibilidad/mes?year=${y}&month=${m}`)
      const data = await res.json()
      setEstadosMes(data)
    } catch {
      setEstadosMes({})
    } finally {
      setLoadingMes(false)
    }
  }, [])

  useEffect(() => {
    cargarMes(mesActual)
  }, [mesActual, cargarMes])

  async function seleccionarFecha(fecha: Date) {
    const hoy = startOfDay(new Date())
    if (isBefore(fecha, hoy)) return
    const fechaStr = format(fecha, "yyyy-MM-dd")
    const estado = estadosMes[fechaStr]
    if (estado === "sin_horario" || estado === "bloqueado" || estado === "completo") return

    setFechaSeleccionada(fecha)
    setHoraSeleccionada(null)
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/disponibilidad?fecha=${fechaStr}`)
      const data = await res.json()
      setSlots(data.todosLosSlots || data.slots?.map((h: string) => ({ hora: h, estado: "disponible" as const })) || [])
    } catch {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  async function confirmarCita() {
    if (!fechaSeleccionada || !horaSeleccionada) return
    setLoading(true)
    const [hh, mm] = horaSeleccionada.split(":").map(Number)
    const fechaCompleta = new Date(fechaSeleccionada)
    fechaCompleta.setHours(hh, mm, 0, 0)
    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha: fechaCompleta.toISOString(),
          modalidad,
          motivoConsulta: motivo,
          notasPaciente: notas,
        }),
      })
      if (!res.ok) throw new Error()
      setPaso(3)
    } catch {
      toast.error("Error al enviar la solicitud. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Construcción del calendario
  const primerDia = startOfMonth(mesActual)
  const diasEnMes = getDaysInMonth(mesActual)
  const offsetInicio = getDay(primerDia) // día de semana del día 1
  const hoy = startOfDay(new Date())

  function getEstiloDia(fecha: Date): {
    bg: string; text: string; ring: string; cursor: string; icono?: React.ReactNode
  } {
    const fechaStr = format(fecha, "yyyy-MM-dd")
    const pasado = isBefore(fecha, hoy)
    const esHoy = isToday(fecha)
    const estado = estadosMes[fechaStr]
    const seleccionado = fechaSeleccionada?.toDateString() === fecha.toDateString()

    if (seleccionado) return { bg: "bg-[var(--brand)]", text: "text-white", ring: "", cursor: "cursor-pointer" }
    if (pasado) return { bg: "bg-transparent", text: "text-gray-200", ring: "", cursor: "cursor-not-allowed" }

    switch (estado) {
      case "disponible":
        return {
          bg: esHoy ? "bg-green-100" : "bg-green-50 hover:bg-green-100",
          text: "text-green-800",
          ring: esHoy ? "ring-2 ring-green-400" : "",
          cursor: "cursor-pointer",
          icono: <div className="w-1.5 h-1.5 rounded-full bg-green-500 mx-auto mt-0.5" />,
        }
      case "bloqueado":
        return {
          bg: "bg-red-50",
          text: "text-red-300",
          ring: "",
          cursor: "cursor-not-allowed",
          icono: <Ban size={10} className="text-red-300 mx-auto mt-0.5" />,
        }
      case "completo":
        return {
          bg: "bg-gray-50",
          text: "text-gray-400",
          ring: "",
          cursor: "cursor-not-allowed",
          icono: <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mx-auto mt-0.5" />,
        }
      case "sin_horario":
        return { bg: "bg-transparent", text: "text-gray-300", ring: "", cursor: "cursor-not-allowed" }
      default:
        return {
          bg: esHoy ? "bg-gray-100" : "bg-transparent hover:bg-gray-50",
          text: "text-gray-500",
          ring: esHoy ? "ring-1 ring-gray-300" : "",
          cursor: "cursor-pointer",
        }
    }
  }

  if (paso === 3) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "var(--brand-light)" }}>
          <CheckCircle size={40} style={{ color: "var(--brand)" }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Solicitud enviada!</h1>
        <p className="text-gray-500 mb-2">
          Tu solicitud para el{" "}
          <strong>
            {fechaSeleccionada && format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
            {" a las "}{horaSeleccionada}
          </strong>{" "}ha sido recibida.
        </p>
        <p className="text-gray-400 text-sm mb-8">Recibirás un correo cuando {BRAND.doctorTitle} confirme tu cita.</p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => { setPaso(1); setFechaSeleccionada(null); setHoraSeleccionada(null); setMotivo(""); setNotas("") }}>
            Solicitar otra cita
          </Button>
          <Button className="text-white" style={{ backgroundColor: "var(--brand)" }} onClick={() => router.push("/paciente/citas")}>
            Ver mis citas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Solicitar cita</h1>
        <p className="text-sm text-gray-500 mt-1">Selecciona un día disponible, el horario y la modalidad</p>
      </div>

      {/* Indicador pasos */}
      <div className="flex items-center gap-2">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${paso >= n ? "text-white" : "bg-gray-100 text-gray-400"}`}
              style={paso >= n ? { backgroundColor: "var(--brand)" } : {}}
            >{n}</div>
            <span className={`text-sm ${paso >= n ? "text-gray-800 font-medium" : "text-gray-400"}`}>
              {n === 1 ? "Fecha y hora" : "Detalles"}
            </span>
            {n < 2 && <div className="w-8 h-px bg-gray-200 mx-1" />}
          </div>
        ))}
      </div>

      {paso === 1 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-5">

            {/* Cabecera del mes */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800 capitalize">
                {format(mesActual, "MMMM yyyy", { locale: es })}
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setMesActual(subMonths(mesActual, 1))}
                  disabled={mesActual.getFullYear() === hoy.getFullYear() && mesActual.getMonth() <= hoy.getMonth()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => setMesActual(addMonths(mesActual, 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Días de semana */}
            <div className="grid grid-cols-7 gap-1">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}

              {/* Celdas vacías antes del día 1 */}
              {Array.from({ length: offsetInicio }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Días del mes */}
              {Array.from({ length: diasEnMes }).map((_, i) => {
                const dia = i + 1
                const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia)
                const estilo = getEstiloDia(fecha)
                const seleccionado = fechaSeleccionada?.toDateString() === fecha.toDateString()

                return (
                  <button
                    key={dia}
                    onClick={() => seleccionarFecha(fecha)}
                    disabled={estilo.cursor === "cursor-not-allowed"}
                    className={`flex flex-col items-center justify-center rounded-xl py-1.5 text-xs transition-all ${estilo.bg} ${estilo.text} ${estilo.ring} ${estilo.cursor} ${seleccionado ? "shadow-md" : ""}`}
                  >
                    <span className={`font-semibold text-sm leading-none ${seleccionado ? "text-white" : ""}`}>{dia}</span>
                    {estilo.icono}
                  </button>
                )
              })}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-4 pt-1 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                Disponible
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                Completo
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Ban size={11} className="text-red-300" />
                Bloqueado
              </div>
            </div>

            {loadingMes && (
              <div className="flex justify-center py-2">
                <Loader2 size={16} className="animate-spin text-gray-300" />
              </div>
            )}

            {/* Slots de hora */}
            {fechaSeleccionada && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock size={14} style={{ color: "var(--brand)" }} />
                  Horarios disponibles —{" "}
                  <span className="capitalize text-gray-500 font-normal">
                    {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
                  </span>
                </h3>
                {loadingSlots ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={20} className="animate-spin text-gray-300" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-3">No hay horarios disponibles para este día</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => {
                      const bloqueado = slot.estado === "bloqueado" || slot.estado === "ocupado"
                      const seleccionado = horaSeleccionada === slot.hora
                      return (
                        <button
                          key={slot.hora}
                          onClick={() => !bloqueado && setHoraSeleccionada(slot.hora)}
                          disabled={bloqueado}
                          title={bloqueado && slot.motivo ? slot.motivo : undefined}
                          className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                            bloqueado
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : seleccionado
                              ? "text-white shadow-sm"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                          }`}
                          style={!bloqueado && seleccionado ? { backgroundColor: "var(--brand)" } : {}}
                        >
                          {slot.hora}
                          {bloqueado && (
                            <span className="block text-xs text-gray-400 font-normal leading-tight mt-0.5">
                              Horario ocupado
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full h-10 text-white"
              style={{ backgroundColor: "var(--brand)" }}
              disabled={!fechaSeleccionada || !horaSeleccionada}
              onClick={() => setPaso(2)}
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {paso === 2 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-5">
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-800 capitalize">
                {fechaSeleccionada && format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })} a las {horaSeleccionada}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Modalidad</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["PRESENCIAL", "ONLINE"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setModalidad(m)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      modalidad === m ? "border-transparent text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                    style={modalidad === m ? { backgroundColor: "var(--brand)", borderColor: "var(--brand)" } : {}}
                  >
                    {m === "ONLINE" ? <Monitor size={16} /> : <MapPin size={16} />}
                    {m === "ONLINE" ? "Online" : "Presencial"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-sm font-medium text-gray-700">
                Motivo de consulta <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <Textarea id="motivo" placeholder="¿Cuál es el motivo principal de tu consulta?" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} className="resize-none text-sm" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas" className="text-sm font-medium text-gray-700">
                Notas adicionales <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <Textarea id="notas" placeholder="Cualquier información relevante para la doctora..." value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} className="resize-none text-sm" />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-10" onClick={() => setPaso(1)}>Volver</Button>
              <Button className="flex-1 h-10 text-white" style={{ backgroundColor: "var(--brand)" }} onClick={confirmarCita} disabled={loading}>
                {loading ? <><Loader2 size={14} className="animate-spin mr-2" />Enviando...</> : "Enviar solicitud"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

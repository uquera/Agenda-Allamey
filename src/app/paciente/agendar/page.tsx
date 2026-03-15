"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Monitor, MapPin, CheckCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, startOfDay, isBefore, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const SLOTS_DEFAULT = [
  "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00", "18:00",
]

type Paso = 1 | 2 | 3

export default function AgendarPage() {
  const router = useRouter()
  const [paso, setPaso] = useState<Paso>(1)
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null)
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null)
  const [modalidad, setModalidad] = useState<"PRESENCIAL" | "ONLINE">("PRESENCIAL")
  const [motivo, setMotivo] = useState("")
  const [notas, setNotas] = useState("")
  const [loading, setLoading] = useState(false)
  const [slots, setSlots] = useState<string[]>(SLOTS_DEFAULT)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Generar días de la semana actual + offset
  const hoy = startOfDay(new Date())
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(hoy, semanaOffset * 7 + i))

  async function seleccionarFecha(dia: Date) {
    if (isBefore(dia, hoy)) return
    setFechaSeleccionada(dia)
    setHoraSeleccionada(null)
    setLoadingSlots(true)
    try {
      const fechaStr = format(dia, "yyyy-MM-dd")
      const res = await fetch(`/api/disponibilidad?fecha=${fechaStr}`)
      const data = await res.json()
      setSlots(data.slots?.length > 0 ? data.slots : SLOTS_DEFAULT)
    } catch {
      setSlots(SLOTS_DEFAULT)
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

  if (paso === 3) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#fff0f2" }}
        >
          <CheckCircle size={40} style={{ color: "#8B1A2C" }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Solicitud enviada!</h1>
        <p className="text-gray-500 mb-2">
          Tu solicitud de cita para el{" "}
          <strong>
            {fechaSeleccionada &&
              format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
            {" a las "}
            {horaSeleccionada}
          </strong>{" "}
          ha sido recibida.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Recibirás un correo cuando la Dra. Allamey confirme tu cita.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => {
              setPaso(1)
              setFechaSeleccionada(null)
              setHoraSeleccionada(null)
              setMotivo("")
              setNotas("")
            }}
          >
            Solicitar otra cita
          </Button>
          <Button
            className="text-white"
            style={{ backgroundColor: "#8B1A2C" }}
            onClick={() => router.push("/paciente/citas")}
          >
            Ver mis citas
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Solicitar cita</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selecciona fecha, hora y modalidad
        </p>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center gap-2">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                paso >= n ? "text-white" : "bg-gray-100 text-gray-400"
              }`}
              style={paso >= n ? { backgroundColor: "#8B1A2C" } : {}}
            >
              {n}
            </div>
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
            {/* Selector de semana */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800">Selecciona un día</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSemanaOffset(Math.max(0, semanaOffset - 1))}
                    disabled={semanaOffset === 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => setSemanaOffset(semanaOffset + 1)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {diasSemana.map((dia) => {
                  const pasado = isBefore(dia, hoy)
                  const seleccionado = fechaSeleccionada?.toDateString() === dia.toDateString()
                  return (
                    <button
                      key={dia.toISOString()}
                      onClick={() => seleccionarFecha(dia)}
                      disabled={pasado}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs transition-all ${
                        pasado
                          ? "opacity-30 cursor-not-allowed"
                          : seleccionado
                          ? "text-white shadow-sm"
                          : "hover:bg-gray-50 text-gray-700"
                      } ${isToday(dia) && !seleccionado ? "ring-1 ring-inset" : ""}`}
                      style={
                        seleccionado
                          ? { backgroundColor: "#8B1A2C" }
                          : undefined
                      }
                    >
                      <span className="text-gray-400 text-xs mb-0.5">{DIAS[dia.getDay()]}</span>
                      <span className="font-semibold text-sm">{format(dia, "d")}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Slots de hora */}
            {fechaSeleccionada && (
              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-3">
                  Horarios disponibles —{" "}
                  <span className="capitalize text-gray-500 font-normal">
                    {format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}
                  </span>
                </h2>

                {loadingSlots ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={20} className="animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setHoraSeleccionada(slot)}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          horaSeleccionada === slot
                            ? "text-white shadow-sm"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                        style={horaSeleccionada === slot ? { backgroundColor: "#8B1A2C" } : {}}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full h-10 text-white"
              style={{ backgroundColor: "#8B1A2C" }}
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
                {fechaSeleccionada &&
                  format(fechaSeleccionada, "EEEE d 'de' MMMM", { locale: es })}{" "}
                a las {horaSeleccionada}
              </p>
            </div>

            {/* Modalidad */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Modalidad</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["PRESENCIAL", "ONLINE"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setModalidad(m)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      modalidad === m
                        ? "border-transparent text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                    style={modalidad === m ? { backgroundColor: "#8B1A2C", borderColor: "#8B1A2C" } : {}}
                  >
                    {m === "ONLINE" ? <Monitor size={16} /> : <MapPin size={16} />}
                    {m === "ONLINE" ? "Online" : "Presencial"}
                  </button>
                ))}
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-sm font-medium text-gray-700">
                Motivo de consulta <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="motivo"
                placeholder="¿Cuál es el motivo principal de tu consulta?"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Notas adicionales */}
            <div className="space-y-2">
              <Label htmlFor="notas" className="text-sm font-medium text-gray-700">
                Notas adicionales <span className="text-gray-400 font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="notas"
                placeholder="Cualquier información relevante para la doctora..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => setPaso(1)}
              >
                Volver
              </Button>
              <Button
                className="flex-1 h-10 text-white"
                style={{ backgroundColor: "#8B1A2C" }}
                onClick={confirmarCita}
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 size={14} className="animate-spin mr-2" /> Enviando...</>
                ) : (
                  "Enviar solicitud"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

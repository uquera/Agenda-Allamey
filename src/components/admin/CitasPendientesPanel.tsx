"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, XCircle, Calendar, Clock, Monitor, MapPin, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CitaPendiente {
  id: string
  fecha: string
  modalidad: string
  motivoConsulta?: string | null
  notasPaciente?: string | null
  paciente: { nombre: string; email: string }
}

interface Props {
  pendientes: CitaPendiente[]
}

export default function CitasPendientesPanel({ pendientes }: Props) {
  const router = useRouter()
  const [selected, setSelected] = useState<CitaPendiente | null>(null)
  const [accion, setAccion] = useState<"aprobar" | "rechazar" | "reagendar" | null>(null)
  const [loading, setLoading] = useState(false)
  const [nota, setNota] = useState("")
  const [linkSesion, setLinkSesion] = useState("")
  const [nuevaFecha, setNuevaFecha] = useState("")
  const [nuevaHora, setNuevaHora] = useState("")

  function abrirAccion(cita: CitaPendiente, tipo: typeof accion) {
    setSelected(cita)
    setAccion(tipo)
    setNota("")
    setLinkSesion("")
    setNuevaFecha("")
    setNuevaHora("")
  }

  function cerrar() {
    setSelected(null)
    setAccion(null)
  }

  async function ejecutarAccion() {
    if (!selected || !accion) return
    setLoading(true)

    const estadoMap = {
      aprobar: "APROBADA",
      rechazar: "RECHAZADA",
      reagendar: "REAGENDADA",
    }

    const body: Record<string, unknown> = {
      estado: estadoMap[accion],
      notasAdmin: nota,
    }

    if (accion === "aprobar" && selected.modalidad === "ONLINE" && linkSesion) {
      body.linkSesion = linkSesion
    }

    if (accion === "reagendar" && nuevaFecha && nuevaHora) {
      body.nuevaFecha = `${nuevaFecha}T${nuevaHora}:00`
    }

    try {
      const res = await fetch(`/api/citas/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error()

      const mensajes = {
        aprobar: "Cita aprobada y paciente notificado",
        rechazar: "Cita rechazada y paciente notificado",
        reagendar: "Cita reagendada y paciente notificado",
      }
      toast.success(mensajes[accion])
      cerrar()
      router.refresh()
    } catch {
      toast.error("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="border-0 shadow-sm border-l-4" style={{ borderLeftColor: "#f59e0b" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            Solicitudes pendientes de aprobación
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 ml-1">
              {pendientes.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendientes.map((cita) => (
              <div
                key={cita.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/60 rounded-xl border border-amber-100"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: "#8B1A2C" }}
                  >
                    {cita.paciente.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{cita.paciente.nombre}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {format(new Date(cita.fecha), "EEEE d MMM · HH:mm", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        {cita.modalidad === "ONLINE" ? (
                          <Monitor size={12} />
                        ) : (
                          <MapPin size={12} />
                        )}
                        {cita.modalidad === "ONLINE" ? "Online" : "Presencial"}
                      </span>
                    </div>
                    {cita.motivoConsulta && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {cita.motivoConsulta}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs"
                    onClick={() => abrirAccion(cita, "rechazar")}
                  >
                    <XCircle size={14} className="mr-1" />
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs"
                    onClick={() => abrirAccion(cita, "reagendar")}
                  >
                    <Calendar size={14} className="mr-1" />
                    Reagendar
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                    onClick={() => abrirAccion(cita, "aprobar")}
                  >
                    <CheckCircle size={14} className="mr-1" />
                    Aprobar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de acción */}
      <Dialog open={!!accion} onOpenChange={() => cerrar()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {accion === "aprobar" && "Aprobar cita"}
              {accion === "rechazar" && "Rechazar solicitud"}
              {accion === "reagendar" && "Reagendar cita"}
            </DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-800">{selected.paciente.nombre}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {format(new Date(selected.fecha), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
                </p>
              </div>

              {accion === "reagendar" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">Nueva fecha</Label>
                    <Input
                      type="date"
                      value={nuevaFecha}
                      onChange={(e) => setNuevaFecha(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-600">Nueva hora</Label>
                    <Input
                      type="time"
                      value={nuevaHora}
                      onChange={(e) => setNuevaHora(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              )}

              {accion === "aprobar" && selected.modalidad === "ONLINE" && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Link de videollamada (opcional)</Label>
                  <Input
                    placeholder="https://meet.google.com/..."
                    value={linkSesion}
                    onChange={(e) => setLinkSesion(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">
                  Nota para el paciente{" "}
                  {accion !== "rechazar" && <span className="text-gray-400">(opcional)</span>}
                </Label>
                <Textarea
                  placeholder={
                    accion === "rechazar"
                      ? "Indica el motivo del rechazo..."
                      : "Instrucciones o notas adicionales..."
                  }
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={cerrar}
                  className="flex-1 h-9 text-sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={ejecutarAccion}
                  disabled={loading || (accion === "reagendar" && (!nuevaFecha || !nuevaHora))}
                  className="flex-1 h-9 text-sm text-white"
                  style={{
                    backgroundColor:
                      accion === "rechazar"
                        ? "#dc2626"
                        : accion === "reagendar"
                        ? "#2563eb"
                        : "#16a34a",
                  }}
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin mr-1" />
                  ) : null}
                  {accion === "aprobar" && "Confirmar aprobación"}
                  {accion === "rechazar" && "Confirmar rechazo"}
                  {accion === "reagendar" && "Confirmar reagendado"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

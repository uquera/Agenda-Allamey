"use client"

import { useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import esLocale from "@fullcalendar/core/locales/es"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Lock } from "lucide-react"

interface Evento {
  id: string
  title: string
  start: string
  end: string
  className?: string
  extendedProps: {
    estado: string
    modalidad: string
    email: string
    pacienteId: string
    motivoConsulta?: string | null
    notasAdmin?: string | null
    linkSesion?: string | null
  }
}

interface Props {
  eventos: Evento[]
}

const estadoLabel: Record<string, string> = {
  PENDIENTE:  "Pendiente",
  APROBADA:   "Confirmada",
  RECHAZADA:  "Rechazada",
  REAGENDADA: "Reagendada",
  COMPLETADA: "Realizada",
  CANCELADA:  "Cancelada",
}

const estadoBg: Record<string, string> = {
  PENDIENTE:  "#f59e0b",
  APROBADA:   "#16a34a",
  RECHAZADA:  "#ef4444",
  REAGENDADA: "#3b82f6",
  COMPLETADA: "#6b7280",
  CANCELADA:  "#ef4444",
}

export default function AgendaCalendar({ eventos }: Props) {
  const calendarRef = useRef(null)
  const [bloqueoOpen, setBloqueoOpen] = useState(false)
  const [bloqueo, setBloqueo] = useState({ fecha: "", horaInicio: "", horaFin: "", motivo: "", todoElDia: false })
  const [guardandoBloqueo, setGuardandoBloqueo] = useState(false)

  const eventosColoreados = eventos.map((ev) => ({
    ...ev,
    backgroundColor: estadoBg[ev.extendedProps.estado] || "#8B1A2C",
    borderColor: estadoBg[ev.extendedProps.estado] || "#8B1A2C",
    textColor: "#ffffff",
  }))

  function handleEventClick(info: { event: { id: string; title: string; start: Date | null; extendedProps: Record<string, unknown> } }) {
    const ev = info.event
    const estado = ev.extendedProps.estado as string
    const modalidad = ev.extendedProps.modalidad as string
    const fechaStr = ev.start ? format(ev.start, "EEEE d 'de' MMMM · HH:mm", { locale: es }) : ""
    toast.info(`${ev.title} — ${estadoLabel[estado] || estado}`, {
      description: `${fechaStr} · ${modalidad === "ONLINE" ? "Online" : "Presencial"}`,
      duration: 4000,
    })
  }

  function handleDateSelect(info: { startStr: string; endStr: string; allDay: boolean }) {
    const fecha = info.startStr.split("T")[0]
    const horaInicio = info.startStr.includes("T") ? info.startStr.split("T")[1].slice(0, 5) : ""
    const horaFin = info.endStr.includes("T") ? info.endStr.split("T")[1].slice(0, 5) : ""
    setBloqueo({ fecha, horaInicio, horaFin, motivo: "", todoElDia: info.allDay })
    setBloqueoOpen(true)
  }

  async function guardarBloqueo() {
    if (!bloqueo.fecha) return
    setGuardandoBloqueo(true)
    try {
      const res = await fetch("/api/bloqueos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bloqueo),
      })
      if (!res.ok) throw new Error()
      toast.success("Horario bloqueado correctamente")
      setBloqueoOpen(false)
    } catch {
      toast.error("Error al bloquear el horario")
    } finally {
      setGuardandoBloqueo(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        {[
          { color: "#f59e0b", label: "Pendiente" },
          { color: "#16a34a", label: "Confirmada" },
          { color: "#6b7280", label: "Realizada" },
          { color: "#ef4444", label: "Cancelada" },
          { color: "#3b82f6", label: "Reagendada" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto text-gray-400">
          <Lock size={11} />
          <span>Clic en espacio vacío para bloquear horario</span>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={esLocale}
            events={eventosColoreados}
            eventClick={handleEventClick}
            selectable={true}
            select={handleDateSelect}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            height="auto"
            slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            dayHeaderFormat={{ weekday: "short", day: "numeric" }}
            nowIndicator
            weekends={true}
            editable={false}
          />
        </CardContent>
      </Card>

      <Dialog open={bloqueoOpen} onOpenChange={setBloqueoOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={16} className="text-gray-500" /> Bloquear horario
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={bloqueo.fecha} onChange={e => setBloqueo(b => ({ ...b, fecha: e.target.value }))} className="mt-1" />
            </div>
            {!bloqueo.todoElDia && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Hora inicio</Label>
                  <Input type="time" value={bloqueo.horaInicio} onChange={e => setBloqueo(b => ({ ...b, horaInicio: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Hora fin</Label>
                  <Input type="time" value={bloqueo.horaFin} onChange={e => setBloqueo(b => ({ ...b, horaFin: e.target.value }))} className="mt-1" />
                </div>
              </div>
            )}
            <div>
              <Label>Motivo <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input value={bloqueo.motivo} onChange={e => setBloqueo(b => ({ ...b, motivo: e.target.value }))} placeholder="Ej: Almuerzo, Personal..." className="mt-1" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setBloqueoOpen(false)}>Cancelar</Button>
              <Button className="flex-1 bg-[#8B1A2C] hover:bg-[#6d1522] text-white" onClick={guardarBloqueo} disabled={guardandoBloqueo}>
                {guardandoBloqueo ? "Guardando..." : "Bloquear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

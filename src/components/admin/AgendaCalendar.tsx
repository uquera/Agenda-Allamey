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
import { Lock, Trash2 } from "lucide-react"

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

interface Bloqueo {
  id: string
  fecha: string
  horaInicio: string | null
  horaFin: string | null
  todoElDia: boolean
  motivo: string | null
}

interface Props {
  eventos: Evento[]
  bloqueosIniciales: Bloqueo[]
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

function bloqueoToEvento(b: Bloqueo) {
  const fechaStr = b.fecha.split("T")[0]
  if (b.todoElDia) {
    return {
      id: `bloqueo-${b.id}`,
      title: b.motivo || "Bloqueado",
      start: fechaStr,
      allDay: true,
      display: "background" as const,
      backgroundColor: "#9ca3af",
      borderColor: "#9ca3af",
      extendedProps: { tipo: "bloqueo", bloqueoId: b.id, motivo: b.motivo },
    }
  }
  return {
    id: `bloqueo-${b.id}`,
    title: `🔒 ${b.motivo || "Bloqueado"}`,
    start: `${fechaStr}T${b.horaInicio || "00:00"}`,
    end: `${fechaStr}T${b.horaFin || "23:59"}`,
    backgroundColor: "#9ca3af",
    borderColor: "#9ca3af",
    textColor: "#ffffff",
    extendedProps: { tipo: "bloqueo", bloqueoId: b.id, motivo: b.motivo },
  }
}

export default function AgendaCalendar({ eventos, bloqueosIniciales }: Props) {
  const calendarRef = useRef(null)
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>(bloqueosIniciales)
  const [bloqueoOpen, setBloqueoOpen] = useState(false)
  const [bloqueo, setBloqueo] = useState({ fecha: "", horaInicio: "", horaFin: "", motivo: "", todoElDia: false })
  const [guardandoBloqueo, setGuardandoBloqueo] = useState(false)

  // Dialog para eliminar bloqueo
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [bloqueoAEliminar, setBloqueoAEliminar] = useState<{ id: string; motivo: string | null } | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const eventosColoreados = eventos.map((ev) => ({
    ...ev,
    backgroundColor: estadoBg[ev.extendedProps.estado] || "var(--brand)",
    borderColor: estadoBg[ev.extendedProps.estado] || "var(--brand)",
    textColor: "#ffffff",
  }))

  const eventosBloqueos = bloqueos.map(bloqueoToEvento)
  const todosLosEventos = [...eventosColoreados, ...eventosBloqueos]

  function handleEventClick(info: { event: { id: string; title: string; start: Date | null; extendedProps: Record<string, unknown> } }) {
    const ev = info.event
    if (ev.extendedProps.tipo === "bloqueo") {
      setBloqueoAEliminar({ id: ev.extendedProps.bloqueoId as string, motivo: ev.extendedProps.motivo as string | null })
      setDeleteOpen(true)
      return
    }
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
      const nuevo: Bloqueo = await res.json()
      setBloqueos((prev) => [...prev, nuevo])
      toast.success("Horario bloqueado correctamente")
      setBloqueoOpen(false)
    } catch {
      toast.error("Error al bloquear el horario")
    } finally {
      setGuardandoBloqueo(false)
    }
  }

  async function eliminarBloqueo() {
    if (!bloqueoAEliminar) return
    setEliminando(true)
    try {
      const res = await fetch(`/api/bloqueos/${bloqueoAEliminar.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setBloqueos((prev) => prev.filter((b) => b.id !== bloqueoAEliminar.id))
      toast.success("Bloqueo eliminado")
      setDeleteOpen(false)
    } catch {
      toast.error("Error al eliminar el bloqueo")
    } finally {
      setEliminando(false)
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
          { color: "#9ca3af", label: "Bloqueado" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto text-gray-400">
          <Lock size={11} />
          <span>Arrastra para bloquear · Clic en bloqueo gris para eliminar</span>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={esLocale}
            events={todosLosEventos}
            eventClick={handleEventClick}
            selectable={true}
            selectMirror={true}
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

      {/* Dialog: Crear bloqueo */}
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
              <Input value={bloqueo.motivo} onChange={e => setBloqueo(b => ({ ...b, motivo: e.target.value }))} placeholder="Ej: Almuerzo, Personal, Reunión..." className="mt-1" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setBloqueoOpen(false)}>Cancelar</Button>
              <Button className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white" onClick={guardarBloqueo} disabled={guardandoBloqueo}>
                {guardandoBloqueo ? "Guardando..." : "Bloquear"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Eliminar bloqueo */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 size={16} className="text-red-500" /> Eliminar bloqueo
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            ¿Deseas eliminar el bloqueo{bloqueoAEliminar?.motivo ? ` "${bloqueoAEliminar.motivo}"` : ""}? El horario quedará disponible nuevamente.
          </p>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={eliminarBloqueo} disabled={eliminando}>
              {eliminando ? "Eliminando..." : "Eliminar bloqueo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

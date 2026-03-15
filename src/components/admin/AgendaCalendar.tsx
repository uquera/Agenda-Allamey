"use client"

import { useRef } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import esLocale from "@fullcalendar/core/locales/es"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

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
  PENDIENTE: "Pendiente",
  APROBADA: "Confirmada",
  RECHAZADA: "Rechazada",
  REAGENDADA: "Reagendada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
}

const estadoBg: Record<string, string> = {
  PENDIENTE: "#f59e0b",
  APROBADA: "#8B1A2C",
  RECHAZADA: "#ef4444",
  REAGENDADA: "#3b82f6",
  COMPLETADA: "#6b7280",
  CANCELADA: "#9ca3af",
}

export default function AgendaCalendar({ eventos }: Props) {
  const calendarRef = useRef(null)

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
    const fechaStr = ev.start
      ? format(ev.start, "EEEE d 'de' MMMM · HH:mm", { locale: es })
      : ""

    toast.info(
      `${ev.title} — ${estadoLabel[estado] || estado}`,
      {
        description: `${fechaStr} · ${modalidad === "ONLINE" ? "Online" : "Presencial"}`,
        duration: 4000,
      }
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={esLocale}
          events={eventosColoreados}
          eventClick={handleEventClick}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          height="auto"
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          dayHeaderFormat={{ weekday: "short", day: "numeric" }}
          nowIndicator
          weekends={true}
          editable={false}
          selectable={false}
        />
      </CardContent>
    </Card>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { Lock, Trash2, CalendarPlus, Plus, X, Check, Calendar, Ban, Video, MapPin, Clock, User } from "lucide-react"

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

interface CitaInfo {
  id: string
  title: string
  start: Date
  end: Date | null
  estado: string
  modalidad: string
  email: string
  pacienteId: string
  motivoConsulta?: string | null
  notasAdmin?: string | null
  linkSesion?: string | null
}

interface Props {
  eventos: Evento[]
  bloqueosIniciales: Bloqueo[]
  onCitaActualizadaRef?: React.MutableRefObject<((id: string, nuevoEstado: string) => void) | null>
}

type AccionCita = "aprobar" | "rechazar" | "reagendar" | "cancelar" | "completar"

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

const accionesDisponibles: Record<string, AccionCita[]> = {
  PENDIENTE:  ["aprobar", "reagendar", "rechazar", "cancelar"],
  APROBADA:   ["reagendar", "completar", "cancelar"],
  REAGENDADA: ["aprobar", "completar", "cancelar"],
  COMPLETADA: [],
  RECHAZADA:  [],
  CANCELADA:  [],
}

function colorearEvento(ev: Evento) {
  const noEditable = ["COMPLETADA", "CANCELADA", "RECHAZADA"].includes(ev.extendedProps.estado)
  return {
    ...ev,
    backgroundColor: estadoBg[ev.extendedProps.estado] || "var(--brand)",
    borderColor: estadoBg[ev.extendedProps.estado] || "var(--brand)",
    textColor: "#ffffff",
    ...(noEditable ? { editable: false } : {}),
  }
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
      editable: false,
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
    editable: false,
    extendedProps: { tipo: "bloqueo", bloqueoId: b.id, motivo: b.motivo },
  }
}

const DURACIONES = [30, 45, 60, 90, 120]

export default function AgendaCalendar({ eventos, bloqueosIniciales, onCitaActualizadaRef }: Props) {
  const calendarRef = useRef(null)
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>(bloqueosIniciales)
  const [eventosColoreados, setEventosColoreados] = useState(() => eventos.map(colorearEvento))
  const [bloqueoOpen, setBloqueoOpen] = useState(false)
  const [bloqueo, setBloqueo] = useState({ fecha: "", horaInicio: "", horaFin: "", motivo: "", todoElDia: false })
  const [guardandoBloqueo, setGuardandoBloqueo] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [bloqueoAEliminar, setBloqueoAEliminar] = useState<{ id: string; motivo: string | null } | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const [choiceOpen, setChoiceOpen] = useState(false)
  const [seleccionRango, setSeleccionRango] = useState<{
    fecha: string; hora: string; horaFin: string; duracion: number; allDay: boolean
  } | null>(null)

  const [nuevaCitaOpen, setNuevaCitaOpen] = useState(false)
  const [pacientes, setPacientes] = useState<{ id: string; nombre: string }[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [guardandoCita, setGuardandoCita] = useState(false)
  const [nuevaCita, setNuevaCita] = useState({
    pacienteId: "",
    fecha: "",
    hora: "",
    duracion: 60,
    modalidad: "PRESENCIAL" as "PRESENCIAL" | "ONLINE",
    linkSesion: "",
    motivoConsulta: "",
    notasAdmin: "",
  })

  // Panel lateral de cita
  const [citaPanelOpen, setCitaPanelOpen] = useState(false)
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaInfo | null>(null)

  // Acción sobre cita
  const [accion, setAccion] = useState<AccionCita | null>(null)
  const [guardandoAccion, setGuardandoAccion] = useState(false)
  const [accionNota, setAccionNota] = useState("")
  const [accionLinkSesion, setAccionLinkSesion] = useState("")
  const [accionFecha, setAccionFecha] = useState("")
  const [accionHora, setAccionHora] = useState("")

  // Cerrar panel con Escape (solo si no hay sub-dialog abierto)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && citaPanelOpen && !accion) {
        setCitaPanelOpen(false)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [citaPanelOpen, accion])

  // Exponer callback para actualizar estado de evento desde CitasPendientesPanel
  if (onCitaActualizadaRef) {
    onCitaActualizadaRef.current = (id: string, nuevoEstado: string) => {
      setEventosColoreados((prev) =>
        prev.map((ev) =>
          ev.id === id
            ? {
                ...ev,
                backgroundColor: estadoBg[nuevoEstado] || "var(--brand)",
                borderColor: estadoBg[nuevoEstado] || "var(--brand)",
                extendedProps: { ...ev.extendedProps, estado: nuevoEstado },
                ...( ["COMPLETADA", "CANCELADA", "RECHAZADA"].includes(nuevoEstado) ? { editable: false } : {}),
              }
            : ev
        )
      )
    }
  }

  const eventosBloqueos = bloqueos.map(bloqueoToEvento)
  const todosLosEventos = [...eventosColoreados, ...eventosBloqueos]

  // ── Click en evento ────────────────────────────────────────────────────────

  function handleEventClick(info: {
    event: {
      id: string
      title: string
      start: Date | null
      end: Date | null
      extendedProps: Record<string, unknown>
    }
  }) {
    const ev = info.event
    if (ev.extendedProps.tipo === "bloqueo") {
      setBloqueoAEliminar({ id: ev.extendedProps.bloqueoId as string, motivo: ev.extendedProps.motivo as string | null })
      setDeleteOpen(true)
      return
    }
    setCitaSeleccionada({
      id: ev.id,
      title: ev.title,
      start: ev.start!,
      end: ev.end,
      estado: ev.extendedProps.estado as string,
      modalidad: ev.extendedProps.modalidad as string,
      email: ev.extendedProps.email as string,
      pacienteId: ev.extendedProps.pacienteId as string,
      motivoConsulta: ev.extendedProps.motivoConsulta as string | null,
      notasAdmin: ev.extendedProps.notasAdmin as string | null,
      linkSesion: ev.extendedProps.linkSesion as string | null,
    })
    setCitaPanelOpen(true)
  }

  // ── Drag & drop para reagendar ─────────────────────────────────────────────

  async function handleEventDrop(info: {
    event: {
      id: string
      start: Date | null
      end: Date | null
      extendedProps: Record<string, unknown>
    }
    revert: () => void
  }) {
    const ev = info.event
    if (!ev.start) { info.revert(); return }

    try {
      const res = await fetch(`/api/citas/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "REAGENDADA", nuevaFecha: ev.start.toISOString() }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "No se pudo reagendar")
        info.revert()
        return
      }
      setEventosColoreados((prev) =>
        prev.map((e) =>
          e.id === ev.id
            ? {
                ...e,
                start: ev.start!.toISOString(),
                end: ev.end ? ev.end.toISOString() : e.end,
                backgroundColor: estadoBg["REAGENDADA"],
                borderColor: estadoBg["REAGENDADA"],
                extendedProps: { ...e.extendedProps, estado: "REAGENDADA" },
              }
            : e
        )
      )
      if (onCitaActualizadaRef?.current) onCitaActualizadaRef.current(ev.id, "REAGENDADA")
      toast.success("Cita reagendada correctamente")
    } catch {
      toast.error("Error al reagendar")
      info.revert()
    }
  }

  // ── Acciones sobre cita seleccionada ──────────────────────────────────────

  function abrirAccion(a: AccionCita) {
    setAccionNota("")
    setAccionLinkSesion(citaSeleccionada?.linkSesion || "")
    if (citaSeleccionada?.start) {
      setAccionFecha(format(citaSeleccionada.start, "yyyy-MM-dd"))
      setAccionHora(format(citaSeleccionada.start, "HH:mm"))
    }
    setAccion(a)
  }

  async function ejecutarAccion() {
    if (!citaSeleccionada || !accion) return

    let body: Record<string, unknown> = {}
    switch (accion) {
      case "aprobar":
        body = {
          estado: "APROBADA",
          notasAdmin: accionNota || null,
          ...(citaSeleccionada.modalidad === "ONLINE" && accionLinkSesion
            ? { linkSesion: accionLinkSesion }
            : {}),
        }
        break
      case "rechazar":
        if (!accionNota.trim()) { toast.error("Escribe el motivo del rechazo"); return }
        body = { estado: "RECHAZADA", notasAdmin: accionNota }
        break
      case "reagendar":
        if (!accionFecha || !accionHora) { toast.error("Selecciona fecha y hora"); return }
        body = { estado: "REAGENDADA", nuevaFecha: `${accionFecha}T${accionHora}:00` }
        break
      case "cancelar":
        body = { estado: "CANCELADA" }
        break
      case "completar":
        body = { estado: "COMPLETADA" }
        break
    }

    setGuardandoAccion(true)
    try {
      const res = await fetch(`/api/citas/${citaSeleccionada.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "No se pudo actualizar")
        return
      }

      const nuevoEstado = body.estado as string
      setEventosColoreados((prev) =>
        prev.map((e) => {
          if (e.id !== citaSeleccionada.id) return e
          const updated: typeof e = {
            ...e,
            backgroundColor: estadoBg[nuevoEstado] || "var(--brand)",
            borderColor: estadoBg[nuevoEstado] || "var(--brand)",
            extendedProps: {
              ...e.extendedProps,
              estado: nuevoEstado,
              ...(accion === "aprobar" && accionLinkSesion ? { linkSesion: accionLinkSesion } : {}),
            },
            ...( ["COMPLETADA", "CANCELADA", "RECHAZADA"].includes(nuevoEstado) ? { editable: false } : {}),
          }
          if (accion === "reagendar") {
            const nuevoInicio = new Date(`${accionFecha}T${accionHora}:00`)
            const durMs = citaSeleccionada.end
              ? citaSeleccionada.end.getTime() - citaSeleccionada.start.getTime()
              : 60 * 60000
            updated.start = nuevoInicio.toISOString()
            updated.end = new Date(nuevoInicio.getTime() + durMs).toISOString()
          }
          return updated
        })
      )

      if (onCitaActualizadaRef?.current) onCitaActualizadaRef.current(citaSeleccionada.id, nuevoEstado)
      toast.success(`Cita ${estadoLabel[nuevoEstado]?.toLowerCase() || "actualizada"}`)
      setAccion(null)
      setCitaPanelOpen(false)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setGuardandoAccion(false)
    }
  }

  // ── Selección de rango en el calendario ───────────────────────────────────

  function handleDateSelect(info: { startStr: string; endStr: string; allDay: boolean }) {
    const fecha = info.startStr.split("T")[0]
    const hora = info.startStr.includes("T") ? info.startStr.split("T")[1].slice(0, 5) : ""
    const horaFin = info.endStr.includes("T") ? info.endStr.split("T")[1].slice(0, 5) : ""

    let durMin = 60
    if (hora && horaFin) {
      const [sh, sm] = hora.split(":").map(Number)
      const [eh, em] = horaFin.split(":").map(Number)
      const diff = (eh * 60 + em) - (sh * 60 + sm)
      if (diff > 0 && diff <= 240) durMin = diff
    }

    setSeleccionRango({ fecha, hora, horaFin, duracion: durMin, allDay: info.allDay })
    setChoiceOpen(true)
  }

  // ── Bloqueos ──────────────────────────────────────────────────────────────

  function abrirBloqueoDesdeSeleccion() {
    if (!seleccionRango) return
    setChoiceOpen(false)
    setBloqueo({
      fecha: seleccionRango.fecha,
      horaInicio: seleccionRango.hora,
      horaFin: seleccionRango.horaFin,
      motivo: "",
      todoElDia: seleccionRango.allDay,
    })
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

  // ── Nueva cita ────────────────────────────────────────────────────────────

  async function cargarPacientes() {
    if (pacientes.length > 0) return
    try {
      const res = await fetch("/api/pacientes-lista")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPacientes(data)
    } catch {
      toast.error("Error al cargar la lista de pacientes")
    }
  }

  function abrirNuevaCitaDesdeSeleccion() {
    setChoiceOpen(false)
    setNuevaCita({
      pacienteId: "",
      fecha: seleccionRango?.fecha ?? "",
      hora: seleccionRango?.hora ?? "",
      duracion: seleccionRango?.duracion ?? 60,
      modalidad: "PRESENCIAL",
      linkSesion: "",
      motivoConsulta: "",
      notasAdmin: "",
    })
    setBusqueda("")
    cargarPacientes()
    setNuevaCitaOpen(true)
  }

  function abrirNuevaCitaVacia() {
    setNuevaCita({
      pacienteId: "",
      fecha: "",
      hora: "",
      duracion: 60,
      modalidad: "PRESENCIAL",
      linkSesion: "",
      motivoConsulta: "",
      notasAdmin: "",
    })
    setBusqueda("")
    cargarPacientes()
    setNuevaCitaOpen(true)
  }

  async function guardarNuevaCita() {
    if (!nuevaCita.pacienteId) { toast.error("Selecciona un paciente"); return }
    if (!nuevaCita.fecha)      { toast.error("Ingresa la fecha"); return }
    if (!nuevaCita.hora)       { toast.error("Ingresa la hora"); return }

    setGuardandoCita(true)
    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteId: nuevaCita.pacienteId,
          fecha: `${nuevaCita.fecha}T${nuevaCita.hora}:00`,
          modalidad: nuevaCita.modalidad,
          duracion: nuevaCita.duracion,
          motivoConsulta: nuevaCita.motivoConsulta || null,
          notasAdmin: nuevaCita.notasAdmin || null,
          linkSesion: nuevaCita.modalidad === "ONLINE" && nuevaCita.linkSesion ? nuevaCita.linkSesion : null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Error al crear la cita")
        return
      }
      const cita = await res.json()

      const paciente = pacientes.find((p) => p.id === nuevaCita.pacienteId)
      const inicio = new Date(`${nuevaCita.fecha}T${nuevaCita.hora}:00`)
      const fin = new Date(inicio.getTime() + nuevaCita.duracion * 60000)

      setEventosColoreados((prev) => [
        ...prev,
        colorearEvento({
          id: cita.id,
          title: paciente?.nombre || "Paciente",
          start: inicio.toISOString(),
          end: fin.toISOString(),
          extendedProps: {
            estado: "APROBADA",
            modalidad: cita.modalidad,
            email: "",
            pacienteId: cita.pacienteId,
            motivoConsulta: cita.motivoConsulta,
            notasAdmin: cita.notasAdmin,
            linkSesion: cita.linkSesion,
          },
        }),
      ])

      toast.success(`Cita creada para ${paciente?.nombre || "el paciente"}`)
      setNuevaCitaOpen(false)
    } catch {
      toast.error("Error al crear la cita")
    } finally {
      setGuardandoCita(false)
    }
  }

  const pacientesFiltrados = pacientes.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <>
      {/* Leyenda + botón nueva cita */}
      <div className="flex flex-wrap items-center gap-3 mb-3 text-xs">
        {[
          { color: "#f59e0b", label: "Pendiente" },
          { color: "#16a34a", label: "Confirmada" },
          { color: "#6b7280", label: "Realizada" },
          { color: "#ef4444", label: "Cancelada" },
          { color: "#3b82f6", label: "Reagendada" },
          { color: "#9ca3af", label: "Bloqueado" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: color }} />
            <span
              style={{
                fontFamily: "var(--font-sans), sans-serif",
                fontWeight: 600,
                fontSize: "0.72rem",
                letterSpacing: "0.03em",
                color: "#4A4A4A",
              }}
            >
              {label}
            </span>
          </div>
        ))}

        <div className="flex items-center gap-1.5 text-gray-400">
          <Lock size={11} />
          <span>Arrastra para crear o mover · Click para ver opciones</span>
        </div>

        <Button
          size="sm"
          className="ml-auto h-7 text-xs text-white gap-1.5"
          style={{ backgroundColor: "var(--brand)" }}
          onClick={abrirNuevaCitaVacia}
        >
          <Plus size={13} />
          Nueva Cita
        </Button>
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
            editable={true}
            eventDrop={handleEventDrop}
            eventDurationEditable={false}
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
          />
        </CardContent>
      </Card>

      {/* ── Backdrop del panel ───────────────────────────────────────────── */}
      {citaPanelOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.18)" }}
          onClick={() => { setCitaPanelOpen(false); setAccion(null) }}
        />
      )}

      {/* ── Panel lateral de cita ────────────────────────────────────────── */}
      <div
        className="fixed top-0 right-0 h-full z-50 bg-white shadow-2xl flex flex-col"
        style={{
          width: "22rem",
          transform: citaPanelOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
        }}
      >
        {citaSeleccionada && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <User size={14} className="text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate leading-tight">
                    {citaSeleccionada.title}
                  </p>
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded-full text-white mt-0.5 inline-block"
                    style={{ backgroundColor: estadoBg[citaSeleccionada.estado] || "#888" }}
                  >
                    {estadoLabel[citaSeleccionada.estado] || citaSeleccionada.estado}
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setCitaPanelOpen(false); setAccion(null) }}
                className="text-gray-400 hover:text-gray-600 ml-2 shrink-0 p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
              {/* Fecha/hora */}
              <div className="flex items-start gap-2.5">
                <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Fecha y hora</p>
                  <p className="text-sm text-gray-800 font-medium capitalize">
                    {format(citaSeleccionada.start, "EEEE d 'de' MMMM · HH:mm", { locale: es })}
                  </p>
                </div>
              </div>

              {/* Duración */}
              {citaSeleccionada.end && (
                <div className="flex items-start gap-2.5">
                  <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Duración</p>
                    <p className="text-sm text-gray-800 font-medium">
                      {Math.round((citaSeleccionada.end.getTime() - citaSeleccionada.start.getTime()) / 60000)} min
                    </p>
                  </div>
                </div>
              )}

              {/* Modalidad */}
              <div className="flex items-start gap-2.5">
                {citaSeleccionada.modalidad === "ONLINE"
                  ? <Video size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  : <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                }
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Modalidad</p>
                  <p className="text-sm text-gray-800 font-medium">
                    {citaSeleccionada.modalidad === "ONLINE" ? "Online (videollamada)" : "Presencial"}
                  </p>
                </div>
              </div>

              {/* Link sesión */}
              {citaSeleccionada.linkSesion && (
                <div className="flex items-start gap-2.5">
                  <Video size={14} className="text-blue-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">Link de sesión</p>
                    <a
                      href={citaSeleccionada.linkSesion}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline break-all"
                    >
                      {citaSeleccionada.linkSesion}
                    </a>
                  </div>
                </div>
              )}

              {/* Motivo */}
              {citaSeleccionada.motivoConsulta && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Motivo de consulta</p>
                  <p className="text-sm text-gray-700">{citaSeleccionada.motivoConsulta}</p>
                </div>
              )}

              {/* Notas internas */}
              {citaSeleccionada.notasAdmin && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600 mb-1">Notas internas</p>
                  <p className="text-sm text-gray-700">{citaSeleccionada.notasAdmin}</p>
                </div>
              )}

              {/* Estados sin acciones */}
              {accionesDisponibles[citaSeleccionada.estado]?.length === 0 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  Esta cita no tiene acciones disponibles.
                </p>
              )}
            </div>

            {/* Acciones */}
            {(accionesDisponibles[citaSeleccionada.estado]?.length ?? 0) > 0 && (
              <div className="border-t px-5 py-4 shrink-0">
                <p className="text-xs text-gray-400 mb-2.5 font-medium uppercase tracking-wide">Acciones</p>
                <div className="grid grid-cols-2 gap-2">
                  {accionesDisponibles[citaSeleccionada.estado].includes("aprobar") && (
                    <Button
                      size="sm"
                      className="text-white text-xs h-8 gap-1.5"
                      style={{ backgroundColor: "#16a34a" }}
                      onClick={() => abrirAccion("aprobar")}
                    >
                      <Check size={12} /> Aprobar
                    </Button>
                  )}
                  {accionesDisponibles[citaSeleccionada.estado].includes("reagendar") && (
                    <Button
                      size="sm"
                      className="text-white text-xs h-8 gap-1.5"
                      style={{ backgroundColor: "#3b82f6" }}
                      onClick={() => abrirAccion("reagendar")}
                    >
                      <Calendar size={12} /> Reagendar
                    </Button>
                  )}
                  {accionesDisponibles[citaSeleccionada.estado].includes("completar") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1.5 text-gray-700"
                      onClick={() => abrirAccion("completar")}
                    >
                      <Check size={12} /> Realizada
                    </Button>
                  )}
                  {accionesDisponibles[citaSeleccionada.estado].includes("rechazar") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => abrirAccion("rechazar")}
                    >
                      <X size={12} /> Rechazar
                    </Button>
                  )}
                  {accionesDisponibles[citaSeleccionada.estado].includes("cancelar") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 gap-1.5 text-gray-600"
                      onClick={() => abrirAccion("cancelar")}
                    >
                      <Ban size={12} /> Cancelar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Sub-dialog: Aprobar ──────────────────────────────────────────── */}
      <Dialog open={accion === "aprobar"} onOpenChange={(o) => { if (!o) setAccion(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check size={15} style={{ color: "#16a34a" }} />
              Confirmar cita
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {citaSeleccionada?.modalidad === "ONLINE" && (
              <div>
                <Label className="text-xs">Link de videollamada <span className="text-gray-400">(opcional)</span></Label>
                <Input
                  value={accionLinkSesion}
                  onChange={(e) => setAccionLinkSesion(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="mt-1 h-8 text-sm"
                />
              </div>
            )}
            <div>
              <Label className="text-xs">Nota para la paciente <span className="text-gray-400">(opcional)</span></Label>
              <Textarea
                value={accionNota}
                onChange={(e) => setAccionNota(e.target.value)}
                placeholder="Indicaciones previas a la sesión..."
                className="mt-1 text-sm resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 text-sm" onClick={() => setAccion(null)}>
                Volver
              </Button>
              <Button
                className="flex-1 text-sm text-white"
                style={{ backgroundColor: "#16a34a" }}
                onClick={ejecutarAccion}
                disabled={guardandoAccion}
              >
                {guardandoAccion ? "Guardando..." : "Confirmar cita"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sub-dialog: Rechazar ─────────────────────────────────────────── */}
      <Dialog open={accion === "rechazar"} onOpenChange={(o) => { if (!o) setAccion(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X size={15} />
              Rechazar solicitud
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Motivo del rechazo <span className="text-red-500">*</span></Label>
              <Textarea
                value={accionNota}
                onChange={(e) => setAccionNota(e.target.value)}
                placeholder="Ej: No hay disponibilidad en ese horario..."
                className="mt-1 text-sm resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 text-sm" onClick={() => setAccion(null)}>
                Volver
              </Button>
              <Button
                className="flex-1 text-sm text-white bg-red-500 hover:bg-red-600"
                onClick={ejecutarAccion}
                disabled={guardandoAccion}
              >
                {guardandoAccion ? "Guardando..." : "Rechazar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sub-dialog: Reagendar ────────────────────────────────────────── */}
      <Dialog open={accion === "reagendar"} onOpenChange={(o) => { if (!o) setAccion(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar size={15} style={{ color: "#3b82f6" }} />
              Reagendar cita
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nueva fecha</Label>
                <Input
                  type="date"
                  value={accionFecha}
                  onChange={(e) => setAccionFecha(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Nueva hora</Label>
                <Input
                  type="time"
                  value={accionHora}
                  onChange={(e) => setAccionHora(e.target.value)}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 text-sm" onClick={() => setAccion(null)}>
                Volver
              </Button>
              <Button
                className="flex-1 text-sm text-white"
                style={{ backgroundColor: "#3b82f6" }}
                onClick={ejecutarAccion}
                disabled={guardandoAccion}
              >
                {guardandoAccion ? "Guardando..." : "Reagendar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sub-dialog: Cancelar ─────────────────────────────────────────── */}
      <Dialog open={accion === "cancelar"} onOpenChange={(o) => { if (!o) setAccion(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-700">
              <Ban size={15} />
              Cancelar cita
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            ¿Confirmas que deseas cancelar la cita de{" "}
            <strong>{citaSeleccionada?.title}</strong>?
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 text-sm" onClick={() => setAccion(null)}>
              Volver
            </Button>
            <Button
              className="flex-1 text-sm text-white bg-gray-700 hover:bg-gray-800"
              onClick={ejecutarAccion}
              disabled={guardandoAccion}
            >
              {guardandoAccion ? "Cancelando..." : "Cancelar cita"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sub-dialog: Completar ────────────────────────────────────────── */}
      <Dialog open={accion === "completar"} onOpenChange={(o) => { if (!o) setAccion(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-700">
              <Check size={15} />
              Marcar como realizada
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            ¿Confirmas que la sesión de{" "}
            <strong>{citaSeleccionada?.title}</strong> fue realizada?
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 text-sm" onClick={() => setAccion(null)}>
              Volver
            </Button>
            <Button
              className="flex-1 text-sm text-white bg-gray-600 hover:bg-gray-700"
              onClick={ejecutarAccion}
              disabled={guardandoAccion}
            >
              {guardandoAccion ? "Guardando..." : "Marcar como realizada"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Elección tras arrastrar área vacía ───────────────────── */}
      <Dialog open={choiceOpen} onOpenChange={setChoiceOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">
              {seleccionRango?.fecha
                ? format(new Date(seleccionRango.fecha + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })
                : "Selección"}
              {seleccionRango?.hora && (
                <span className="text-gray-400 font-normal text-sm ml-2">
                  {seleccionRango.hora}{seleccionRango.horaFin ? ` – ${seleccionRango.horaFin}` : ""}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-1">
            <Button
              className="w-full text-white gap-2"
              style={{ backgroundColor: "var(--brand)" }}
              onClick={abrirNuevaCitaDesdeSeleccion}
            >
              <CalendarPlus size={15} />
              Crear cita para un paciente
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={abrirBloqueoDesdeSeleccion}
            >
              <Lock size={15} />
              Bloquear este horario
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Nueva cita ───────────────────────────────────────────── */}
      <Dialog open={nuevaCitaOpen} onOpenChange={setNuevaCitaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus size={16} style={{ color: "var(--brand)" }} />
              Nueva cita
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Paciente *</Label>
              <Input
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="mt-1 h-8 text-sm"
              />
              <select
                value={nuevaCita.pacienteId}
                onChange={(e) => setNuevaCita((p) => ({ ...p, pacienteId: e.target.value }))}
                size={5}
                className="mt-1 w-full text-sm border border-gray-200 rounded-md px-2 py-1 focus:outline-none bg-white"
              >
                <option value="" disabled>— selecciona un paciente —</option>
                {pacientesFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              {pacientes.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">Cargando pacientes...</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">Fecha *</Label>
                <Input
                  type="date"
                  value={nuevaCita.fecha}
                  onChange={(e) => setNuevaCita((p) => ({ ...p, fecha: e.target.value }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600">Hora *</Label>
                <Input
                  type="time"
                  value={nuevaCita.hora}
                  onChange={(e) => setNuevaCita((p) => ({ ...p, hora: e.target.value }))}
                  className="mt-1 h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">Duración</Label>
                <select
                  value={nuevaCita.duracion}
                  onChange={(e) => setNuevaCita((p) => ({ ...p, duracion: Number(e.target.value) }))}
                  className="mt-1 w-full h-8 text-sm border border-gray-200 rounded-md px-2 focus:outline-none bg-white"
                >
                  {DURACIONES.map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Modalidad</Label>
                <select
                  value={nuevaCita.modalidad}
                  onChange={(e) => setNuevaCita((p) => ({ ...p, modalidad: e.target.value as "PRESENCIAL" | "ONLINE" }))}
                  className="mt-1 w-full h-8 text-sm border border-gray-200 rounded-md px-2 focus:outline-none bg-white"
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
            </div>

            {nuevaCita.modalidad === "ONLINE" && (
              <div>
                <Label className="text-xs text-gray-600">Link de sesión <span className="text-gray-400">(opcional)</span></Label>
                <Input
                  value={nuevaCita.linkSesion}
                  onChange={(e) => setNuevaCita((p) => ({ ...p, linkSesion: e.target.value }))}
                  placeholder="https://meet.google.com/..."
                  className="mt-1 h-8 text-sm"
                />
              </div>
            )}

            <div>
              <Label className="text-xs text-gray-600">Motivo de consulta <span className="text-gray-400">(opcional)</span></Label>
              <Input
                value={nuevaCita.motivoConsulta}
                onChange={(e) => setNuevaCita((p) => ({ ...p, motivoConsulta: e.target.value }))}
                placeholder="Ej: Seguimiento, primera consulta..."
                className="mt-1 h-8 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-600">Notas internas <span className="text-gray-400">(opcional)</span></Label>
              <Input
                value={nuevaCita.notasAdmin}
                onChange={(e) => setNuevaCita((p) => ({ ...p, notasAdmin: e.target.value }))}
                placeholder="Solo visible para ti..."
                className="mt-1 h-8 text-sm"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setNuevaCitaOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: "var(--brand)" }}
                onClick={guardarNuevaCita}
                disabled={guardandoCita}
              >
                {guardandoCita ? "Guardando..." : "Crear cita"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Crear bloqueo ────────────────────────────────────────── */}
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

      {/* ── Dialog: Eliminar bloqueo ─────────────────────────────────────── */}
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

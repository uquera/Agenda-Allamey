"use client"

import { useRef } from "react"
import AgendaCalendar from "@/components/admin/AgendaCalendar"
import CitasPendientesPanel from "@/components/admin/CitasPendientesPanel"

interface CitaPendiente {
  id: string
  fecha: string
  modalidad: string
  motivoConsulta?: string | null
  notasPaciente?: string | null
  paciente: { nombre: string; email: string }
}

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
  pendientes: CitaPendiente[]
  eventos: Evento[]
  bloqueos: Bloqueo[]
}

export default function AgendaWrapper({ pendientes, eventos, bloqueos }: Props) {
  // Ref que expone la función de actualización de colores del calendario
  const onCitaActualizadaRef = useRef<((id: string, nuevoEstado: string) => void) | null>(null)

  function handleCitaActualizada(id: string, nuevoEstado: string) {
    onCitaActualizadaRef.current?.(id, nuevoEstado)
  }

  return (
    <div className="space-y-6">
      {pendientes.length > 0 && (
        <CitasPendientesPanel
          pendientes={pendientes}
          onCitaActualizada={handleCitaActualizada}
        />
      )}
      <AgendaCalendar
        eventos={eventos}
        bloqueosIniciales={bloqueos}
        onCitaActualizadaRef={onCitaActualizadaRef}
      />
    </div>
  )
}

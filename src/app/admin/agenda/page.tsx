import { prisma } from "@/lib/prisma"
import AgendaCalendar from "@/components/admin/AgendaCalendar"
import CitasPendientesPanel from "@/components/admin/CitasPendientesPanel"

export const dynamic = "force-dynamic"

export default async function AgendaPage() {
  const citas = await prisma.cita.findMany({
    include: {
      paciente: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { fecha: "asc" },
  })

  const eventos = citas.map((c) => ({
    id: c.id,
    title: c.paciente.user.name || "Paciente",
    start: c.fecha.toISOString(),
    end: new Date(new Date(c.fecha).getTime() + c.duracion * 60000).toISOString(),
    extendedProps: {
      estado: c.estado,
      modalidad: c.modalidad,
      email: c.paciente.user.email,
      pacienteId: c.pacienteId,
      motivoConsulta: c.motivoConsulta,
      notasAdmin: c.notasAdmin,
      linkSesion: c.linkSesion,
    },
    className: `fc-event-${c.estado.toLowerCase()}`,
  }))

  const pendientes = citas.filter((c) => c.estado === "PENDIENTE")

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Agenda</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona tus citas y disponibilidad
        </p>
      </div>

      {pendientes.length > 0 && (
        <CitasPendientesPanel
          pendientes={pendientes.map((c) => ({
            id: c.id,
            fecha: c.fecha.toISOString(),
            modalidad: c.modalidad,
            motivoConsulta: c.motivoConsulta,
            notasPaciente: c.notasPaciente,
            paciente: {
              nombre: c.paciente.user.name || "Paciente",
              email: c.paciente.user.email,
            },
          }))}
        />
      )}

      <AgendaCalendar eventos={eventos} />
    </div>
  )
}

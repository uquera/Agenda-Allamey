import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Monitor, MapPin } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export const dynamic = "force-dynamic"

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

export default async function CitasPacientePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const paciente = await prisma.paciente.findUnique({
    where: { userId: session.user.id },
  })
  if (!paciente) redirect("/login")

  const citas = await prisma.cita.findMany({
    where: { pacienteId: paciente.id },
    orderBy: { fecha: "desc" },
  })

  const proximas = citas.filter(
    (c) => new Date(c.fecha) >= new Date() && ["PENDIENTE", "APROBADA"].includes(c.estado)
  )
  const pasadas = citas.filter(
    (c) => new Date(c.fecha) < new Date() || ["COMPLETADA", "CANCELADA", "RECHAZADA"].includes(c.estado)
  )

  function CitaCard({ cita }: { cita: (typeof citas)[0] }) {
    return (
      <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#fff0f2" }}
        >
          <CalendarDays size={18} style={{ color: "#8B1A2C" }} />
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
              style={{ color: "#8B1A2C" }}
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
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Mis citas</h1>
          <p className="text-sm text-gray-500 mt-1">Historial y citas próximas</p>
        </div>
        <Link
          href="/paciente/agendar"
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-colors"
          style={{ backgroundColor: "#8B1A2C" }}
        >
          + Solicitar cita
        </Link>
      </div>

      {proximas.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide text-xs">
              Próximas
            </h2>
            <div className="space-y-3">
              {proximas.map((c) => <CitaCard key={c.id} cita={c} />)}
            </div>
          </CardContent>
        </Card>
      )}

      {pasadas.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide text-xs">
              Historial
            </h2>
            <div className="space-y-3">
              {pasadas.map((c) => <CitaCard key={c.id} cita={c} />)}
            </div>
          </CardContent>
        </Card>
      )}

      {citas.length === 0 && (
        <div className="text-center py-16">
          <CalendarDays size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 mb-4">No tienes citas registradas</p>
          <Link
            href="/paciente/agendar"
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#8B1A2C" }}
          >
            Solicitar primera cita
          </Link>
        </div>
      )}
    </div>
  )
}

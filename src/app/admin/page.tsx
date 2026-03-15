import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CalendarDays, Clock, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export default async function AdminDashboard() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000)

  const [
    totalPacientes,
    citasPendientes,
    citasHoy,
    citasProximas,
    ultimosPacientes,
  ] = await Promise.all([
    prisma.paciente.count({ where: { activo: true } }),
    prisma.cita.count({ where: { estado: "PENDIENTE" } }),
    prisma.cita.count({ where: { fecha: { gte: inicioHoy, lt: finHoy } } }),
    prisma.cita.findMany({
      where: {
        fecha: { gte: hoy },
        estado: { in: ["APROBADA", "PENDIENTE"] },
      },
      orderBy: { fecha: "asc" },
      take: 5,
      include: { paciente: { include: { user: true } } },
    }),
    prisma.paciente.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { user: true },
    }),
  ])

  const estadoLabel: Record<string, string> = {
    PENDIENTE: "Pendiente",
    APROBADA: "Aprobada",
    RECHAZADA: "Rechazada",
    REAGENDADA: "Reagendada",
    COMPLETADA: "Completada",
    CANCELADA: "Cancelada",
  }

  const estadoColor: Record<string, string> = {
    PENDIENTE: "bg-amber-100 text-amber-700",
    APROBADA: "bg-green-100 text-green-700",
    RECHAZADA: "bg-red-100 text-red-700",
    REAGENDADA: "bg-blue-100 text-blue-700",
    COMPLETADA: "bg-gray-100 text-gray-600",
    CANCELADA: "bg-gray-100 text-gray-600",
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Pacientes activos
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{totalPacientes}</p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#fff0f2" }}>
                <Users size={20} style={{ color: "#8B1A2C" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Citas hoy
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{citasHoy}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <CalendarDays size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Solicitudes pendientes
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{citasPendientes}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Por aprobar
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{citasPendientes}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Próximas citas */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Próximas citas
                </CardTitle>
                <Link
                  href="/admin/agenda"
                  className="text-xs font-medium hover:underline"
                  style={{ color: "#8B1A2C" }}
                >
                  Ver agenda →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {citasProximas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No hay citas próximas
                </p>
              ) : (
                <div className="space-y-3">
                  {citasProximas.map((cita) => (
                    <div
                      key={cita.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="w-2 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: cita.estado === "PENDIENTE" ? "#f59e0b" : "#8B1A2C" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {cita.paciente.user.name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {format(new Date(cita.fecha), "EEEE d MMM · HH:mm", { locale: es })} ·{" "}
                          {cita.modalidad === "ONLINE" ? "Online" : "Presencial"}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${estadoColor[cita.estado]}`}
                      >
                        {estadoLabel[cita.estado]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Últimos pacientes */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Pacientes recientes
                </CardTitle>
                <Link
                  href="/admin/pacientes"
                  className="text-xs font-medium hover:underline"
                  style={{ color: "#8B1A2C" }}
                >
                  Ver todos →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {ultimosPacientes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Sin pacientes aún
                </p>
              ) : (
                <div className="space-y-3">
                  {ultimosPacientes.map((p) => {
                    const initials = p.user.name
                      ? p.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "??"
                    return (
                      <Link
                        key={p.id}
                        href={`/admin/pacientes/${p.id}`}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: "#8B1A2C" }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {p.user.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{p.user.email}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

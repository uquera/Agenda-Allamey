import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, BookOpen, FileText, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import Image from "next/image"
import { MODULES } from "@/lib/modules"
import { BRAND } from "@/lib/brand"

export const dynamic = "force-dynamic"

export default async function PacienteDashboard() {
  const session = await auth()
  if (!session) redirect("/login")

  const paciente = await prisma.paciente.findUnique({
    where: { userId: session.user.id },
    include: {
      citas: MODULES.agendar
        ? {
            where: {
              estado: { in: ["PENDIENTE", "APROBADA", "CANCELADA"] },
            },
            orderBy: { fecha: "desc" },
            take: 5,
          }
        : false,
    },
  })

  if (!paciente) redirect("/login")

  const materialesData = MODULES.materiales
    ? await prisma.materialAsignado.findMany({
        where: { pacienteId: paciente.id, visto: false },
        include: { material: true },
        take: 3,
      })
    : []

  const estadoColor: Record<string, string> = {
    PENDIENTE: "bg-amber-100 text-amber-700",
    APROBADA: "bg-green-100 text-green-700",
    RECHAZADA: "bg-red-100 text-red-700",
    REAGENDADA: "bg-blue-100 text-blue-700",
    COMPLETADA: "bg-gray-100 text-gray-600",
    CANCELADA: "bg-gray-100 text-gray-600",
  }

  const estadoLabel: Record<string, string> = {
    PENDIENTE: "Pendiente",
    APROBADA: "Confirmada",
    RECHAZADA: "Rechazada",
    REAGENDADA: "Reagendada",
    COMPLETADA: "Completada",
    CANCELADA: "Cancelada",
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Banner de bienvenida */}
      <div
        className="relative rounded-2xl overflow-hidden flex items-end gap-4 px-6 pt-6 pb-0"
        style={{ backgroundColor: "#fce4ec", minHeight: "140px" }}
      >
        <div className="flex-1 pb-6">
          <p className="text-label mb-1" style={{ color: "var(--brand)" }}>
            Bienvenida a tu portal
          </p>
          <h1
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.15rem, 2.5vw, 1.4rem)",
              color: "#1f2937",
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
            }}
          >
            Hola,{" "}
            <span style={{ color: "var(--brand)" }}>{paciente.nombre?.split(" ")[0]}</span>
            {" "}👋
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans), sans-serif",
              fontWeight: 600,
              fontSize: "0.8rem",
              color: "#6b7280",
              marginTop: "0.35rem",
              letterSpacing: "0.005em",
            }}
          >
            {BRAND.doctorTitle} te acompaña en este proceso
          </p>
        </div>
        <div className="shrink-0 w-36 self-end relative" style={{ height: "180px" }}>
          <Image
            src="/inicio-banner.jpg"
            alt="Bienvenida"
            fill
            className="object-cover object-bottom"
          />
          {/* Difuminado: izquierda y arriba hacia el color del banner */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(to right, #fce4ec 0%, transparent 45%), linear-gradient(to bottom, #fce4ec 0%, transparent 30%)",
            }}
          />
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            MODULES.agendar    ? { href: "/paciente/agendar",    icon: CalendarDays, label: "Solicitar cita", color: "var(--brand)", bg: "var(--brand-light)" } : null,
            MODULES.agendar    ? { href: "/paciente/citas",       icon: Clock,        label: "Mis citas",      color: "#2563eb",       bg: "#eff6ff" } : null,
            MODULES.sesiones   ? { href: "/paciente/sesiones",    icon: FileText,     label: "Sesiones",       color: "#7c3aed",       bg: "#f5f3ff" } : null,
            MODULES.materiales ? { href: "/paciente/materiales",  icon: BookOpen,     label: "Materiales",     color: "#059669",       bg: "#ecfdf5" } : null,
          ] as Array<{ href: string; icon: React.ElementType; label: string; color: string; bg: string } | null>
        ).filter((item): item is { href: string; icon: React.ElementType; label: string; color: string; bg: string } => item !== null)
          .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-all text-center"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: item.bg }}
            >
              <item.icon size={20} style={{ color: item.color }} />
            </div>
            <span className="text-xs font-medium text-gray-700">{item.label}</span>
          </Link>
        ))}
      </div>

      {(MODULES.agendar || MODULES.materiales) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas citas */}
        {MODULES.agendar && <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-section-title text-gray-800" style={{ fontSize: "0.9rem" }}>Mis citas</h2>
              <Link
                href="/paciente/citas"
                className="text-xs font-medium hover:underline"
                style={{ color: "var(--brand)" }}
              >
                Ver todas →
              </Link>
            </div>

            {paciente.citas.length === 0 ? (
              <div className="text-center py-6">
                <CalendarDays size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No tienes citas próximas</p>
                <Link
                  href="/paciente/agendar"
                  className="text-xs font-medium mt-2 inline-block hover:underline"
                  style={{ color: "var(--brand)" }}
                >
                  Solicitar una cita
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {paciente.citas.map((cita) => {
                  const accentColor =
                    cita.estado === "CANCELADA" ? "#9ca3af" :
                    cita.estado === "PENDIENTE" ? "#f59e0b" : "var(--brand)"
                  return (
                    <div key={cita.id} className={`flex items-center gap-3 p-3 rounded-lg ${cita.estado === "CANCELADA" ? "bg-gray-50 opacity-70" : "bg-gray-50"}`}>
                      <div
                        className="w-1.5 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 capitalize">
                          {format(new Date(cita.fecha), "EEEE d 'de' MMMM", { locale: es })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(cita.fecha), "HH:mm")} ·{" "}
                          {cita.modalidad === "ONLINE" ? "Online" : "Presencial"}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[cita.estado]}`}>
                        {estadoLabel[cita.estado]}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>}

        {/* Materiales sin ver */}
        {MODULES.materiales && <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-section-title text-gray-800" style={{ fontSize: "0.9rem" }}>Materiales nuevos</h2>
              <Link
                href="/paciente/materiales"
                className="text-xs font-medium hover:underline"
                style={{ color: "var(--brand)" }}
              >
                Ver todos →
              </Link>
            </div>

            {materialesData.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No hay materiales nuevos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materialesData.map((ma) => (
                  <Link
                    key={ma.id}
                    href="/paciente/materiales"
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                      <BookOpen size={14} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {ma.material.titulo}
                      </p>
                      <p className="text-xs text-gray-400">{ma.material.tipo}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs shrink-0">
                      Nuevo
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>}
      </div>
      )}
    </div>
  )
}

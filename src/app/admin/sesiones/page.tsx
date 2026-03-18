import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plus } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SesionesAdminPage() {
  const sesiones = await prisma.sesionNota.findMany({
    include: {
      paciente: { include: { user: { select: { name: true } } } },
    },
    orderBy: { fechaSesion: "desc" },
  })

  const completadas = await prisma.cita.findMany({
    where: {
      estado: "COMPLETADA",
      sesion: null,
    },
    include: {
      paciente: { include: { user: { select: { name: true } } } },
    },
    orderBy: { fecha: "desc" },
    take: 10,
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Sesiones</h1>
          <p className="text-sm text-gray-500 mt-1">Notas clínicas y resúmenes de sesiones</p>
        </div>
        <Link
          href="/admin/sesiones/nueva"
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "var(--brand)" }}
        >
          <Plus size={15} />
          Nueva sesión
        </Link>
      </div>

      {completadas.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Citas completadas sin nota de sesión ({completadas.length})
            </p>
            <div className="space-y-2">
              {completadas.map((cita) => (
                <Link
                  key={cita.id}
                  href={`/admin/sesiones/nueva?citaId=${cita.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {cita.paciente.user.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {format(new Date(cita.fecha), "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    + Agregar nota
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {sesiones.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--brand-light)" }}
          >
            <FileText size={28} style={{ color: "var(--brand)" }} />
          </div>
          <p className="text-gray-500 font-medium">No hay notas de sesión aún</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Crea la primera nota usando el botón "Nueva sesión"
          </p>
          <Link
            href="/admin/sesiones/nueva"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg text-white"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <Plus size={15} />
            Nueva sesión
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {sesiones.map((s) => (
            <Link key={s.id} href={`/admin/sesiones/${s.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--brand-light)" }}
                    >
                      <FileText size={18} style={{ color: "var(--brand)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{s.titulo}</p>
                      <p className="text-xs text-gray-500">
                        {s.paciente.user.name} ·{" "}
                        <span className="capitalize">
                          {format(new Date(s.fechaSesion), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                      </p>
                    </div>
                    <Badge
                      className={`shrink-0 ${
                        s.publicado
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      } hover:bg-opacity-100`}
                    >
                      {s.publicado ? "Publicado" : "Borrador"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

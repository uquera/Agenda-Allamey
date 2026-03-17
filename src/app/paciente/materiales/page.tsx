import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FileText, Video, Link as LinkIcon, Music, Dumbbell, Download, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import MarcarVistoButton from "@/components/paciente/MarcarVistoButton"

export const dynamic = "force-dynamic"

const tipoIcono: Record<string, React.ElementType> = {
  PDF: FileText,
  VIDEO: Video,
  ARTICULO: LinkIcon,
  EJERCICIO: Dumbbell,
  AUDIO: Music,
}

const tipoColor: Record<string, { bg: string; text: string }> = {
  PDF: { bg: "#fff0f2", text: "#8B1A2C" },
  VIDEO: { bg: "#eff6ff", text: "#2563eb" },
  ARTICULO: { bg: "#ecfdf5", text: "#059669" },
  EJERCICIO: { bg: "#fffbeb", text: "#d97706" },
  AUDIO: { bg: "#f5f3ff", text: "#7c3aed" },
}

export default async function MaterialesPacientePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const paciente = await prisma.paciente.findUnique({
    where: { userId: session.user.id },
  })
  if (!paciente) redirect("/login")

  const materiales = await prisma.materialAsignado.findMany({
    where: { pacienteId: paciente.id },
    include: { material: true },
    orderBy: { createdAt: "desc" },
  })

  const nuevos = materiales.filter((m) => !m.visto)
  const vistos = materiales.filter((m) => m.visto)

  function MaterialCard({ ma }: { ma: (typeof materiales)[0] }) {
    const Icono = tipoIcono[ma.material.tipo] || BookOpen
    const color = tipoColor[ma.material.tipo] || { bg: "#f5f5f5", text: "#888" }

    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: color.bg }}
            >
              <Icono size={18} style={{ color: color.text }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">{ma.material.titulo}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      className="text-xs px-2 py-0 hover:bg-transparent"
                      style={{ backgroundColor: color.bg, color: color.text }}
                    >
                      {ma.material.tipo}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      Asignado el{" "}
                      {format(new Date(ma.createdAt), "d 'de' MMM", { locale: es })}
                    </span>
                  </div>
                </div>
                {!ma.visto && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs shrink-0">
                    Nuevo
                  </Badge>
                )}
              </div>

              {ma.material.descripcion && (
                <p className="text-xs text-gray-500 mt-2">{ma.material.descripcion}</p>
              )}

              <div className="flex items-center gap-2 mt-3">
                {ma.material.archivoUrl && (
                  <a
                    href={ma.material.archivoUrl}
                    download
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                    style={{ color: "#8B1A2C", borderColor: "#8B1A2C" }}
                  >
                    <Download size={12} />
                    Descargar
                  </a>
                )}
                {ma.material.contenido && (
                  <a
                    href={ma.material.contenido}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                    style={{ color: "#8B1A2C", borderColor: "#8B1A2C" }}
                  >
                    <ExternalLink size={12} />
                    {ma.material.tipo === "VIDEO" ? "Ver video" :
                     ma.material.tipo === "AUDIO" ? "Escuchar" :
                     "Abrir enlace"}
                  </a>
                )}
                {!ma.visto && (
                  <MarcarVistoButton asignacionId={ma.id} />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Mis materiales</h1>
        <p className="text-sm text-gray-500 mt-1">
          Recursos asignados por la Dra. Allamey para tu proceso
        </p>
      </div>

      {materiales.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">No hay materiales asignados aún</p>
        </div>
      ) : (
        <>
          {nuevos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Nuevos ({nuevos.length})
              </h2>
              {nuevos.map((ma) => <MaterialCard key={ma.id} ma={ma} />)}
            </div>
          )}
          {vistos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Vistos ({vistos.length})
              </h2>
              {vistos.map((ma) => <MaterialCard key={ma.id} ma={ma} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BRAND } from "@/lib/brand"
import { FolderOpen, FileText, ImageIcon, Globe, File, Download, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = "force-dynamic"

function formatBytes(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const tipoConfig: Record<string, { label: string; icon: React.ElementType; bg: string; color: string }> = {
  DOCUMENTO: { label: "Documento",  icon: FileText,   bg: "#eff6ff", color: "#2563eb" },
  IMAGEN:    { label: "Imagen",     icon: ImageIcon,   bg: "#fdf4ff", color: "#9333ea" },
  URL:       { label: "Enlace",     icon: Globe,       bg: "#ecfdf5", color: "#16a34a" },
  OTRO:      { label: "Archivo",    icon: File,        bg: "#f9fafb", color: "#6b7280" },
}

export default async function DocumentosPacientePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const paciente = await prisma.paciente.findUnique({
    where: { userId: session.user.id },
  })
  if (!paciente) redirect("/login")

  const archivos = await prisma.archivoPaciente.findMany({
    where: { pacienteId: paciente.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Mis documentos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Archivos y documentos compartidos por {BRAND.doctorTitle}
        </p>
      </div>

      {archivos.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">No hay documentos disponibles</p>
          <p className="text-gray-300 text-sm mt-1">
            {BRAND.doctorTitle} compartirá documentos relevantes para tu proceso
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {archivos.map((archivo) => {
            const cfg = tipoConfig[archivo.tipo] ?? tipoConfig.OTRO
            const Icono = cfg.icon
            const isImage = archivo.tipo === "IMAGEN"
            const isUrl = archivo.tipo === "URL"

            return (
              <Card key={archivo.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {isImage ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={archivo.url}
                          alt={archivo.nombre}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cfg.bg }}
                      >
                        <Icono size={18} style={{ color: cfg.color }} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 truncate">{archivo.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              className="text-xs px-2 py-0 hover:bg-transparent"
                              style={{ backgroundColor: cfg.bg, color: cfg.color }}
                            >
                              {cfg.label}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {format(new Date(archivo.createdAt), "d 'de' MMM yyyy", { locale: es })}
                            </span>
                            {archivo.tamano ? (
                              <span className="text-xs text-gray-300">· {formatBytes(archivo.tamano)}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {archivo.descripcion && (
                        <p className="text-xs text-gray-500 mt-1.5">{archivo.descripcion}</p>
                      )}

                      <div className="mt-3">
                        {isUrl ? (
                          <a
                            href={archivo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                            style={{ color: "var(--brand)", borderColor: "var(--brand)" }}
                          >
                            <ExternalLink size={12} />
                            Abrir enlace
                          </a>
                        ) : (
                          <a
                            href={archivo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                            style={{ color: "var(--brand)", borderColor: "var(--brand)" }}
                          >
                            <Download size={12} />
                            {isImage ? "Ver imagen" : "Descargar"}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

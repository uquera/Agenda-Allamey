import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, FileSpreadsheet, FileText as FileDoc, Music, File } from "lucide-react"
import { BRAND } from "@/lib/brand"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = "force-dynamic"

export default async function SesionesPacientePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const paciente = await prisma.paciente.findUnique({
    where: { userId: session.user.id },
  })
  if (!paciente) redirect("/login")

  const sesiones = await prisma.sesionNota.findMany({
    where: { pacienteId: paciente.id, publicado: true },
    select: {
      id: true,
      titulo: true,
      contenido: true,
      recomendacion: true,
      fechaSesion: true,
      pdfUrl: true,
      archivos: {
        where: { privado: false },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { fechaSesion: "desc" },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Mis sesiones</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resúmenes de tus sesiones compartidos por {BRAND.doctorTitle}
        </p>
      </div>

      {sesiones.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">Aún no hay resúmenes disponibles</p>
          <p className="text-gray-300 text-sm mt-1">
            {BRAND.doctorTitle} compartirá los resúmenes después de cada sesión
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sesiones.map((sesion) => (
            <Card key={sesion.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--brand-light)" }}
                    >
                      <FileText size={18} style={{ color: "var(--brand)" }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">{sesion.titulo}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {format(new Date(sesion.fechaSesion), "EEEE d 'de' MMMM 'de' yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                  {sesion.pdfUrl && (
                    <a
                      href={`/api/sesiones/${sesion.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50 shrink-0"
                      style={{ color: "var(--brand)", borderColor: "var(--brand)" }}
                    >
                      <Download size={13} />
                      PDF
                    </a>
                  )}
                </div>

                {sesion.contenido && (
                  <div
                    className="mt-4 prose prose-sm max-w-none text-gray-600 border-t border-gray-100 pt-4"
                    dangerouslySetInnerHTML={{ __html: sesion.contenido }}
                  />
                )}

                {sesion.recomendacion && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Recomendaciones
                    </p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{sesion.recomendacion}</p>
                  </div>
                )}

                {sesion.archivos.length > 0 && (
                  <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Archivos adjuntos</p>
                    <div className="space-y-2">
                      {sesion.archivos.map((archivo) => {
                        if (archivo.tipo === "imagen") {
                          return (
                            <a
                              key={archivo.id}
                              href={archivo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={archivo.url}
                                alt={archivo.nombre}
                                className="max-h-48 rounded-lg border border-gray-200 object-contain"
                              />
                              <p className="text-xs text-gray-400 mt-1">{archivo.nombre}</p>
                            </a>
                          )
                        }
                        if (archivo.tipo === "audio") {
                          return (
                            <div key={archivo.id} className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Music size={14} className="text-purple-500 shrink-0" />
                                <span className="truncate">{archivo.nombre}</span>
                              </div>
                              <audio controls src={archivo.url} className="w-full h-8" />
                            </div>
                          )
                        }
                        const icon =
                          archivo.tipo === "excel" ? <FileSpreadsheet size={14} className="text-green-600 shrink-0" /> :
                          archivo.tipo === "word" ? <FileDoc size={14} className="text-blue-600 shrink-0" /> :
                          archivo.tipo === "pdf" ? <FileText size={14} className="text-red-500 shrink-0" /> :
                          <File size={14} className="text-gray-400 shrink-0" />
                        return (
                          <a
                            key={archivo.id}
                            href={archivo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            {icon}
                            <span className="text-xs text-gray-700 truncate flex-1">{archivo.nombre}</span>
                            <Download size={12} className="text-gray-400 shrink-0" />
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

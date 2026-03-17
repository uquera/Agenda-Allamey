import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import SesionEditor from "@/components/admin/SesionEditor"

export const dynamic = "force-dynamic"

export default async function SesionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const sesion = await prisma.sesionNota.findUnique({
    where: { id },
    include: {
      paciente: { include: { user: { select: { name: true, email: true } } } },
    },
  })

  if (!sesion) notFound()

  return (
    <SesionEditor
      sesion={{
        id: sesion.id,
        titulo: sesion.titulo,
        tipoSesion: sesion.tipoSesion,
        contenido: sesion.contenido,
        recomendacion: sesion.recomendacion,
        cantidadSesiones: sesion.cantidadSesiones,
        estadoSeguimiento: sesion.estadoSeguimiento,
        publicado: sesion.publicado,
        fechaSesion: sesion.fechaSesion.toISOString(),
        pdfUrl: sesion.pdfUrl,
        paciente: {
          nombre: sesion.paciente.user.name || "Paciente",
          email: sesion.paciente.user.email,
        },
      }}
    />
  )
}

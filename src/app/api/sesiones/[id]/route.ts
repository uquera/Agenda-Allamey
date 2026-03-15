import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { enviarResumenSesion } from "@/lib/email"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { titulo, contenido, publicado } = await req.json()

  const sesionAntes = await prisma.sesionNota.findUnique({ where: { id } })
  if (!sesionAntes) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const sesion = await prisma.sesionNota.update({
    where: { id },
    data: { titulo, contenido, publicado },
    include: {
      paciente: { include: { user: { select: { name: true, email: true } } } },
    },
  })

  // Notificar al paciente si se publica por primera vez
  if (publicado && !sesionAntes.publicado) {
    try {
      await enviarResumenSesion(
        sesion.paciente.user.email,
        sesion.paciente.user.name || "Paciente",
        new Date(sesion.fechaSesion)
      )
    } catch (err) {
      console.error("Error enviando email:", err)
    }
  }

  return NextResponse.json(sesion)
}

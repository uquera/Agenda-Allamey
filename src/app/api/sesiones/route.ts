import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { pacienteId, citaId, fechaSesion, titulo } = await req.json()

  if (!pacienteId || !fechaSesion) {
    return NextResponse.json({ error: "Paciente y fecha son requeridos" }, { status: 400 })
  }

  const sesion = await prisma.sesionNota.create({
    data: {
      pacienteId,
      citaId: citaId || null,
      fechaSesion: new Date(fechaSesion),
      titulo: titulo || "Resumen de sesión",
      contenido: "",
      publicado: false,
    },
  })

  return NextResponse.json(sesion, { status: 201 })
}

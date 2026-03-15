import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const citas = await prisma.cita.findMany({
    where: {
      estado: "COMPLETADA",
      sesion: null,
    },
    include: {
      paciente: { include: { user: { select: { name: true } } } },
    },
    orderBy: { fecha: "desc" },
  })

  return NextResponse.json(
    citas.map((c) => ({
      id: c.id,
      pacienteId: c.pacienteId,
      fecha: c.fecha,
      pacienteNombre: c.paciente.user.name ?? "Sin nombre",
    }))
  )
}

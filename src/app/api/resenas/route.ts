import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/resenas — lista todas las reseñas (solo ADMIN/doctora)
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const resenas = await prisma.resena.findMany({
    include: {
      paciente: { include: { user: { select: { name: true } } } },
      cita: { select: { fecha: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const result = resenas.map((r) => ({
    id: r.id,
    calificacion: r.calificacion,
    comentario: r.comentario,
    respuesta: r.respuesta,
    respondidoEn: r.respondidoEn,
    visible: r.visible,
    createdAt: r.createdAt,
    fechaCita: r.cita.fecha,
    pacienteNombre: r.paciente.user.name ?? "Paciente",
  }))

  return NextResponse.json(result)
}

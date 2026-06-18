import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const cita = await prisma.cita.findUnique({
    where: { resenaToken: token },
    include: { resena: { select: { id: true } } },
  })

  if (!cita) {
    return NextResponse.json({ error: "Enlace inválido o expirado" }, { status: 404 })
  }
  if (cita.estado !== "COMPLETADA") {
    return NextResponse.json({ error: "La sesión aún no ha sido completada" }, { status: 400 })
  }
  if (cita.resena) {
    return NextResponse.json({ error: "Ya existe una calificación para esta sesión" }, { status: 409 })
  }

  const { calificacion, comentario } = await req.json()

  if (!calificacion || calificacion < 1 || calificacion > 5) {
    return NextResponse.json({ error: "Calificación inválida (1-5)" }, { status: 400 })
  }

  const resena = await prisma.resena.create({
    data: {
      citaId:       cita.id,
      pacienteId:   cita.pacienteId,
      calificacion: Number(calificacion),
      comentario:   comentario?.trim() || null,
      visible:      true,
    },
  })

  return NextResponse.json(resena, { status: 201 })
}

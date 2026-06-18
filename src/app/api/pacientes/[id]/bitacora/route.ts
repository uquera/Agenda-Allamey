import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/pacientes/[id]/bitacora — registros emocionales de un paciente (ADMIN)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  const registros = await prisma.registroEmocional.findMany({
    where: { pacienteId: id },
    orderBy: { fecha: "desc" },
    take: 60,
  })

  return NextResponse.json(
    registros.map((r) => ({
      id: r.id,
      fecha: r.fecha.toISOString(),
      estadoAnimo: r.estadoAnimo,
      emociones: r.emociones ? (JSON.parse(r.emociones) as string[]) : [],
      desencadenante: r.desencadenante,
      nota: r.nota,
      horasSueno: r.horasSueno,
      nivelEnergia: r.nivelEnergia,
    }))
  )
}

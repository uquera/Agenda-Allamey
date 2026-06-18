import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/bitacora — registros del paciente autenticado (últimos 90)
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const paciente = await prisma.paciente.findUnique({ where: { userId: session.user.id } })
  if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

  const registros = await prisma.registroEmocional.findMany({
    where: { pacienteId: paciente.id },
    orderBy: { fecha: "desc" },
    take: 90,
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

// POST /api/bitacora — crea un registro emocional
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const paciente = await prisma.paciente.findUnique({ where: { userId: session.user.id } })
  if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

  const body = await req.json()
  const estadoAnimo = Number(body.estadoAnimo)
  if (!estadoAnimo || estadoAnimo < 1 || estadoAnimo > 5) {
    return NextResponse.json({ error: "Selecciona cómo te sientes" }, { status: 400 })
  }

  const emociones = Array.isArray(body.emociones) ? body.emociones.slice(0, 12) : []

  const registro = await prisma.registroEmocional.create({
    data: {
      pacienteId: paciente.id,
      estadoAnimo,
      emociones: emociones.length ? JSON.stringify(emociones) : null,
      desencadenante: body.desencadenante?.trim() || null,
      nota: body.nota?.trim() || null,
      horasSueno: body.horasSueno != null && body.horasSueno !== "" ? Number(body.horasSueno) : null,
      nivelEnergia: body.nivelEnergia ? Number(body.nivelEnergia) : null,
    },
  })

  return NextResponse.json({ id: registro.id }, { status: 201 })
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const bloqueos = await prisma.bloqueoHorario.findMany({ orderBy: { fecha: "asc" } })
  return NextResponse.json(bloqueos)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { fecha, horaInicio, horaFin, todoElDia, motivo } = await req.json()

  if (!fecha) return NextResponse.json({ error: "La fecha es obligatoria" }, { status: 400 })

  const bloqueo = await prisma.bloqueoHorario.create({
    data: {
      fecha: new Date(fecha),
      horaInicio: todoElDia ? null : horaInicio || null,
      horaFin: todoElDia ? null : horaFin || null,
      todoElDia: todoElDia || false,
      motivo: motivo || null,
    },
  })

  return NextResponse.json(bloqueo, { status: 201 })
}

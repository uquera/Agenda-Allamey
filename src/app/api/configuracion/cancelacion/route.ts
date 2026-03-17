import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const politica = await prisma.politicaCancelacion.findFirst()
  return NextResponse.json(politica)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { activa, horasAntelacion, cobrarCancelacion, montoCancelacion, descripcion } = body

  const existente = await prisma.politicaCancelacion.findFirst()

  const data = {
    activa: activa ?? false,
    horasAntelacion: Number(horasAntelacion) || 24,
    cobrarCancelacion: cobrarCancelacion ?? false,
    montoCancelacion: montoCancelacion ? Number(montoCancelacion) : null,
    descripcion: descripcion || null,
  }

  const politica = existente
    ? await prisma.politicaCancelacion.update({ where: { id: existente.id }, data })
    : await prisma.politicaCancelacion.create({ data })

  return NextResponse.json(politica)
}

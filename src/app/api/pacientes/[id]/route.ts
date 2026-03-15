import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const paciente = await prisma.paciente.update({
    where: { id },
    data: {
      motivoConsulta: body.motivoConsulta || null,
      notas: body.notas || null,
      ocupacion: body.ocupacion || null,
      genero: body.genero || null,
      telefono: body.telefono || null,
    },
  })

  return NextResponse.json(paciente)
}

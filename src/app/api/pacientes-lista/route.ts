import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const pacientes = await prisma.paciente.findMany({
    where: { activo: true },
    include: { user: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  })

  return NextResponse.json(
    pacientes.map((p) => ({ id: p.id, nombre: p.user.name ?? "Sin nombre" }))
  )
}

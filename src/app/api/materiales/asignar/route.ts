import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { enviarNuevoMaterial } from "@/lib/email"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { materialId, pacienteId } = await req.json()

  // Upsert para no duplicar
  const asignacion = await prisma.materialAsignado.upsert({
    where: { materialId_pacienteId: { materialId, pacienteId } },
    update: { visto: false, fechaVisto: null },
    create: { materialId, pacienteId },
    include: {
      material: true,
      paciente: { include: { user: { select: { name: true, email: true } } } },
    },
  })

  try {
    await enviarNuevoMaterial(
      asignacion.paciente.user.email,
      asignacion.paciente.user.name || "Paciente",
      asignacion.material.titulo
    )
  } catch (err) {
    console.error("Error enviando email:", err)
  }

  return NextResponse.json(asignacion, { status: 201 })
}

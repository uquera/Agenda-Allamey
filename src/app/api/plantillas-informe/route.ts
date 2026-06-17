import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/plantillas-informe — lista plantillas (solo ADMIN)
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const plantillas = await prisma.plantillaInforme.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(plantillas)
}

// POST /api/plantillas-informe — crea una plantilla modelo
export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { nombre, descripcion, contenido } = await req.json()
  if (!nombre?.trim() || !contenido?.trim()) {
    return NextResponse.json({ error: "Nombre y contenido son requeridos" }, { status: 400 })
  }

  const plantilla = await prisma.plantillaInforme.create({
    data: {
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      contenido: contenido.trim(),
    },
  })
  return NextResponse.json(plantilla, { status: 201 })
}

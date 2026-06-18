import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/perfil — perfil editable (solo ADMIN)
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const perfil = await prisma.perfilProfesional.findUnique({ where: { id: "singleton" } })
  return NextResponse.json(perfil ?? {})
}

// PUT /api/perfil — crea/actualiza el singleton
export async function PUT(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const campos = ["nombre", "especialidad", "bio", "fotoUrl", "infoServicio", "disclaimer", "telefono", "whatsapp"] as const

  const data: Record<string, string | null> = {}
  for (const c of campos) {
    if (typeof body[c] === "string") data[c] = body[c].trim() || null
  }

  const perfil = await prisma.perfilProfesional.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  })
  return NextResponse.json(perfil)
}

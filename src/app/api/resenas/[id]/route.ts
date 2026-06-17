import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/resenas/[id] — la doctora (ADMIN) responde y/o alterna visibilidad
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

  const resena = await prisma.resena.findUnique({ where: { id } })
  if (!resena) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 })

  const data: { visible?: boolean; respuesta?: string | null; respondidoEn?: Date | null } = {}

  if (typeof body.visible === "boolean") {
    data.visible = body.visible
  }
  if (typeof body.respuesta === "string") {
    const txt = body.respuesta.trim()
    data.respuesta = txt || null
    data.respondidoEn = txt ? new Date() : null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 })
  }

  const updated = await prisma.resena.update({ where: { id }, data })
  return NextResponse.json(updated)
}

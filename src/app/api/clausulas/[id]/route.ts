import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/clausulas/[id] — editar cláusula (ADMIN)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { titulo, texto, orden, activo } = await req.json()

  const data: Record<string, unknown> = {}
  if (typeof titulo === "string") data.titulo = titulo.trim()
  if (typeof texto === "string") data.texto = texto.trim()
  if (typeof orden === "number") data.orden = orden
  if (typeof activo === "boolean") data.activo = activo

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 })
  }

  const clausula = await prisma.clausulaConsentimiento.update({ where: { id }, data })
  return NextResponse.json(clausula)
}

// DELETE /api/clausulas/[id] (ADMIN)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  await prisma.clausulaConsentimiento.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

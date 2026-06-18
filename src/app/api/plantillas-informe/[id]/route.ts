import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/plantillas-informe/[id] — edita una plantilla
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { nombre, descripcion, contenido, activo } = await req.json()

  const data: Record<string, unknown> = {}
  if (typeof nombre === "string") data.nombre = nombre.trim()
  if (typeof descripcion === "string") data.descripcion = descripcion.trim() || null
  if (typeof contenido === "string") data.contenido = contenido.trim()
  if (typeof activo === "boolean") data.activo = activo

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 })
  }

  const plantilla = await prisma.plantillaInforme.update({ where: { id }, data })
  return NextResponse.json(plantilla)
}

// DELETE /api/plantillas-informe/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  await prisma.plantillaInforme.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

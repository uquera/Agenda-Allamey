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
  const { titulo, descripcion, tipo, contenido, archivoUrl } = await req.json()

  const material = await prisma.material.update({
    where: { id },
    data: { titulo, descripcion, tipo, contenido, archivoUrl },
  })

  return NextResponse.json(material)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  await prisma.material.update({
    where: { id },
    data: { activo: false },
  })

  return NextResponse.json({ ok: true })
}

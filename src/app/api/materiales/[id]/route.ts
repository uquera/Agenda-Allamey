import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

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

  const material = await prisma.material.findUnique({ where: { id } })
  if (material?.archivoUrl?.startsWith("/api/files/")) {
    try {
      const filePath = path.join(
        process.cwd(), "public", "uploads",
        material.archivoUrl.replace("/api/files/", "")
      )
      if (existsSync(filePath)) await unlink(filePath)
    } catch { /* ignore */ }
  }

  await prisma.materialAsignado.deleteMany({ where: { materialId: id } })
  await prisma.material.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

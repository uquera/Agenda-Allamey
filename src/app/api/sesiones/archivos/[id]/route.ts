import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { unlink } from "fs/promises"
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
  const { privado } = await req.json()

  const archivo = await prisma.sesionArchivo.update({
    where: { id },
    data: { privado: Boolean(privado) },
  })
  return NextResponse.json(archivo)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const { id } = await params

  const archivo = await prisma.sesionArchivo.findUnique({ where: { id } })
  if (!archivo) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  try {
    const physicalPath = archivo.url.startsWith("/api/files/")
      ? path.join(process.cwd(), "public", "uploads", archivo.url.replace("/api/files/", ""))
      : path.join(process.cwd(), "public", archivo.url)
    await unlink(physicalPath)
  } catch { /* file may not exist */ }

  await prisma.sesionArchivo.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

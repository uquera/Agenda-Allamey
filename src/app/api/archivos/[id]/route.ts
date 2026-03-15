import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { unlink } from "fs/promises"
import path from "path"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  const archivo = await prisma.archivoPaciente.findUnique({ where: { id } })
  if (!archivo) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // Delete physical file if not a URL type
  if (archivo.tipo !== "URL") {
    try {
      const filePath = path.join(process.cwd(), "public", archivo.url)
      await unlink(filePath)
    } catch {
      // File may already be missing, continue
    }
  }

  await prisma.archivoPaciente.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

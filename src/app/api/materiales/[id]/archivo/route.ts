import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir, unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const { id } = await params

  const material = await prisma.material.findUnique({ where: { id } })
  if (!material) return NextResponse.json({ error: "Material no encontrado" }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 })

  // Remove old file if exists
  if (material.archivoUrl?.startsWith("/api/files/")) {
    try {
      const oldPath = path.join(
        process.cwd(), "public", "uploads",
        material.archivoUrl.replace("/api/files/", "")
      )
      if (existsSync(oldPath)) await unlink(oldPath)
    } catch { /* ignore */ }
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
  const uuid = crypto.randomUUID()
  const filename = `${uuid}.${ext}`

  const uploadDir = path.join(process.cwd(), "public", "uploads", "materiales", id)
  await mkdir(uploadDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  const archivoUrl = `/api/files/materiales/${id}/${filename}`

  await prisma.material.update({ where: { id }, data: { archivoUrl } })

  return NextResponse.json({ archivoUrl }, { status: 201 })
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

  const material = await prisma.material.findUnique({ where: { id } })
  if (!material) return NextResponse.json({ error: "Material no encontrado" }, { status: 404 })

  if (material.archivoUrl?.startsWith("/api/files/")) {
    try {
      const filePath = path.join(
        process.cwd(), "public", "uploads",
        material.archivoUrl.replace("/api/files/", "")
      )
      if (existsSync(filePath)) await unlink(filePath)
    } catch { /* ignore */ }
  }

  await prisma.material.update({ where: { id }, data: { archivoUrl: null } })
  return NextResponse.json({ ok: true })
}

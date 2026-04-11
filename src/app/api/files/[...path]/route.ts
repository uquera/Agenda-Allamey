import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { readFile } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { path: segments } = await params
  const uploadsRoot = path.join(process.cwd(), "public", "uploads")
  const filePath = path.join(uploadsRoot, ...segments)

  // Prevent path traversal
  if (!filePath.startsWith(uploadsRoot)) {
    return NextResponse.json({ error: "Ruta no permitida" }, { status: 403 })
  }

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
  }

  const ext = path.extname(filePath).toLowerCase().slice(1)
  const mimeMap: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    csv: "text/csv",
  }
  const contentType = mimeMap[ext] ?? "application/octet-stream"
  const buffer = await readFile(filePath)

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${segments.at(-1)}"`,
    },
  })
}

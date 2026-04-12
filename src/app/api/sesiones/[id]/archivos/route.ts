import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const { id } = await params
  const archivos = await prisma.sesionArchivo.findMany({
    where: { sesionId: id },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(archivos)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const { id } = await params

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 })
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
  const uuid = crypto.randomUUID()
  const filename = `${uuid}.${ext}`

  const uploadDir = path.join(process.cwd(), "public", "uploads", "sesiones", id)
  await mkdir(uploadDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  const url = `/api/files/sesiones/${id}/${filename}`
  const mime = file.type

  let tipo = "otro"
  if (mime.startsWith("image/")) tipo = "imagen"
  else if (mime.startsWith("audio/") || ["mp3","wav","ogg","m4a","aac","flac","wma"].includes(ext)) tipo = "audio"
  else if (mime.includes("spreadsheet") || mime.includes("excel") || ext === "xlsx" || ext === "xls" || ext === "csv") tipo = "excel"
  else if (mime.includes("word") || mime.includes("document") || ext === "docx" || ext === "doc") tipo = "word"
  else if (mime === "application/pdf" || ext === "pdf") tipo = "pdf"

  const privadoRaw = formData.get("privado") as string | null
  const privado = privadoRaw === "true"

  const archivo = await prisma.sesionArchivo.create({
    data: { sesionId: id, nombre: file.name, tipo, url, tamano: file.size, privado },
  })

  return NextResponse.json(archivo, { status: 201 })
}

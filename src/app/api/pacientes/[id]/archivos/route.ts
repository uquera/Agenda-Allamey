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
  const archivos = await prisma.archivoPaciente.findMany({
    where: { pacienteId: id },
    orderBy: { createdAt: "desc" },
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
  const contentType = req.headers.get("content-type") ?? ""

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const descripcion = (formData.get("descripcion") as string) || null

    if (!file) {
      return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
    const uuid = crypto.randomUUID()
    const filename = `${uuid}.${ext}`

    const uploadDir = path.join(process.cwd(), "public", "uploads", "pacientes", id)
    await mkdir(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadDir, filename), buffer)

    const url = `/uploads/pacientes/${id}/${filename}`
    const mime = file.type

    let tipo: "DOCUMENTO" | "IMAGEN" | "URL" | "OTRO" = "OTRO"
    if (mime.startsWith("image/")) {
      tipo = "IMAGEN"
    } else if (
      mime === "application/pdf" ||
      mime.includes("word") ||
      mime.includes("document") ||
      mime.includes("spreadsheet") ||
      mime.includes("presentation") ||
      mime.startsWith("text/")
    ) {
      tipo = "DOCUMENTO"
    }

    const archivo = await prisma.archivoPaciente.create({
      data: {
        pacienteId: id,
        nombre: file.name,
        tipo,
        url,
        tamano: file.size,
        descripcion,
      },
    })

    return NextResponse.json(archivo, { status: 201 })
  } else {
    const { url, nombre, descripcion } = await req.json()

    if (!url || !nombre) {
      return NextResponse.json({ error: "URL y nombre son requeridos" }, { status: 400 })
    }

    const archivo = await prisma.archivoPaciente.create({
      data: {
        pacienteId: id,
        nombre,
        tipo: "URL",
        url,
        descripcion: descripcion || null,
      },
    })

    return NextResponse.json(archivo, { status: 201 })
  }
}

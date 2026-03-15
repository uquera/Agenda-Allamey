import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { titulo, descripcion, tipo, contenido, archivoUrl } = await req.json()

  if (!titulo || !tipo) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
  }

  const material = await prisma.material.create({
    data: { titulo, descripcion, tipo, contenido, archivoUrl },
  })

  return NextResponse.json(material, { status: 201 })
}

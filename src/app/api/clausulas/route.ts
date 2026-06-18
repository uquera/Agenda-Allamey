import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/clausulas
//  - paciente/usuario autenticado: solo cláusulas activas (para firmar)
//  - admin con ?all=1: todas (para gestionar)
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const all = searchParams.get("all") === "1" && session.user.role === "ADMIN"

  const clausulas = await prisma.clausulaConsentimiento.findMany({
    where: all ? {} : { activo: true },
    orderBy: { orden: "asc" },
  })
  return NextResponse.json(clausulas)
}

// POST /api/clausulas — crear cláusula (ADMIN)
export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { titulo, texto, orden } = await req.json()
  if (!titulo?.trim() || !texto?.trim()) {
    return NextResponse.json({ error: "Título y texto son requeridos" }, { status: 400 })
  }

  // Si no se indica orden, va al final
  let ordenFinal = typeof orden === "number" ? orden : undefined
  if (ordenFinal === undefined) {
    const ultima = await prisma.clausulaConsentimiento.findFirst({ orderBy: { orden: "desc" } })
    ordenFinal = (ultima?.orden ?? -1) + 1
  }

  const clausula = await prisma.clausulaConsentimiento.create({
    data: { titulo: titulo.trim(), texto: texto.trim(), orden: ordenFinal },
  })
  return NextResponse.json(clausula, { status: 201 })
}

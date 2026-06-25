import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Lista pública de mensajes de despedida (los más recientes primero)
export async function GET() {
  const condolencias = await prisma.condolencia.findMany({
    where: { visible: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, nombre: true, mensaje: true, createdAt: true },
  })
  return NextResponse.json(condolencias)
}

// Cualquier visitante puede dejar su último adiós
export async function POST(req: Request) {
  let body: { nombre?: string; mensaje?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  const nombre = body.nombre?.trim()
  const mensaje = body.mensaje?.trim()

  if (!nombre || nombre.length < 2) {
    return NextResponse.json({ error: "Por favor escribe tu nombre" }, { status: 400 })
  }
  if (!mensaje || mensaje.length < 3) {
    return NextResponse.json({ error: "Por favor escribe un mensaje" }, { status: 400 })
  }

  const condolencia = await prisma.condolencia.create({
    data: {
      nombre: nombre.slice(0, 80),
      mensaje: mensaje.slice(0, 1000),
    },
    select: { id: true, nombre: true, mensaje: true, createdAt: true },
  })

  return NextResponse.json(condolencia, { status: 201 })
}

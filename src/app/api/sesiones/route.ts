import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { pacienteId, citaId, fechaSesion, titulo, tipoSesion } = await req.json()

  if (!pacienteId || !fechaSesion) {
    return NextResponse.json({ error: "Paciente y fecha son requeridos" }, { status: 400 })
  }

  const fechaValida = new Date(fechaSesion)
  if (isNaN(fechaValida.getTime())) {
    return NextResponse.json({ error: "Fecha de sesión inválida" }, { status: 400 })
  }

  const tiposValidos = ["INDIVIDUAL", "PAREJA", "GRUPAL"]
  if (tipoSesion && !tiposValidos.includes(tipoSesion)) {
    return NextResponse.json({ error: "Tipo de sesión inválido" }, { status: 400 })
  }

  const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } })
  if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

  try {
    const sesion = await prisma.sesionNota.create({
      data: {
        pacienteId,
        citaId: citaId || null,
        fechaSesion: fechaValida,
        titulo: titulo || "Resumen de sesión",
        tipoSesion: tipoSesion || "INDIVIDUAL",
        contenido: "",
        publicado: false,
      },
    })
    return NextResponse.json(sesion, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al crear la sesión" }, { status: 500 })
  }
}

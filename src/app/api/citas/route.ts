import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { enviarConfirmacionSolicitud, enviarNuevaSolicitudAlAdmin } from "@/lib/email"

// GET — listar citas (admin: todas, paciente: las suyas)
export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const estado = searchParams.get("estado")

  if (session.user.role === "ADMIN") {
    const citas = await prisma.cita.findMany({
      where: estado ? { estado: estado as "PENDIENTE" | "APROBADA" | "RECHAZADA" | "REAGENDADA" | "COMPLETADA" | "CANCELADA" } : undefined,
      include: {
        paciente: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { fecha: "asc" },
    })
    return NextResponse.json(citas)
  }

  // Paciente
  const paciente = await prisma.paciente.findUnique({
    where: { userId: session.user.id },
  })
  if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

  const citas = await prisma.cita.findMany({
    where: { pacienteId: paciente.id },
    orderBy: { fecha: "desc" },
  })
  return NextResponse.json(citas)
}

// POST — crear cita (admin: para cualquier paciente, aprobada directamente; paciente: solicitud propia)
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { fecha, modalidad, motivoConsulta, notasPaciente, notasAdmin, linkSesion, duracion } = body

  if (!fecha) return NextResponse.json({ error: "La fecha es requerida" }, { status: 400 })

  // ── Admin crea cita a nombre de un paciente ───────────────────────────────
  if (session.user.role === "ADMIN") {
    const { pacienteId } = body
    if (!pacienteId) return NextResponse.json({ error: "pacienteId es requerido" }, { status: 400 })

    const cita = await prisma.cita.create({
      data: {
        pacienteId,
        fecha: new Date(fecha),
        modalidad: modalidad || "PRESENCIAL",
        estado: "APROBADA",
        motivoConsulta: motivoConsulta || null,
        notasAdmin: notasAdmin || null,
        linkSesion: linkSesion || null,
        duracion: duracion || 60,
      },
    })

    return NextResponse.json(cita, { status: 201 })
  }

  // ── Paciente crea su propia solicitud ─────────────────────────────────────
  const paciente = await prisma.paciente.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  })
  if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

  const cita = await prisma.cita.create({
    data: {
      pacienteId: paciente.id,
      fecha: new Date(fecha),
      modalidad: modalidad || "PRESENCIAL",
      estado: "PENDIENTE",
      motivoConsulta,
      notasPaciente,
      duracion: duracion || 60,
    },
  })

  try {
    await enviarConfirmacionSolicitud(
      paciente.user.email,
      paciente.user.name || "Paciente",
      new Date(fecha)
    )
  } catch (err) {
    console.error("Error enviando email al paciente:", err)
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    enviarNuevaSolicitudAlAdmin(
      adminEmail,
      paciente.user.name || "Paciente",
      new Date(fecha),
      modalidad || "PRESENCIAL",
      motivoConsulta
    ).catch((err) => console.error("Error enviando notificación al admin:", err))
  }

  return NextResponse.json(cita, { status: 201 })
}

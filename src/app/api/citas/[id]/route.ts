import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  enviarAprobacionCita,
  enviarRechazoRcita,
  enviarInvitacionResena,
} from "@/lib/email"
import { BRAND } from "@/lib/brand"
import { randomUUID } from "crypto"
import { logAudit } from "@/lib/audit"

async function hayConflictoCita(fecha: Date, duracion: number, excludeId?: string): Promise<boolean> {
  const ventanaInicio = new Date(fecha.getTime() - 8 * 60 * 60 * 1000)
  const ventanaFin = new Date(fecha.getTime() + duracion * 60 * 1000)

  const citas = await prisma.cita.findMany({
    where: {
      estado: { notIn: ["RECHAZADA", "CANCELADA"] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      fecha: { gte: ventanaInicio, lte: ventanaFin },
    },
    select: { id: true, fecha: true, duracion: true },
  })

  const nuevoInicio = fecha.getTime()
  const nuevoFin = nuevoInicio + duracion * 60 * 1000

  return citas.some((c) => {
    const existInicio = c.fecha.getTime()
    const existFin = existInicio + c.duracion * 60 * 1000
    return nuevoInicio < existFin && existInicio < nuevoFin
  })
}

// PATCH — aprobar / rechazar / reagendar (solo admin)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { estado, notasAdmin, linkSesion, nuevaFecha } = body

  const cita = await prisma.cita.findUnique({
    where: { id },
    include: { paciente: { include: { user: true } } },
  })
  if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })

  if (nuevaFecha && await hayConflictoCita(new Date(nuevaFecha), cita.duracion, id)) {
    return NextResponse.json({ error: "Ya existe una cita en ese horario" }, { status: 409 })
  }

  const updateData: Record<string, unknown> = { estado, notasAdmin }
  if (linkSesion !== undefined) updateData.linkSesion = linkSesion
  if (nuevaFecha) updateData.fecha = new Date(nuevaFecha)
  if (estado === "REAGENDADA" && nuevaFecha) updateData.estado = "REAGENDADA"

  const citaActualizada = await prisma.cita.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.cita.update>[0]["data"],
  })

  // Auditoría: registrar cambio de estado
  if (estado && estado !== cita.estado) {
    logAudit({
      entidadTipo: "cita",
      entidadId: id,
      campo: "estado",
      valorAntes: cita.estado,
      valorDespues: estado,
      userId: session.user.id,
      userName: session.user.name ?? session.user.email ?? "Admin",
    })
  }

  const emailPaciente = cita.paciente.user.email
  const nombrePaciente = cita.paciente.user.name || "Paciente"
  const fechaCita = nuevaFecha ? new Date(nuevaFecha) : new Date(cita.fecha)

  try {
    if (estado === "APROBADA") {
      await enviarAprobacionCita(
        emailPaciente,
        nombrePaciente,
        fechaCita,
        cita.modalidad,
        linkSesion || cita.linkSesion
      )
    } else if (estado === "RECHAZADA") {
      await enviarRechazoRcita(emailPaciente, nombrePaciente, fechaCita, notasAdmin)
    } else if (estado === "REAGENDADA" && nuevaFecha) {
      await enviarAprobacionCita(
        emailPaciente,
        nombrePaciente,
        fechaCita,
        cita.modalidad,
        linkSesion || cita.linkSesion
      )
    } else if (estado === "COMPLETADA" && cita.estado !== "COMPLETADA") {
      // Generar token único e invitar al paciente a calificar la sesión (solo la primera vez)
      const token = randomUUID()
      await prisma.cita.update({ where: { id }, data: { resenaToken: token } })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
      const linkResena = `${appUrl}/resena/${token}`

      enviarInvitacionResena(emailPaciente, nombrePaciente, BRAND.doctorTitle, linkResena).catch((err) => {
        console.error("[resena] Error enviando email invitación:", err)
      })
    }
  } catch (err) {
    console.error("Error enviando email:", err)
  }

  return NextResponse.json(citaActualizada)
}

// DELETE — cancelar cita
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const cita = await prisma.cita.findUnique({ where: { id } })
  if (!cita) return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })

  if (!["PENDIENTE", "APROBADA"].includes(cita.estado)) {
    return NextResponse.json({ error: "Esta cita no puede cancelarse" }, { status: 400 })
  }

  if (session.user.role !== "ADMIN") {
    const paciente = await prisma.paciente.findUnique({ where: { userId: session.user.id } })
    if (!paciente || cita.pacienteId !== paciente.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }
    const msRestantes = new Date(cita.fecha).getTime() - Date.now()
    if (msRestantes < 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "No puedes cancelar con menos de 24 horas de antelación" },
        { status: 400 }
      )
    }
  }

  await prisma.cita.update({
    where: { id },
    data: { estado: "CANCELADA" },
  })

  logAudit({
    entidadTipo: "cita",
    entidadId: id,
    campo: "estado",
    valorAntes: cita.estado,
    valorDespues: "CANCELADA",
    userId: session.user.id,
    userName: session.user.name ?? session.user.email ?? "Usuario",
  })

  return NextResponse.json({ ok: true })
}

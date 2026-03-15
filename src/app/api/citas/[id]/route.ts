import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  enviarAprobacionCita,
  enviarRechazoRcita,
} from "@/lib/email"

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

  const updateData: Record<string, unknown> = { estado, notasAdmin }
  if (linkSesion !== undefined) updateData.linkSesion = linkSesion
  if (nuevaFecha) updateData.fecha = new Date(nuevaFecha)
  if (estado === "REAGENDADA" && nuevaFecha) updateData.estado = "REAGENDADA"

  const citaActualizada = await prisma.cita.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.cita.update>[0]["data"],
  })

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

  await prisma.cita.update({
    where: { id },
    data: { estado: "CANCELADA" },
  })

  return NextResponse.json({ ok: true })
}

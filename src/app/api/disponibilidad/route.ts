import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// DELETE — desactivar disponibilidad de un día
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const { diaSemana } = await req.json()
  await prisma.disponibilidad.deleteMany({ where: { diaSemana } })
  return NextResponse.json({ ok: true })
}

// GET — obtener slots disponibles para una fecha
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const fechaParam = searchParams.get("fecha")

  if (!fechaParam) {
    // Devolver configuración de disponibilidad semanal
    const disponibilidad = await prisma.disponibilidad.findMany({
      where: { activo: true },
      orderBy: { diaSemana: "asc" },
    })
    return NextResponse.json(disponibilidad)
  }

  const fecha = new Date(fechaParam)
  const diaSemana = fecha.getDay()

  // Obtener horario del día
  const horario = await prisma.disponibilidad.findFirst({
    where: { diaSemana, activo: true },
  })
  if (!horario) return NextResponse.json({ slots: [] })

  // Verificar bloqueos
  const inicioDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  const finDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000)

  const bloqueo = await prisma.bloqueoHorario.findFirst({
    where: {
      fecha: { gte: inicioDia, lt: finDia },
      todoElDia: true,
    },
  })
  if (bloqueo) return NextResponse.json({ slots: [], todosLosSlots: [] })

  // Bloqueos parciales del día
  const bloqueosParciales = await prisma.bloqueoHorario.findMany({
    where: { fecha: { gte: inicioDia, lt: finDia }, todoElDia: false },
    select: { horaInicio: true, horaFin: true, motivo: true },
  })

  // Citas ya agendadas ese día
  const citasDelDia = await prisma.cita.findMany({
    where: {
      fecha: { gte: inicioDia, lt: finDia },
      estado: { in: ["PENDIENTE", "APROBADA"] },
    },
    select: { fecha: true, duracion: true },
  })

  // Generar slots de 1 hora
  const slots: string[] = []
  const todosLosSlots: { hora: string; estado: "disponible" | "bloqueado" | "ocupado"; motivo?: string }[] = []
  const [hIni, mIni] = horario.horaInicio.split(":").map(Number)
  const [hFin, mFin] = horario.horaFin.split(":").map(Number)
  const inicio = hIni * 60 + mIni
  const fin = hFin * 60 + mFin

  for (let min = inicio; min + 60 <= fin; min += 60) {
    const hh = Math.floor(min / 60).toString().padStart(2, "0")
    const mm = (min % 60).toString().padStart(2, "0")
    const slotTime = `${hh}:${mm}`

    // Verificar bloqueo parcial
    const bloqueoMatch = bloqueosParciales.find((b) => {
      if (!b.horaInicio || !b.horaFin) return false
      const [bhi, bmi] = b.horaInicio.split(":").map(Number)
      const [bhf, bmf] = b.horaFin.split(":").map(Number)
      const bIni = bhi * 60 + bmi
      const bFin = bhf * 60 + bmf
      return min < bFin && min + 60 > bIni
    })
    if (bloqueoMatch) {
      todosLosSlots.push({ hora: slotTime, estado: "bloqueado", motivo: bloqueoMatch.motivo || undefined })
      continue
    }

    // Verificar cita ocupada
    const ocupado = citasDelDia.some((c) => {
      const citaMin = new Date(c.fecha).getHours() * 60 + new Date(c.fecha).getMinutes()
      return Math.abs(citaMin - min) < c.duracion
    })

    if (ocupado) {
      todosLosSlots.push({ hora: slotTime, estado: "ocupado" })
    } else {
      slots.push(slotTime)
      todosLosSlots.push({ hora: slotTime, estado: "disponible" })
    }
  }

  return NextResponse.json({ slots, todosLosSlots })
}

// POST — guardar disponibilidad semanal (solo admin)
export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { diaSemana, horaInicio, horaFin } = body

  // Upsert por día de semana
  await prisma.disponibilidad.deleteMany({ where: { diaSemana } })

  const disponibilidad = await prisma.disponibilidad.create({
    data: { diaSemana, horaInicio, horaFin, activo: true },
  })

  return NextResponse.json(disponibilidad, { status: 201 })
}

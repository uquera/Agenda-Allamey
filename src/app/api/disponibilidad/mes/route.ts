import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Devuelve { year, month (1-12), day, minutes } en zona horaria Santiago
function getSantiago(date: Date) {
  const str = date.toLocaleString("sv-SE", { timeZone: "America/Santiago" })
  // str = "2026-04-20 15:00:00"
  const [dateStr, timeStr] = str.split(" ")
  const [y, m, d] = dateStr.split("-").map(Number)
  const [h, min] = timeStr.split(":").map(Number)
  return { year: y, month: m, day: d, minutes: h * 60 + min }
}

// GET /api/disponibilidad/mes?year=2026&month=3
// Devuelve el estado de disponibilidad de cada día del mes
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))

  // Primer y último día del mes
  const inicio = new Date(year, month - 1, 1)
  const fin = new Date(year, month, 0) // último día del mes

  // 1. Horarios configurados por día de semana
  const disponibilidad = await prisma.disponibilidad.findMany({
    where: { activo: true },
    select: { diaSemana: true, horaInicio: true, horaFin: true },
  })
  const horarioPorDia: Record<number, { horaInicio: string; horaFin: string }> = {}
  for (const d of disponibilidad) {
    horarioPorDia[d.diaSemana] = { horaInicio: d.horaInicio, horaFin: d.horaFin }
  }

  // 2. Bloqueos del mes
  const bloqueos = await prisma.bloqueoHorario.findMany({
    where: {
      fecha: { gte: inicio, lte: new Date(year, month - 1, fin.getDate(), 23, 59, 59) },
    },
    select: { fecha: true, todoElDia: true, horaInicio: true, horaFin: true },
  })

  // 3. Citas aprobadas/pendientes del mes
  // Extendemos +5h al final para cubrir el fin del día Santiago (UTC-4/UTC-3)
  // El filtro por día exacto se hace en memoria usando getSantiago().
  const citas = await prisma.cita.findMany({
    where: {
      fecha: { gte: inicio, lte: new Date(year, month - 1, fin.getDate() + 1, 5, 0, 0) },
      estado: { in: ["PENDIENTE", "APROBADA"] },
    },
    select: { fecha: true, duracion: true },
  })

  // Calcular estado por día
  const resultado: Record<string, "disponible" | "bloqueado" | "sin_horario" | "completo"> = {}

  for (let dia = 1; dia <= fin.getDate(); dia++) {
    const fecha = new Date(year, month - 1, dia)
    const fechaStr = `${year}-${String(month).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
    const diaSemana = fecha.getDay()
    const horario = horarioPorDia[diaSemana]

    if (!horario) {
      resultado[fechaStr] = "sin_horario"
      continue
    }

    // Verificar bloqueo de todo el día
    const bloqueadoTodoDia = bloqueos.some((b) => {
      const bd = new Date(b.fecha)
      return bd.getFullYear() === year && bd.getMonth() === month - 1 && bd.getDate() === dia && b.todoElDia
    })
    if (bloqueadoTodoDia) {
      resultado[fechaStr] = "bloqueado"
      continue
    }

    // Calcular slots libres
    const [hIni, mIni] = horario.horaInicio.split(":").map(Number)
    const [hFin, mFin] = horario.horaFin.split(":").map(Number)
    const inicioMin = hIni * 60 + mIni
    const finMin = hFin * 60 + mFin

    // Bloqueos parciales del día
    const bloqueosParciales = bloqueos.filter((b) => {
      const bd = new Date(b.fecha)
      return bd.getFullYear() === year && bd.getMonth() === month - 1 && bd.getDate() === dia && !b.todoElDia
    })

    // Citas del día (comparar fecha en zona horaria Santiago, no UTC)
    const citasDia = citas.filter((c) => {
      const s = getSantiago(c.fecha)
      return s.year === year && s.month === month && s.day === dia
    })

    let slotsLibres = 0
    for (let min = inicioMin; min + 60 <= finMin; min += 60) {
      // Verificar bloqueo parcial
      const bloqueado = bloqueosParciales.some((b) => {
        if (!b.horaInicio || !b.horaFin) return false
        const [bhi, bmi] = b.horaInicio.split(":").map(Number)
        const [bhf, bmf] = b.horaFin.split(":").map(Number)
        const bIni = bhi * 60 + bmi
        const bFin = bhf * 60 + bmf
        return min < bFin && min + 60 > bIni
      })
      if (bloqueado) continue

      // Verificar cita ocupada (en zona horaria Santiago)
      const ocupado = citasDia.some((c) => {
        const citaMin = getSantiago(c.fecha).minutes
        return Math.abs(citaMin - min) < c.duracion
      })
      if (!ocupado) slotsLibres++
    }

    resultado[fechaStr] = slotsLibres > 0 ? "disponible" : "completo"
  }

  return NextResponse.json(resultado)
}

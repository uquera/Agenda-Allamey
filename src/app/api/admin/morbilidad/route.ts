import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  startOfYear, endOfYear,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  getYear, getMonth, getWeek,
  format,
} from "date-fns"
import { es } from "date-fns/locale"

function calcEdad(fechaNacimiento: Date): number {
  const hoy = new Date()
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear()
  const m = hoy.getMonth() - fechaNacimiento.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) edad--
  return edad
}

function rangoEtario(edad: number): string {
  if (edad <= 12) return "0-12"
  if (edad <= 17) return "13-17"
  if (edad <= 25) return "18-25"
  if (edad <= 35) return "26-35"
  if (edad <= 50) return "36-50"
  return "51+"
}

function contarOcurrencias(items: string[]): { label: string; count: number }[] {
  const mapa: Record<string, number> = {}
  for (const item of items) {
    const key = item.trim()
    if (key) mapa[key] = (mapa[key] ?? 0) + 1
  }
  return Object.entries(mapa)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }))
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get("periodo") ?? "month"
  const yearParam = parseInt(searchParams.get("year") ?? String(getYear(new Date())))
  const monthParam = parseInt(searchParams.get("month") ?? String(getMonth(new Date()) + 1)) - 1 // 0-indexed
  const weekParam = parseInt(searchParams.get("week") ?? String(getWeek(new Date())))

  // Calcular rango de fechas
  let startDate: Date
  let endDate: Date
  let periodoLabel: string

  if (periodo === "year") {
    const ref = new Date(yearParam, 0, 1)
    startDate = startOfYear(ref)
    endDate = endOfYear(ref)
    periodoLabel = String(yearParam)
  } else if (periodo === "week") {
    // Encontrar la fecha de inicio de la semana N del año dado
    const jan1 = new Date(yearParam, 0, 1)
    const dayOfWeek = jan1.getDay()
    const startOfFirstWeek = new Date(jan1)
    startOfFirstWeek.setDate(jan1.getDate() - dayOfWeek + 1)
    const weekStart = new Date(startOfFirstWeek)
    weekStart.setDate(startOfFirstWeek.getDate() + (weekParam - 1) * 7)
    startDate = startOfWeek(weekStart, { weekStartsOn: 1 })
    endDate = endOfWeek(weekStart, { weekStartsOn: 1 })
    periodoLabel = `Semana ${weekParam} · ${format(startDate, "d MMM", { locale: es })} – ${format(endDate, "d MMM yyyy", { locale: es })}`
  } else {
    // month (default)
    const ref = new Date(yearParam, monthParam, 1)
    startDate = startOfMonth(ref)
    endDate = endOfMonth(ref)
    periodoLabel = format(ref, "MMMM yyyy", { locale: es })
    periodoLabel = periodoLabel.charAt(0).toUpperCase() + periodoLabel.slice(1)
  }

  const sesiones = await prisma.sesionNota.findMany({
    where: {
      fechaSesion: { gte: startDate, lte: endDate },
    },
    select: {
      tipoSesion: true,
      cita: { select: { modalidad: true } },
      paciente: {
        select: {
          genero: true,
          fechaNacimiento: true,
          pais: true,
          direccion: true,
          cedula: true,
          anamnesis: {
            select: {
              expresionDiagnostica: true,
              patologia: true,
            },
          },
        },
      },
    },
  })

  // Agregaciones
  const porTipoSesion: Record<string, number> = { INDIVIDUAL: 0, PAREJA: 0, GRUPAL: 0 }
  const porModalidad: Record<string, number> = { PRESENCIAL: 0, ONLINE: 0, "Sin cita": 0 }
  const porSexo: Record<string, number> = {}
  const porRangoEtario: Record<string, number> = {
    "0-12": 0, "13-17": 0, "18-25": 0, "26-35": 0, "36-50": 0, "51+": 0,
  }
  const paises: string[] = []
  const expresiones: string[] = []
  const patologias: string[] = []
  let sinCedula = 0

  for (const s of sesiones) {
    // Tipo de sesión
    porTipoSesion[s.tipoSesion] = (porTipoSesion[s.tipoSesion] ?? 0) + 1

    // Modalidad de cita
    const mod = s.cita?.modalidad ?? null
    if (mod) {
      porModalidad[mod] = (porModalidad[mod] ?? 0) + 1
    } else {
      porModalidad["Sin cita"] = (porModalidad["Sin cita"] ?? 0) + 1
    }

    const p = s.paciente

    // Sexo/género
    const sexo = p.genero?.trim() || "Sin registrar"
    porSexo[sexo] = (porSexo[sexo] ?? 0) + 1

    // Edad
    if (p.fechaNacimiento) {
      const edad = calcEdad(new Date(p.fechaNacimiento))
      const rango = rangoEtario(edad)
      porRangoEtario[rango] = (porRangoEtario[rango] ?? 0) + 1
    } else {
      porRangoEtario["Sin registrar"] = (porRangoEtario["Sin registrar"] ?? 0) + 1
    }

    // País
    if (p.pais?.trim()) paises.push(p.pais.trim())

    // Cédula
    if (!p.cedula) sinCedula++

    // Expresión diagnóstica y patología (de la anamnesis)
    if (p.anamnesis?.expresionDiagnostica?.trim()) {
      expresiones.push(p.anamnesis.expresionDiagnostica.trim())
    }
    if (p.anamnesis?.patologia?.trim()) {
      patologias.push(p.anamnesis.patologia.trim())
    }
  }

  return NextResponse.json({
    totalSesiones: sesiones.length,
    periodo: {
      label: periodoLabel,
      tipo: periodo,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    porTipoSesion,
    porModalidad,
    porSexo: Object.entries(porSexo)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count })),
    porRangoEtario: Object.entries(porRangoEtario)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({ label, count })),
    porPais: contarOcurrencias(paises).slice(0, 10),
    topExpresionDiagnostica: contarOcurrencias(expresiones).slice(0, 10),
    topPatologia: contarOcurrencias(patologias).slice(0, 10),
    sinCedula,
  })
}

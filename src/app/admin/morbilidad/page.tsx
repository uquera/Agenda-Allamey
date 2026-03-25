import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  startOfYear, endOfYear,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  getYear, getMonth, getWeek,
  format,
} from "date-fns"
import { es } from "date-fns/locale"
import { BarChart2, Users, FileText, Globe, AlertCircle } from "lucide-react"
import MorbilidadFilters from "./MorbilidadFilters"

export const dynamic = "force-dynamic"

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Barra horizontal ──────────────────────────────────────────────────────────

function BarraHorizontal({
  label, count, max, color = "var(--brand)",
}: {
  label: string; count: number; max: number; color?: string
}) {
  const pct = max > 0 ? Math.max(Math.round((count / max) * 100), count > 0 ? 2 : 0) : 0
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span className="font-medium truncate max-w-[70%]">{label}</span>
        <span className="tabular-nums shrink-0 ml-2">{count}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// ── Barras verticales ─────────────────────────────────────────────────────────

function BarrasVerticales({
  datos, colores, altura = 110,
}: {
  datos: { label: string; count: number }[]
  colores: string[]
  altura?: number
}) {
  const max = Math.max(...datos.map(d => d.count), 1)
  return (
    <div>
      <div className="flex gap-2 items-end" style={{ height: `${altura}px` }}>
        {datos.map(({ label, count }, i) => {
          const pct = max > 0 ? Math.max((count / max) * 100, count > 0 ? 5 : 0) : 0
          return (
            <div
              key={label}
              className="flex flex-col items-center justify-end flex-1"
              style={{ height: "100%" }}
            >
              {count > 0 && (
                <span className="text-[10px] font-bold text-gray-700 mb-0.5 tabular-nums">{count}</span>
              )}
              <div
                style={{
                  height: `${pct}%`,
                  backgroundColor: colores[i % colores.length],
                  width: "100%",
                  maxWidth: "44px",
                  borderRadius: "4px 4px 0 0",
                  minHeight: count > 0 ? "4px" : "0",
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="border-t border-gray-100" />
      <div className="flex gap-2 mt-1.5">
        {datos.map(({ label }) => (
          <div key={label} className="flex-1 text-center">
            <span className="text-[10px] text-gray-500 leading-tight block">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Gráfico de torta / donut ──────────────────────────────────────────────────

const DONUT_R  = 42
const DONUT_CX = 60
const DONUT_CY = 60
const DONUT_SW = 18
const DONUT_C  = 2 * Math.PI * DONUT_R

function GraficoTorta({
  datos, colores,
}: {
  datos: { label: string; count: number }[]
  colores: string[]
}) {
  const total = datos.reduce((s, d) => s + d.count, 0)
  if (total === 0) {
    return <p className="text-xs text-gray-400 text-center py-6">Sin datos en este período</p>
  }

  let cumulative = 0
  const segments = datos
    .filter(d => d.count > 0)
    .map((d, i) => {
      const len = (d.count / total) * DONUT_C
      const seg = {
        ...d,
        len,
        offset: cumulative,
        color: colores[i % colores.length],
        pct: Math.round((d.count / total) * 100),
      }
      cumulative += len
      return seg
    })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="shrink-0">
        <svg width="120" height="120" viewBox="0 0 120 120">
          {/* Track */}
          <circle
            cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
            fill="none" stroke="#f3f4f6" strokeWidth={DONUT_SW}
          />
          {/* Segments — rotate -90° so first segment starts at 12 o'clock */}
          <g transform={`rotate(-90 ${DONUT_CX} ${DONUT_CY})`}>
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx={DONUT_CX} cy={DONUT_CY} r={DONUT_R}
                fill="none"
                stroke={seg.color}
                strokeWidth={DONUT_SW}
                strokeDasharray={`${seg.len} ${DONUT_C - seg.len}`}
                strokeDashoffset={-seg.offset}
              />
            ))}
          </g>
          {/* Total en el centro */}
          <text
            x={DONUT_CX} y={DONUT_CY - 6}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="16" fontWeight="bold" fill="#1f2937"
          >{total}</text>
          <text
            x={DONUT_CX} y={DONUT_CY + 11}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill="#9ca3af"
          >total</text>
        </svg>
      </div>

      {/* Leyenda */}
      <div className="flex flex-col gap-2 min-w-0">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs min-w-0">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600 truncate">{seg.label}</span>
            <span className="font-semibold text-gray-800 tabular-nums ml-auto pl-2">{seg.count}</span>
            <span className="text-gray-400 tabular-nums shrink-0">({seg.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MorbilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; year?: string; month?: string; week?: string }>
}) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const params = await searchParams
  const hoy = new Date()

  const periodo  = params.periodo ?? "month"
  const yearNum  = parseInt(params.year  ?? String(getYear(hoy)))
  const monthNum = parseInt(params.month ?? String(getMonth(hoy) + 1))
  const weekNum  = parseInt(params.week  ?? String(getWeek(hoy)))

  // ── Rango de fechas ────────────────────────────────────────────────────────
  let startDate: Date
  let endDate: Date
  let periodoLabel: string

  if (periodo === "year") {
    const ref = new Date(yearNum, 0, 1)
    startDate    = startOfYear(ref)
    endDate      = endOfYear(ref)
    periodoLabel = String(yearNum)
  } else if (periodo === "week") {
    const jan1 = new Date(yearNum, 0, 1)
    const weekStart = new Date(jan1)
    weekStart.setDate(jan1.getDate() + (weekNum - 1) * 7)
    startDate = startOfWeek(weekStart, { weekStartsOn: 1 })
    endDate   = endOfWeek(weekStart,   { weekStartsOn: 1 })
    periodoLabel = `Semana ${weekNum} · ${format(startDate, "d MMM", { locale: es })} – ${format(endDate, "d MMM yyyy", { locale: es })}`
  } else {
    const ref  = new Date(yearNum, monthNum - 1, 1)
    startDate  = startOfMonth(ref)
    endDate    = endOfMonth(ref)
    const lbl  = format(ref, "MMMM yyyy", { locale: es })
    periodoLabel = lbl.charAt(0).toUpperCase() + lbl.slice(1)
  }

  // ── Query ──────────────────────────────────────────────────────────────────
  const sesiones = await prisma.sesionNota.findMany({
    where: { fechaSesion: { gte: startDate, lte: endDate } },
    select: {
      tipoSesion: true,
      cita: { select: { modalidad: true } },
      paciente: {
        select: {
          genero: true,
          fechaNacimiento: true,
          pais: true,
          cedula: true,
          anamnesis: { select: { expresionDiagnostica: true, patologia: true } },
        },
      },
    },
  })

  // ── Agregaciones ───────────────────────────────────────────────────────────
  const porTipoSesion: Record<string, number> = { INDIVIDUAL: 0, PAREJA: 0, GRUPAL: 0 }
  const porModalidad:  Record<string, number> = { PRESENCIAL: 0, ONLINE: 0, "Sin cita": 0 }
  const porSexoRaw:    Record<string, number> = {}
  const etariosRaw:    Record<string, number> = {
    "0-12": 0, "13-17": 0, "18-25": 0, "26-35": 0, "36-50": 0, "51+": 0,
  }
  const paises:      string[] = []
  const expresiones: string[] = []
  const patologias:  string[] = []
  let sinCedula = 0

  for (const s of sesiones) {
    porTipoSesion[s.tipoSesion] = (porTipoSesion[s.tipoSesion] ?? 0) + 1

    const mod = s.cita?.modalidad ?? null
    porModalidad[mod ?? "Sin cita"] = (porModalidad[mod ?? "Sin cita"] ?? 0) + 1

    const p = s.paciente
    const sexo = p.genero?.trim() || "Sin registrar"
    porSexoRaw[sexo] = (porSexoRaw[sexo] ?? 0) + 1

    if (p.fechaNacimiento) {
      const rango = rangoEtario(calcEdad(new Date(p.fechaNacimiento)))
      etariosRaw[rango] = (etariosRaw[rango] ?? 0) + 1
    }

    if (p.pais?.trim()) paises.push(p.pais.trim())
    if (!p.cedula) sinCedula++

    if (p.anamnesis?.expresionDiagnostica?.trim()) expresiones.push(p.anamnesis.expresionDiagnostica.trim())
    if (p.anamnesis?.patologia?.trim())            patologias.push(p.anamnesis.patologia.trim())
  }

  const porSexo = Object.entries(porSexoRaw).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }))
  const porPais = contarOcurrencias(paises).slice(0, 8)
  const topExpr = contarOcurrencias(expresiones).slice(0, 8)
  const topPatol = contarOcurrencias(patologias).slice(0, 8)

  const maxPais  = Math.max(...porPais.map(x => x.count),   1)
  const maxExpr  = Math.max(...topExpr.map(x => x.count),   1)
  const maxPatol = Math.max(...topPatol.map(x => x.count),  1)

  const totalSesiones = sesiones.length

  // Datos para gráficos
  const datosTipo = [
    { label: "Individual", count: porTipoSesion.INDIVIDUAL },
    { label: "Pareja",     count: porTipoSesion.PAREJA },
    { label: "Grupal",     count: porTipoSesion.GRUPAL },
  ]
  const coloresTipo = ["var(--brand)", "#6366f1", "#10b981"]

  const datosModalidad = [
    { label: "Presencial", count: porModalidad.PRESENCIAL },
    { label: "Online",     count: porModalidad.ONLINE },
    ...(porModalidad["Sin cita"] > 0 ? [{ label: "Sin cita", count: porModalidad["Sin cita"] }] : []),
  ]
  const coloresModalidad = ["var(--brand)", "#6366f1", "#9ca3af"]

  const coloresSexo = ["var(--brand)", "#6366f1", "#10b981", "#f59e0b", "#9ca3af"]

  const datosEtario = (["0-12", "13-17", "18-25", "26-35", "36-50", "51+"] as const).map(rango => ({
    label: rango,
    count: etariosRaw[rango] ?? 0,
  }))
  const coloresEtario = ["#818cf8", "#6366f1", "#4f46e5", "#7c3aed", "#8b5cf6", "#a78bfa"]

  // Años disponibles
  const years = Array.from({ length: 5 }, (_, i) => getYear(hoy) - 4 + i).reverse()

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Encabezado + filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart2 size={20} style={{ color: "var(--brand)" }} />
            Morbilidad
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{periodoLabel}</p>
        </div>
        <div className="sm:ml-auto">
          <MorbilidadFilters
            periodo={periodo}
            year={yearNum}
            month={monthNum}
            week={weekNum}
            years={years}
          />
        </div>
      </div>

      {/* ── Tarjetas resumen ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total sesiones</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{totalSesiones}</p>
                <p className="text-xs text-gray-400 mt-0.5">{periodoLabel}</p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-light)" }}>
                <FileText size={20} style={{ color: "var(--brand)" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Por tipo de sesión</p>
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users size={16} className="text-blue-600" />
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              {(["INDIVIDUAL", "PAREJA", "GRUPAL"] as const).map((t) => (
                <div key={t} className="flex justify-between">
                  <span className="text-gray-500 capitalize">{t.charAt(0) + t.slice(1).toLowerCase()}</span>
                  <span className="font-semibold text-gray-700 tabular-nums">{porTipoSesion[t]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Por modalidad</p>
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <Globe size={16} className="text-green-600" />
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Presencial</span>
                <span className="font-semibold text-gray-700 tabular-nums">{porModalidad.PRESENCIAL}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Online</span>
                <span className="font-semibold text-gray-700 tabular-nums">{porModalidad.ONLINE}</span>
              </div>
              {porModalidad["Sin cita"] > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Sin cita</span>
                  <span className="font-semibold text-gray-400 tabular-nums">{porModalidad["Sin cita"]}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Sin cédula registrada</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{sinCedula}</p>
                <p className="text-xs text-gray-400 mt-0.5">pacientes en el período</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertCircle size={20} className="text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Tipo de sesión (barras verticales) + Modalidad (donut) ─────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800">Tipo de sesión</CardTitle>
          </CardHeader>
          <CardContent>
            {totalSesiones === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin datos en este período</p>
            ) : (
              <BarrasVerticales datos={datosTipo} colores={coloresTipo} altura={120} />
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800">Modalidad de atención</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoTorta datos={datosModalidad} colores={coloresModalidad} />
          </CardContent>
        </Card>
      </div>

      {/* ── Sexo (donut) + Rango etario (barras verticales) ─────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800">Distribución por sexo</CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoTorta datos={porSexo} colores={coloresSexo} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-800">Distribución por rango etario</CardTitle>
          </CardHeader>
          <CardContent>
            {datosEtario.every(d => d.count === 0) ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin edades registradas</p>
            ) : (
              <BarrasVerticales datos={datosEtario} colores={coloresEtario} altura={120} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Expresión diagnóstica + Patología (barras horizontales) ────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Top expresiones diagnósticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topExpr.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin expresiones diagnósticas registradas</p>
            ) : (
              topExpr.map(({ label, count }) => (
                <BarraHorizontal key={label} label={label} count={count} max={maxExpr} color="#10b981" />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Top patologías</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPatol.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Sin patologías registradas</p>
            ) : (
              topPatol.map(({ label, count }) => (
                <BarraHorizontal key={label} label={label} count={count} max={maxPatol} color="#f59e0b" />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Distribución geográfica (barras horizontales) ────────────────────── */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Distribución geográfica (por país)</CardTitle>
        </CardHeader>
        <CardContent>
          {porPais.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Sin países registrados</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {porPais.map(({ label, count }) => (
                <BarraHorizontal key={label} label={label} count={count} max={maxPais} color="#8b5cf6" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

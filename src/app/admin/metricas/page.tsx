import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { es } from "date-fns/locale"
import {
  TrendingUp, DollarSign, Clock, CalendarCheck, CalendarX,
  Users, Star, Percent,
} from "lucide-react"

export const dynamic = "force-dynamic"

function fmtMoneda(monto: number, moneda: string) {
  const n = monto.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return `${moneda === "USD" ? "$" : "Bs "}${n}`
}

export default async function MetricasPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const ahora = new Date()
  const inicioMes = startOfMonth(ahora)
  const finMes = endOfMonth(ahora)

  const [
    pagosMes,
    pagosPendientes,
    citasMes,
    pacientesActivos,
    resenas,
  ] = await Promise.all([
    prisma.pago.findMany({
      where: { estado: "PAGADO", fechaPago: { gte: inicioMes, lte: finMes } },
      select: { monto: true, moneda: true },
    }),
    prisma.pago.findMany({
      where: { estado: "PENDIENTE" },
      select: { monto: true, moneda: true },
    }),
    prisma.cita.findMany({
      where: { fecha: { gte: inicioMes, lte: finMes } },
      select: { estado: true },
    }),
    prisma.paciente.count({ where: { activo: true } }),
    prisma.resena.findMany({ select: { calificacion: true } }),
  ])

  // Ingresos del mes por moneda
  const ingresosPorMoneda = pagosMes.reduce<Record<string, number>>((acc, p) => {
    acc[p.moneda] = (acc[p.moneda] ?? 0) + p.monto
    return acc
  }, {})

  const pendientesPorMoneda = pagosPendientes.reduce<Record<string, number>>((acc, p) => {
    acc[p.moneda] = (acc[p.moneda] ?? 0) + p.monto
    return acc
  }, {})

  // Citas
  const completadas = citasMes.filter((c) => c.estado === "COMPLETADA").length
  const canceladas = citasMes.filter((c) => c.estado === "CANCELADA" || c.estado === "RECHAZADA").length
  const totalCitas = citasMes.length
  const finalizadas = completadas + canceladas
  const tasaAsistencia = finalizadas > 0 ? Math.round((completadas / finalizadas) * 100) : 0

  // Reseñas
  const totalResenas = resenas.length
  const promedioResenas = totalResenas > 0
    ? resenas.reduce((s, r) => s + r.calificacion, 0) / totalResenas
    : 0

  const ingresosStr = Object.entries(ingresosPorMoneda).map(([m, v]) => fmtMoneda(v, m)).join(" · ") || "—"
  const pendientesStr = Object.entries(pendientesPorMoneda).map(([m, v]) => fmtMoneda(v, m)).join(" · ") || "—"

  const cards = [
    { label: "Ingresos del mes", value: ingresosStr, icon: DollarSign, color: "#059669" },
    { label: "Por cobrar (pendiente)", value: pendientesStr, icon: Clock, color: "#d97706" },
    { label: "Citas completadas (mes)", value: completadas, icon: CalendarCheck, color: "#2563eb" },
    { label: "Citas canceladas (mes)", value: canceladas, icon: CalendarX, color: "#dc2626" },
    { label: "Tasa de asistencia", value: `${tasaAsistencia}%`, icon: Percent, color: "var(--brand)" },
    { label: "Pacientes activos", value: pacientesActivos, icon: Users, color: "#7c3aed" },
    { label: "Calificación promedio", value: totalResenas > 0 ? `${promedioResenas.toFixed(1)} ★` : "—", icon: Star, color: "#f59e0b" },
    { label: "Citas totales (mes)", value: totalCitas, icon: TrendingUp, color: "#0891b2" },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp size={24} style={{ color: "var(--brand)" }} /> Métricas
        </h1>
        <p className="text-sm text-gray-500 mt-1 capitalize">
          {format(ahora, "MMMM yyyy", { locale: es })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Card key={c.label} className="border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${c.color}1a` }}>
                <c.icon size={18} style={{ color: c.color }} />
              </div>
              <p className="text-xl font-bold text-gray-900 leading-tight">{c.value}</p>
              <p className="text-xs text-gray-500 mt-1">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700">Resumen del mes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-1.5">
          <p>• Se agendaron <strong>{totalCitas}</strong> citas este mes.</p>
          <p>• <strong>{completadas}</strong> completadas y <strong>{canceladas}</strong> canceladas/rechazadas.</p>
          <p>• Ingresos confirmados: <strong>{ingresosStr}</strong>. Pendiente de cobro: <strong>{pendientesStr}</strong>.</p>
          {totalResenas > 0 && (
            <p>• Calificación promedio de <strong>{promedioResenas.toFixed(1)}</strong> sobre {totalResenas} {totalResenas === 1 ? "reseña" : "reseñas"}.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CalendarDays, Clock, CheckCircle, DollarSign, TrendingUp, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export default async function AdminDashboard() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000)
  const inicioMes    = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const inicioMesSig = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)
  const inicioMesAnt = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const inicio6Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1)

  const [
    totalPacientes,
    citasPendientes,
    citasHoy,
    citasProximas,
    ultimosPacientes,
    pagosMesActual,
    pagosMesAnterior,
    pagosPendientes,
    pagos6Meses,
    sesionesCompletadasMes,
  ] = await Promise.all([
    prisma.paciente.count({ where: { activo: true } }),
    prisma.cita.count({ where: { estado: "PENDIENTE" } }),
    prisma.cita.count({ where: { fecha: { gte: inicioHoy, lt: finHoy } } }),
    prisma.cita.findMany({
      where: {
        fecha: { gte: hoy },
        estado: { in: ["APROBADA", "PENDIENTE"] },
      },
      orderBy: { fecha: "asc" },
      take: 5,
      include: { paciente: { include: { user: true } } },
    }),
    prisma.paciente.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { user: true },
    }),
    prisma.pago.findMany({
      where: { estado: "PAGADO", fechaPago: { gte: inicioMes, lt: inicioMesSig } },
      select: { monto: true, moneda: true, metodoPago: true },
    }),
    prisma.pago.findMany({
      where: { estado: "PAGADO", fechaPago: { gte: inicioMesAnt, lt: inicioMes } },
      select: { monto: true, moneda: true },
    }),
    prisma.pago.findMany({
      where: { estado: "PENDIENTE" },
      select: { monto: true, moneda: true },
    }),
    prisma.pago.findMany({
      where: { estado: "PAGADO", moneda: "USD", fechaPago: { gte: inicio6Meses } },
      select: { monto: true, fechaPago: true },
    }),
    prisma.cita.count({
      where: { estado: "COMPLETADA", fecha: { gte: inicioMes, lt: inicioMesSig } },
    }),
  ])

  // ── Cálculos financieros ───────────────────────────────────────────────────
  const ingresosUSDMes    = pagosMesActual.filter(p => p.moneda === "USD").reduce((s, p) => s + p.monto, 0)
  const ingresosBSMes     = pagosMesActual.filter(p => p.moneda === "BS").reduce((s, p) => s + p.monto, 0)
  const ingresosUSDMesAnt = pagosMesAnterior.filter(p => p.moneda === "USD").reduce((s, p) => s + p.monto, 0)
  const cambioPct         = ingresosUSDMesAnt > 0
    ? Math.round(((ingresosUSDMes - ingresosUSDMesAnt) / ingresosUSDMesAnt) * 100)
    : null
  const pendientesCount = pagosPendientes.length
  const pendientesUSD   = pagosPendientes.filter(p => p.moneda === "USD").reduce((s, p) => s + p.monto, 0)

  const metodoPagoLabel: Record<string, string> = {
    ZELLE: "Zelle", PAGO_MOVIL: "Pago Móvil", BINANCE: "Binance",
    TRANSFERENCIA_USD: "Transfer. USD", TRANSFERENCIA_BS: "Transfer. Bs", EFECTIVO: "Efectivo",
  }
  const desgloseMap: Record<string, number> = {}
  for (const p of pagosMesActual) {
    desgloseMap[p.metodoPago] = (desgloseMap[p.metodoPago] ?? 0) + p.monto
  }
  const desglose = Object.entries(desgloseMap)
    .map(([metodo, total]) => ({ metodo, label: metodoPagoLabel[metodo] ?? metodo, total }))
    .sort((a, b) => b.total - a.total)
  const maxMetodo = Math.max(...desglose.map(d => d.total), 1)

  const datosMeses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i, 1)
    return { year: d.getFullYear(), month: d.getMonth(), label: format(d, "MMM", { locale: es }), total: 0, esMesActual: i === 5 }
  })
  for (const p of pagos6Meses) {
    if (!p.fechaPago) continue
    const d = new Date(p.fechaPago)
    const idx = datosMeses.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth())
    if (idx !== -1) datosMeses[idx].total += p.monto
  }
  const maxIngresos = Math.max(...datosMeses.map(m => m.total), 1)

  const estadoLabel: Record<string, string> = {
    PENDIENTE: "Pendiente",
    APROBADA: "Aprobada",
    RECHAZADA: "Rechazada",
    REAGENDADA: "Reagendada",
    COMPLETADA: "Completada",
    CANCELADA: "Cancelada",
  }

  const estadoColor: Record<string, string> = {
    PENDIENTE: "bg-amber-100 text-amber-700",
    APROBADA: "bg-green-100 text-green-700",
    RECHAZADA: "bg-red-100 text-red-700",
    REAGENDADA: "bg-blue-100 text-blue-700",
    COMPLETADA: "bg-gray-100 text-gray-600",
    CANCELADA: "bg-gray-100 text-gray-600",
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Pacientes activos
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{totalPacientes}</p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-light)" }}>
                <Users size={20} style={{ color: "var(--brand)" }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Citas hoy
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{citasHoy}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                <CalendarDays size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Solicitudes pendientes
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{citasPendientes}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Por aprobar
                </p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{citasPendientes}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Próximas citas */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Próximas citas
                </CardTitle>
                <Link
                  href="/admin/agenda"
                  className="text-xs font-medium hover:underline"
                  style={{ color: "var(--brand)" }}
                >
                  Ver agenda →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {citasProximas.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No hay citas próximas
                </p>
              ) : (
                <div className="space-y-3">
                  {citasProximas.map((cita) => (
                    <div
                      key={cita.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="w-2 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: cita.estado === "PENDIENTE" ? "#f59e0b" : "var(--brand)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {cita.paciente.user.name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {format(new Date(cita.fecha), "EEEE d MMM · HH:mm", { locale: es })} ·{" "}
                          {cita.modalidad === "ONLINE" ? "Online" : "Presencial"}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${estadoColor[cita.estado]}`}
                      >
                        {estadoLabel[cita.estado]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Últimos pacientes */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Pacientes recientes
                </CardTitle>
                <Link
                  href="/admin/pacientes"
                  className="text-xs font-medium hover:underline"
                  style={{ color: "var(--brand)" }}
                >
                  Ver todos →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {ultimosPacientes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Sin pacientes aún
                </p>
              ) : (
                <div className="space-y-3">
                  {ultimosPacientes.map((p) => {
                    const initials = p.user.name
                      ? p.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                      : "??"
                    return (
                      <Link
                        key={p.id}
                        href={`/admin/pacientes/${p.id}`}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: "var(--brand)" }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {p.user.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{p.user.email}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Métricas financieras ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Métricas financieras — {format(hoy, "MMMM yyyy", { locale: es })}
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Ingresos USD */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-light)" }}>
                  <DollarSign size={20} style={{ color: "var(--brand)" }} />
                </div>
                {cambioPct !== null && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cambioPct >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {cambioPct >= 0 ? "+" : ""}{cambioPct}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-800">${ingresosUSDMes.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Ingresos USD este mes</p>
            </CardContent>
          </Card>

          {/* Ingresos Bs */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                  <DollarSign size={20} className="text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">Bs. {ingresosBSMes.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Ingresos Bs este mes</p>
            </CardContent>
          </Card>

          {/* Por cobrar */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center">
                  <AlertCircle size={20} className="text-orange-500" />
                </div>
                {pendientesCount > 0 && (
                  <span className="text-xs font-semibold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                    {pendientesCount} pagos
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-800">${pendientesUSD.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">Por cobrar (USD)</p>
            </CardContent>
          </Card>

          {/* Sesiones completadas */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{sesionesCompletadasMes}</p>
              <p className="text-xs text-gray-500 mt-1">Sesiones completadas este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfica + desglose */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Gráfica de barras */}
          <div className="xl:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-0">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Ingresos USD — últimos 6 meses
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-end gap-2 h-36">
                  {datosMeses.map((mes) => (
                    <div key={`${mes.year}-${mes.month}`} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-medium" style={{ color: mes.esMesActual ? "var(--brand)" : "#aaa" }}>
                        {mes.total > 0 ? `$${mes.total.toFixed(0)}` : "—"}
                      </span>
                      <div
                        className="w-full rounded-t-sm"
                        style={{
                          height: `${Math.max((mes.total / maxIngresos) * 88, mes.total > 0 ? 6 : 2)}px`,
                          backgroundColor: mes.esMesActual ? "var(--brand)" : "#f0d0d4",
                          transition: "height 0.3s",
                        }}
                      />
                      <span className="text-[10px] text-gray-400 capitalize">{mes.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desglose por método */}
          <div>
            <Card className="border-0 shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-800">Métodos de pago</CardTitle>
                <p className="text-xs text-gray-400">Mes actual</p>
              </CardHeader>
              <CardContent>
                {desglose.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Sin pagos registrados este mes</p>
                ) : (
                  <div className="space-y-3">
                    {desglose.map(({ metodo, label, total }) => (
                      <div key={metodo}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span className="font-medium">{label}</span>
                          <span className="tabular-nums">${total.toFixed(2)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.round((total / maxMetodo) * 100)}%`, backgroundColor: "var(--brand)" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

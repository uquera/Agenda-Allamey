"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CreditCard, Plus, CheckCircle, Loader2, DollarSign, Clock, ChevronDown, ChevronUp, Layers } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

interface Pago {
  id: string
  monto: number
  moneda: string
  metodoPago: string
  estado: string
  referencia?: string | null
  notas?: string | null
  fechaPago?: string | null
  createdAt: string
  paciente: { nombre: string }
  cita?: { fecha: string } | null
  codigoPaciente?: string | null
  planCuotasId?: string | null
  numeroCuota?: number | null
}

interface PlanCuotas {
  id: string
  montoTotal: number
  moneda: string
  numeroCuotas: number
  descripcion?: string | null
  createdAt: string
  paciente: { nombre: string }
  cuotas: Pago[]
}

interface Props {
  pagos: Pago[]
  planes: PlanCuotas[]
  pacientes: { id: string; nombre: string; codigo?: string | null }[]
  resumen: { totalCobradoUSD: number; pagosPendientes: number }
}

const metodolabel: Record<string, string> = {
  ZELLE: "Zelle",
  PAGO_MOVIL: "Pago Móvil",
  BINANCE: "Binance",
  TRANSFERENCIA_USD: "Transferencia USD",
  TRANSFERENCIA_BS: "Transferencia Bs.",
  EFECTIVO: "Efectivo",
}

const estadoColor: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-700",
  PAGADO: "bg-green-100 text-green-700",
  CANCELADO: "bg-gray-100 text-gray-500",
}

export default function PagosManager({ pagos, planes, pacientes, resumen }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<"pagos" | "cuotas">("pagos")
  const [modalNuevo, setModalNuevo] = useState(false)
  const [tipoPago, setTipoPago] = useState<"unico" | "cuotas">("unico")
  const [loading, setLoading] = useState(false)
  const [planesExpandidos, setPlanesExpandidos] = useState<Set<string>>(new Set())

  const [formUnico, setFormUnico] = useState({
    pacienteId: "", monto: "", moneda: "USD", metodoPago: "ZELLE", referencia: "", notas: "",
  })
  const [formCuotas, setFormCuotas] = useState({
    pacienteId: "", montoTotal: "", moneda: "USD", numeroCuotas: "2", metodoPago: "ZELLE", descripcion: "",
  })

  const pagosSueltos = pagos.filter((p) => !p.planCuotasId)

  const montoCuota = formCuotas.montoTotal && formCuotas.numeroCuotas
    ? (parseFloat(formCuotas.montoTotal) / parseInt(formCuotas.numeroCuotas)).toFixed(2)
    : null

  async function marcarPagado(id: string) {
    try {
      await fetch(`/api/pagos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "PAGADO", fechaPago: new Date().toISOString() }),
      })
      toast.success("Pago marcado como recibido")
      router.refresh()
    } catch {
      toast.error("Error al actualizar")
    }
  }

  async function crearPagoUnico() {
    if (!formUnico.pacienteId || !formUnico.monto) return toast.error("Completa todos los campos")
    setLoading(true)
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formUnico, monto: parseFloat(formUnico.monto) }),
      })
      if (!res.ok) throw new Error()
      toast.success("Pago registrado")
      setModalNuevo(false)
      setFormUnico({ pacienteId: "", monto: "", moneda: "USD", metodoPago: "ZELLE", referencia: "", notas: "" })
      router.refresh()
    } catch {
      toast.error("Error al registrar el pago")
    } finally {
      setLoading(false)
    }
  }

  async function crearPlanCuotas() {
    if (!formCuotas.pacienteId || !formCuotas.montoTotal) return toast.error("Completa todos los campos")
    setLoading(true)
    try {
      const res = await fetch("/api/pagos/cuotas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteId: formCuotas.pacienteId,
          montoTotal: parseFloat(formCuotas.montoTotal),
          moneda: formCuotas.moneda,
          numeroCuotas: parseInt(formCuotas.numeroCuotas),
          metodoPago: formCuotas.metodoPago,
          descripcion: formCuotas.descripcion || null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Plan de ${formCuotas.numeroCuotas} cuotas creado`)
      setModalNuevo(false)
      setFormCuotas({ pacienteId: "", montoTotal: "", moneda: "USD", numeroCuotas: "2", metodoPago: "ZELLE", descripcion: "" })
      setTab("cuotas")
      router.refresh()
    } catch {
      toast.error("Error al crear el plan de cuotas")
    } finally {
      setLoading(false)
    }
  }

  function togglePlan(id: string) {
    setPlanesExpandidos((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Pagos</h1>
            <p className="text-sm text-gray-500 mt-1">Registro de cobros y pagos pendientes</p>
          </div>
          <Button
            className="text-white h-9"
            style={{ backgroundColor: "var(--brand)" }}
            onClick={() => setModalNuevo(true)}
          >
            <Plus size={16} className="mr-2" />
            Registrar pago
          </Button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <DollarSign size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Total cobrado (USD)</p>
                <p className="text-2xl font-bold text-gray-800">${resumen.totalCobradoUSD.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Pagos pendientes</p>
                <p className="text-2xl font-bold text-gray-800">{resumen.pagosPendientes}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {([["pagos", "Pagos sueltos"], ["cuotas", "Planes de cuotas"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB: Pagos sueltos */}
        {tab === "pagos" && (
          pagosSueltos.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400">No hay pagos sueltos registrados</p>
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Paciente", "Monto", "Método", "Fecha", "Estado", ""].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagosSueltos.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{p.paciente.nombre}</p>
                          {p.codigoPaciente && <p className="text-xs text-gray-400 font-mono">{p.codigoPaciente}</p>}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {p.moneda === "USD" ? "$" : "Bs."} {p.monto.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{metodolabel[p.metodoPago]}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {p.fechaPago
                            ? format(new Date(p.fechaPago), "d MMM yyyy", { locale: es })
                            : format(new Date(p.createdAt), "d MMM yyyy", { locale: es })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoColor[p.estado]}`}>
                            {p.estado === "PENDIENTE" ? "Pendiente" : p.estado === "PAGADO" ? "Pagado" : "Cancelado"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {p.estado === "PENDIENTE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => marcarPagado(p.id)}
                            >
                              <CheckCircle size={12} className="mr-1" />
                              Marcar pagado
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )
        )}

        {/* TAB: Planes de cuotas */}
        {tab === "cuotas" && (
          planes.length === 0 ? (
            <div className="text-center py-16">
              <Layers size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 mb-2">No hay planes de cuotas registrados</p>
              <Button size="sm" variant="outline" onClick={() => { setTipoPago("cuotas"); setModalNuevo(true) }}>
                Crear plan de cuotas
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {planes.map((plan) => {
                const pagadas = plan.cuotas.filter((c) => c.estado === "PAGADO").length
                const pct = Math.round((pagadas / plan.numeroCuotas) * 100)
                const expandido = planesExpandidos.has(plan.id)
                const pendiente = plan.cuotas.find((c) => c.estado === "PENDIENTE")

                return (
                  <Card key={plan.id} className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <button
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        onClick={() => togglePlan(plan.id)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                          <Layers size={16} className="text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-800">{plan.paciente.nombre}</p>
                            {plan.descripcion && (
                              <span className="text-xs text-gray-400 truncate">— {plan.descripcion}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: pct === 100 ? "#16a34a" : "var(--brand)",
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 shrink-0">
                              {pagadas}/{plan.numeroCuotas} cuotas
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-gray-800">
                            {plan.moneda === "USD" ? "$" : "Bs."} {plan.montoTotal.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(plan.montoTotal / plan.numeroCuotas).toFixed(2)} c/u
                          </p>
                        </div>
                        {expandido
                          ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                          : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                      </button>

                      {!expandido && pendiente && (
                        <div className="px-4 pb-3 flex items-center justify-between">
                          <span className="text-xs text-amber-600 font-medium">
                            Cuota {pendiente.numeroCuota} pendiente · {plan.moneda === "USD" ? "$" : "Bs."}{pendiente.monto.toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs text-green-600 border-green-200 hover:bg-green-50"
                            onClick={(e) => { e.stopPropagation(); marcarPagado(pendiente.id) }}
                          >
                            <CheckCircle size={11} className="mr-1" />
                            Cobrar
                          </Button>
                        </div>
                      )}

                      {expandido && (
                        <div className="border-t border-gray-100">
                          {plan.cuotas.map((cuota) => (
                            <div
                              key={cuota.id}
                              className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50"
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                cuota.estado === "PAGADO" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                {cuota.numeroCuota}
                              </div>
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {plan.moneda === "USD" ? "$" : "Bs."} {cuota.monto.toFixed(2)}
                                </span>
                                {cuota.referencia && (
                                  <span className="text-xs text-gray-400 ml-2">Ref: {cuota.referencia}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {cuota.fechaPago && (
                                  <span className="text-xs text-gray-400">
                                    {format(new Date(cuota.fechaPago), "d MMM yyyy", { locale: es })}
                                  </span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColor[cuota.estado]}`}>
                                  {cuota.estado === "PAGADO" ? "Pagada" : "Pendiente"}
                                </span>
                                {cuota.estado === "PENDIENTE" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={() => marcarPagado(cuota.id)}
                                  >
                                    <CheckCircle size={11} className="mr-1" />
                                    Cobrar
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )
        )}
      </div>

      <Dialog open={modalNuevo} onOpenChange={(open) => { setModalNuevo(open); if (!open) setTipoPago("unico") }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>

          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {([["unico", "Pago único"], ["cuotas", "Plan de cuotas"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTipoPago(key)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tipoPago === key ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tipoPago === "unico" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Paciente</Label>
                <Select value={formUnico.pacienteId} onValueChange={(v) => v && setFormUnico({ ...formUnico, pacienteId: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar paciente..." /></SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}{p.codigo ? ` — ${p.codigo}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Monto</Label>
                  <Input type="number" placeholder="0.00" value={formUnico.monto}
                    onChange={(e) => setFormUnico({ ...formUnico, monto: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Moneda</Label>
                  <Select value={formUnico.moneda} onValueChange={(v) => v && setFormUnico({ ...formUnico, moneda: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="BS">Bolívares (Bs.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Método de pago</Label>
                <Select value={formUnico.metodoPago} onValueChange={(v) => v && setFormUnico({ ...formUnico, metodoPago: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(metodolabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">N° de referencia <span className="text-gray-400">(opcional)</span></Label>
                <Input placeholder="Ej: #123456789" value={formUnico.referencia}
                  onChange={(e) => setFormUnico({ ...formUnico, referencia: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Notas <span className="text-gray-400">(opcional)</span></Label>
                <Textarea placeholder="Observaciones..." value={formUnico.notas}
                  onChange={(e) => setFormUnico({ ...formUnico, notas: e.target.value })} rows={2} className="resize-none text-sm" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setModalNuevo(false)} className="flex-1 h-9">Cancelar</Button>
                <Button onClick={crearPagoUnico} disabled={loading || !formUnico.pacienteId || !formUnico.monto}
                  className="flex-1 h-9 text-white" style={{ backgroundColor: "var(--brand)" }}>
                  {loading && <Loader2 size={14} className="animate-spin mr-1" />}
                  Registrar
                </Button>
              </div>
            </div>
          )}

          {tipoPago === "cuotas" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">Paciente</Label>
                <Select value={formCuotas.pacienteId} onValueChange={(v) => v && setFormCuotas({ ...formCuotas, pacienteId: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar paciente..." /></SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre}{p.codigo ? ` — ${p.codigo}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Monto total</Label>
                  <Input type="number" placeholder="0.00" value={formCuotas.montoTotal}
                    onChange={(e) => setFormCuotas({ ...formCuotas, montoTotal: e.target.value })} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Moneda</Label>
                  <Select value={formCuotas.moneda} onValueChange={(v) => v && setFormCuotas({ ...formCuotas, moneda: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="BS">Bolívares (Bs.)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Número de cuotas</Label>
                  <Select value={formCuotas.numeroCuotas} onValueChange={(v) => v && setFormCuotas({ ...formCuotas, numeroCuotas: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2,3,4,5,6,8,10,12].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} cuotas</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Monto por cuota</Label>
                  <div className="h-9 px-3 flex items-center bg-gray-50 border border-gray-200 rounded-md text-sm font-semibold text-gray-700">
                    {montoCuota ? `${formCuotas.moneda === "USD" ? "$" : "Bs."} ${montoCuota}` : "—"}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Método de pago</Label>
                <Select value={formCuotas.metodoPago} onValueChange={(v) => v && setFormCuotas({ ...formCuotas, metodoPago: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(metodolabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Descripción <span className="text-gray-400">(opcional)</span></Label>
                <Input placeholder="Ej: Terapia mensual — paquete 3 meses" value={formCuotas.descripcion}
                  onChange={(e) => setFormCuotas({ ...formCuotas, descripcion: e.target.value })} className="h-9" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setModalNuevo(false)} className="flex-1 h-9">Cancelar</Button>
                <Button onClick={crearPlanCuotas} disabled={loading || !formCuotas.pacienteId || !formCuotas.montoTotal}
                  className="flex-1 h-9 text-white" style={{ backgroundColor: "var(--brand)" }}>
                  {loading && <Loader2 size={14} className="animate-spin mr-1" />}
                  Crear plan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

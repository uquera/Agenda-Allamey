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
import { Badge } from "@/components/ui/badge"
import { CreditCard, Plus, CheckCircle, Loader2, DollarSign, Clock } from "lucide-react"
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
}

interface Props {
  pagos: Pago[]
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

export default function PagosManager({ pagos, pacientes, resumen }: Props) {
  const router = useRouter()
  const [modalNuevo, setModalNuevo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    pacienteId: "",
    monto: "",
    moneda: "USD",
    metodoPago: "ZELLE",
    referencia: "",
    notas: "",
  })

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

  async function crearPago() {
    if (!form.pacienteId || !form.monto) return toast.error("Completa todos los campos")
    setLoading(true)
    try {
      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          monto: parseFloat(form.monto),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Pago registrado")
      setModalNuevo(false)
      setForm({ pacienteId: "", monto: "", moneda: "USD", metodoPago: "ZELLE", referencia: "", notas: "" })
      router.refresh()
    } catch {
      toast.error("Error al registrar el pago")
    } finally {
      setLoading(false)
    }
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
            style={{ backgroundColor: "#8B1A2C" }}
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
                <p className="text-2xl font-bold text-gray-800">
                  ${resumen.totalCobradoUSD.toFixed(2)}
                </p>
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

        {pagos.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 mb-4">No hay pagos registrados aún</p>
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Paciente
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Monto
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Método
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Fecha
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => (
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
        )}
      </div>

      {/* Modal nuevo pago */}
      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Paciente</Label>
              <Select value={form.pacienteId} onValueChange={(v) => v && setForm({ ...form, pacienteId: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}{p.codigo ? ` — ${p.codigo}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Monto</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Moneda</Label>
                <Select value={form.moneda} onValueChange={(v) => v && setForm({ ...form, moneda: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="BS">Bolívares (Bs.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Método de pago</Label>
              <Select value={form.metodoPago} onValueChange={(v) => v && setForm({ ...form, metodoPago: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(metodolabel).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">N° de referencia <span className="text-gray-400">(opcional)</span></Label>
              <Input
                placeholder="Ej: #123456789"
                value={form.referencia}
                onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Notas <span className="text-gray-400">(opcional)</span></Label>
              <Textarea
                placeholder="Observaciones..."
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setModalNuevo(false)} className="flex-1 h-9">
                Cancelar
              </Button>
              <Button
                onClick={crearPago}
                disabled={loading || !form.pacienteId || !form.monto}
                className="flex-1 h-9 text-white"
                style={{ backgroundColor: "#8B1A2C" }}
              >
                {loading && <Loader2 size={14} className="animate-spin mr-1" />}
                Registrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

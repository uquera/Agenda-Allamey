import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard } from "lucide-react"
import PagosManager from "@/components/admin/PagosManager"

export const dynamic = "force-dynamic"

export default async function PagosPage() {
  const pagos = await prisma.pago.findMany({
    include: {
      paciente: { include: { user: { select: { name: true } } } },
      cita: { select: { fecha: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const pacientes = await prisma.paciente.findMany({
    where: { activo: true },
    include: { user: { select: { name: true } } },
  })

  const totalCobrado = pagos
    .filter((p) => p.estado === "PAGADO" && p.moneda === "USD")
    .reduce((sum, p) => sum + p.monto, 0)

  const pendientes = pagos.filter((p) => p.estado === "PENDIENTE").length

  return (
    <PagosManager
      pagos={pagos.map((p) => ({
        id: p.id,
        monto: p.monto,
        moneda: p.moneda,
        metodoPago: p.metodoPago,
        estado: p.estado,
        referencia: p.referencia,
        notas: p.notas,
        fechaPago: p.fechaPago?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        paciente: { nombre: p.paciente.user.name || "Paciente" },
        codigoPaciente: p.paciente.codigo,
        cita: p.cita ? { fecha: p.cita.fecha.toISOString() } : null,
      }))}
      pacientes={pacientes.map((p) => ({ id: p.id, nombre: p.user.name || "Paciente", codigo: p.codigo }))}
      resumen={{ totalCobradoUSD: totalCobrado, pagosPendientes: pendientes }}
    />
  )
}

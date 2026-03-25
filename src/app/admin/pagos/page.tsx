import { prisma } from "@/lib/prisma"
import PagosManager from "@/components/admin/PagosManager"

export const dynamic = "force-dynamic"

export default async function PagosPage() {
  const [pagos, pacientes, planes] = await Promise.all([
    prisma.pago.findMany({
      include: {
        paciente: { include: { user: { select: { name: true } } } },
        cita: { select: { fecha: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.paciente.findMany({
      where: { activo: true },
      include: { user: { select: { name: true } } },
    }),
    prisma.planCuotas.findMany({
      include: {
        paciente: { include: { user: { select: { name: true } } } },
        cuotas: { orderBy: { numeroCuota: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

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
        planCuotasId: p.planCuotasId,
        numeroCuota: p.numeroCuota,
      }))}
      planes={planes.map((pl) => ({
        id: pl.id,
        montoTotal: pl.montoTotal,
        moneda: pl.moneda,
        numeroCuotas: pl.numeroCuotas,
        descripcion: pl.descripcion,
        createdAt: pl.createdAt.toISOString(),
        paciente: { nombre: pl.paciente.user.name || "Paciente" },
        cuotas: pl.cuotas.map((c) => ({
          id: c.id,
          monto: c.monto,
          moneda: c.moneda,
          metodoPago: c.metodoPago,
          estado: c.estado,
          referencia: c.referencia,
          notas: c.notas,
          fechaPago: c.fechaPago?.toISOString() ?? null,
          createdAt: c.createdAt.toISOString(),
          paciente: { nombre: pl.paciente.user.name || "Paciente" },
          planCuotasId: c.planCuotasId,
          numeroCuota: c.numeroCuota,
        })),
      }))}
      pacientes={pacientes.map((p) => ({ id: p.id, nombre: p.user.name || "Paciente", codigo: p.codigo }))}
      resumen={{ totalCobradoUSD: totalCobrado, pagosPendientes: pendientes }}
    />
  )
}

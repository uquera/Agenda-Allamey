import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { enviarConfirmacionPago } from "@/lib/email"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const existe = await prisma.pago.findUnique({ where: { id } })
  if (!existe) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })

  // Whitelist de campos actualizables para evitar mass assignment
  const { estado, referencia, notas, fechaPago, monto, metodoPago } = body
  const updateData: Record<string, unknown> = {}
  if (estado !== undefined) updateData.estado = estado
  if (referencia !== undefined) updateData.referencia = referencia
  if (notas !== undefined) updateData.notas = notas
  if (fechaPago !== undefined) updateData.fechaPago = new Date(fechaPago)
  if (monto !== undefined) updateData.monto = parseFloat(monto)
  if (metodoPago !== undefined) updateData.metodoPago = metodoPago

  const pago = await prisma.pago.update({
    where: { id },
    data: updateData,
    include: {
      paciente: {
        include: { user: true },
      },
    },
  })

  if (body.estado === "PAGADO") {
    try {
      await enviarConfirmacionPago(
        pago.paciente.user.email!,
        pago.paciente.user.name ?? "Paciente",
        pago.monto,
        pago.moneda,
        pago.metodoPago,
        pago.referencia,
        pago.fechaPago
      )
    } catch (err) {
      console.error("Error enviando email de confirmación de pago:", err)
    }
  }

  return NextResponse.json(pago)
}

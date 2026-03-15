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

  const pago = await prisma.pago.update({
    where: { id },
    data: body,
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

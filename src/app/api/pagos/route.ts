import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { pacienteId, monto, moneda, metodoPago, referencia, notas, citaId } = await req.json()

  const pago = await prisma.pago.create({
    data: {
      pacienteId,
      monto: parseFloat(monto),
      moneda: moneda || "USD",
      metodoPago,
      referencia,
      notas,
      citaId: citaId || null,
      estado: "PENDIENTE",
    },
  })

  return NextResponse.json(pago, { status: 201 })
}

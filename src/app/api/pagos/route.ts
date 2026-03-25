import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { pacienteId, monto, moneda, metodoPago, referencia, notas, citaId } = await req.json()

  if (!pacienteId || monto === undefined || monto === null || !metodoPago) {
    return NextResponse.json({ error: "pacienteId, monto y metodoPago son requeridos" }, { status: 400 })
  }

  const montoNum = parseFloat(monto)
  if (isNaN(montoNum) || montoNum <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
  }

  const metodosValidos = ["ZELLE", "PAGO_MOVIL", "BINANCE", "TRANSFERENCIA_USD", "TRANSFERENCIA_BS", "EFECTIVO"]
  if (!metodosValidos.includes(metodoPago)) {
    return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 })
  }

  try {
    const pago = await prisma.pago.create({
      data: {
        pacienteId,
        monto: montoNum,
        moneda: moneda || "USD",
        metodoPago,
        referencia: referencia || null,
        notas: notas || null,
        citaId: citaId || null,
        estado: "PENDIENTE",
      },
    })
    return NextResponse.json(pago, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al registrar el pago" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { pacienteId, montoTotal, moneda, numeroCuotas, descripcion, metodoPago } = await req.json()

  if (!pacienteId || !montoTotal || !numeroCuotas || !metodoPago) {
    return NextResponse.json(
      { error: "pacienteId, montoTotal, numeroCuotas y metodoPago son requeridos" },
      { status: 400 }
    )
  }

  const total = parseFloat(montoTotal)
  const n = parseInt(numeroCuotas)

  if (isNaN(total) || total <= 0) {
    return NextResponse.json({ error: "Monto inválido" }, { status: 400 })
  }
  if (isNaN(n) || n < 2 || n > 24) {
    return NextResponse.json({ error: "Número de cuotas debe estar entre 2 y 24" }, { status: 400 })
  }

  // Distribuir el monto: las primeras cuotas llevan el redondeo si hay decimales
  const montoPorCuota = Math.floor((total / n) * 100) / 100
  const diferencia = Math.round((total - montoPorCuota * n) * 100) / 100

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const plan = await tx.planCuotas.create({
        data: {
          pacienteId,
          montoTotal: total,
          moneda: moneda || "USD",
          numeroCuotas: n,
          descripcion: descripcion || null,
        },
      })

      const cuotas = []
      for (let i = 1; i <= n; i++) {
        const monto = i === 1 ? montoPorCuota + diferencia : montoPorCuota
        const cuota = await tx.pago.create({
          data: {
            pacienteId,
            planCuotasId: plan.id,
            numeroCuota: i,
            monto,
            moneda: moneda || "USD",
            metodoPago,
            estado: "PENDIENTE",
          },
        })
        cuotas.push(cuota)
      }

      return { plan, cuotas }
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al crear el plan de cuotas" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const pacienteId = searchParams.get("pacienteId")

  const planes = await prisma.planCuotas.findMany({
    where: pacienteId ? { pacienteId } : undefined,
    include: {
      paciente: { include: { user: { select: { name: true } } } },
      cuotas: { orderBy: { numeroCuota: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(planes)
}

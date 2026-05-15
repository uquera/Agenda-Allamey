import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function autenticar(req: NextRequest) {
  const key = req.headers.get("x-master-key")
  return key === process.env.GOBERNANZA_MASTER_KEY
}

export async function POST(req: NextRequest) {
  if (!autenticar(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { monto, moneda, periodoInicio, periodoFin, notas } = body

  const lic = await prisma.licencia.findFirst()
  if (!lic) return NextResponse.json({ error: "Licencia no existe" }, { status: 404 })

  const pago = await prisma.pagoLicencia.create({
    data: {
      licenciaId: lic.id,
      monto,
      moneda: moneda ?? "CLP",
      periodoInicio: new Date(periodoInicio),
      periodoFin: new Date(periodoFin),
      notas: notas ?? null,
    },
  })

  return NextResponse.json(pago, { status: 201 })
}

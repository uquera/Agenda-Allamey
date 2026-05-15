import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function autenticar(req: NextRequest) {
  const key = req.headers.get("x-master-key")
  return key === process.env.GOBERNANZA_MASTER_KEY
}

export async function GET(req: NextRequest) {
  if (!autenticar(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const lic = await prisma.licencia.findFirst({ include: { pagos: true } })
  if (!lic) return NextResponse.json({ existe: false })

  const diasRestantes = Math.ceil((lic.fechaVencimiento.getTime() - Date.now()) / 86_400_000)
  return NextResponse.json({ ...lic, diasRestantes })
}

export async function PATCH(req: NextRequest) {
  if (!autenticar(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { fechaVencimiento, suspendida, plan, notasAdmin } = body

  const lic = await prisma.licencia.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      fechaVencimiento: new Date(fechaVencimiento),
      suspendida: suspendida ?? false,
      plan: plan ?? "BASICO",
      notasAdmin: notasAdmin ?? null,
    },
    update: {
      ...(fechaVencimiento && { fechaVencimiento: new Date(fechaVencimiento) }),
      ...(suspendida !== undefined && { suspendida }),
      ...(plan && { plan }),
      ...(notasAdmin !== undefined && { notasAdmin }),
    },
  })

  return NextResponse.json(lic)
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const paciente = await prisma.paciente.findUnique({
    where: { userId: session.user.id },
    include: { consentimiento: true },
  })

  if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

  return NextResponse.json(paciente.consentimiento ?? { firmado: false })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const paciente = await prisma.paciente.findUnique({ where: { userId: session.user.id } })
  if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

  const { firma } = await req.json()

  const headersList = await headers()
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0] ||
    headersList.get("x-real-ip") ||
    "desconocida"

  const consentimiento = await prisma.consentimientoInformado.upsert({
    where: { pacienteId: paciente.id },
    create: {
      pacienteId: paciente.id,
      firmado: true,
      fechaFirma: new Date(),
      ipAddress,
      firma: firma || null,
    },
    update: {
      firmado: true,
      fechaFirma: new Date(),
      ipAddress,
      firma: firma || null,
    },
  })

  return NextResponse.json(consentimiento)
}

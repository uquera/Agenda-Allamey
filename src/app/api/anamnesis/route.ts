import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { FIXED_KEYS, DEFAULT_CONFIG } from "@/lib/anamnesis-config"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "PACIENTE") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const paciente = await prisma.paciente.findUnique({ where: { userId: session.user.id } })
  if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

  const body = await req.json()

  // Separar campos fijos de custom
  const fixedData: Record<string, string> = {}
  const camposExtra: Record<string, string> = {}

  const adminOnlyKeys = new Set(
    Object.entries(DEFAULT_CONFIG.campos)
      .filter(([, cfg]) => cfg.adminOnly)
      .map(([k]) => k)
  )

  for (const [key, value] of Object.entries(body)) {
    if (key === "camposExtra") continue
    if (adminOnlyKeys.has(key)) continue
    if ((FIXED_KEYS as readonly string[]).includes(key)) {
      fixedData[key] = value as string
    }
  }

  if (body.camposExtra && typeof body.camposExtra === "object") {
    for (const [key, value] of Object.entries(body.camposExtra)) {
      camposExtra[key] = value as string
    }
  }

  const data = {
    ...fixedData,
    camposExtra: Object.keys(camposExtra).length > 0 ? camposExtra : undefined,
    completado: true,
  }

  const anamnesis = await prisma.anamnesis.upsert({
    where: { pacienteId: paciente.id },
    update: data,
    create: { pacienteId: paciente.id, ...data },
  })

  return NextResponse.json(anamnesis)
}

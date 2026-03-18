import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { mergeConfig, AnamnesisConfigData } from "@/lib/anamnesis-config"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const stored = await prisma.configAnamnesis.findUnique({ where: { id: "singleton" } })
  const config = mergeConfig(stored?.campos as AnamnesisConfigData | null)
  return NextResponse.json(config)
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const campos = await req.json()

  const config = await prisma.configAnamnesis.upsert({
    where: { id: "singleton" },
    update: { campos },
    create: { id: "singleton", campos },
  })

  return NextResponse.json(config)
}

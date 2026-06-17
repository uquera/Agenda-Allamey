import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/ia-config — instrucciones globales de IA de la doctora
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { iaInstrucciones: true, iaEjemplo: true },
  })
  return NextResponse.json({
    iaInstrucciones: user?.iaInstrucciones ?? "",
    iaEjemplo: user?.iaEjemplo ?? "",
  })
}

// PUT /api/admin/ia-config
export async function PUT(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { iaInstrucciones, iaEjemplo } = await req.json()

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      iaInstrucciones: typeof iaInstrucciones === "string" ? iaInstrucciones.trim() || null : undefined,
      iaEjemplo: typeof iaEjemplo === "string" ? iaEjemplo.trim() || null : undefined,
    },
  })
  return NextResponse.json({ ok: true })
}

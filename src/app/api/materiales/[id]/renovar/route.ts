import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  await prisma.materialAsignado.updateMany({
    where: { materialId: id },
    data: { visto: false, fechaVisto: null },
  })

  return NextResponse.json({ ok: true })
}

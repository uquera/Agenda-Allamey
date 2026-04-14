import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const existe = await prisma.planCuotas.findUnique({ where: { id } })
  if (!existe) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })

  await prisma.pago.deleteMany({ where: { planCuotasId: id } })
  await prisma.planCuotas.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { name, email, password, activo } = await req.json()

  if (!name || !email) {
    return NextResponse.json({ error: "El nombre y correo son obligatorios" }, { status: 400 })
  }

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: { user: true }
  })

  if (!paciente) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
  }

  // Verificar si el nuevo correo pertenece a otro usuario
  if (email !== paciente.user.email) {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: "El correo electrónico ya está en uso por otra cuenta" }, { status: 400 })
    }
  }

  const updateUserData: any = { name, email }

  if (password && password.trim().length > 0) {
    updateUserData.password = await bcrypt.hash(password, 10)
  }

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: paciente.userId },
        data: updateUserData
      }),
      prisma.paciente.update({
        where: { id },
        data: { activo }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating account:", error)
    return NextResponse.json({ error: "Ocurrió un error al actualizar la cuenta" }, { status: 500 })
  }
}

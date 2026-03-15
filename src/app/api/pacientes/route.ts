import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { name, email, password, telefono } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Faltan campos obligatorios: nombre, email y contraseña" }, { status: 400 })
  }

  // Verificar si el correo ya existe
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: "El correo electrónico ya está en uso" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "PACIENTE",
        paciente: {
          create: {
            telefono: telefono || null,
          }
        }
      },
      include: {
        paciente: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error creating patient:", error)
    return NextResponse.json({ error: "Ocurrió un error al crear el paciente" }, { status: 500 })
  }
}

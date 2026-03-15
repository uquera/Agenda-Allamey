import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { name, email, password, telefono } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const existe = await prisma.user.findUnique({ where: { email } })
    if (existe) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: "PACIENTE",
        paciente: {
          create: {
            telefono: telefono || null,
          },
        },
      },
    })

    return NextResponse.json({ id: user.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

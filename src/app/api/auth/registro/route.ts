import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { enviarBienvenidaPaciente } from "@/lib/email"

async function generarCodigoPaciente(): Promise<string> {
  const year = new Date().getFullYear()
  const ultimo = await prisma.paciente.findFirst({
    where: { codigo: { startsWith: `PAC-${year}-` } },
    orderBy: { codigo: "desc" },
  })
  const siguiente = ultimo ? parseInt(ultimo.codigo!.split("-")[2]) + 1 : 1
  return `PAC-${year}-${String(siguiente).padStart(4, "0")}`
}

export async function POST(req: Request) {
  try {
    const {
      name, email, password, telefono,
      fechaNacimiento, genero, ocupacion,
      direccion, pais, quienRemite, primeraConsulta, motivoConsulta,
    } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const existe = await prisma.user.findUnique({ where: { email } })
    if (existe) {
      return NextResponse.json({ error: "Este correo ya está registrado" }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 10)
    const codigo = await generarCodigoPaciente()

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        role: "PACIENTE",
        paciente: {
          create: {
            codigo,
            telefono: telefono || null,
            fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
            genero: genero || null,
            ocupacion: ocupacion || null,
            direccion: direccion || null,
            pais: pais || null,
            quienRemite: quienRemite || null,
            primeraConsulta: primeraConsulta ?? true,
            motivoConsulta: motivoConsulta || null,
          },
        },
      },
    })

    // Enviar correo de bienvenida (no bloquea la respuesta)
    enviarBienvenidaPaciente(email, name).catch(() => {})

    return NextResponse.json({ id: user.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

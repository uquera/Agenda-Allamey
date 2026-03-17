import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function generarCodigoPaciente(): Promise<string> {
  const year = new Date().getFullYear()
  const ultimo = await prisma.paciente.findFirst({
    where: { codigo: { startsWith: `PAC-${year}-` } },
    orderBy: { codigo: "desc" },
  })
  const siguiente = ultimo
    ? parseInt(ultimo.codigo!.split("-")[2]) + 1
    : 1
  return `PAC-${year}-${String(siguiente).padStart(4, "0")}`
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const {
    name, email, password, telefono,
    fechaNacimiento, genero, ocupacion,
    direccion, pais, quienRemite, primeraConsulta, motivoConsulta,
  } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Faltan campos obligatorios: nombre, email y contraseña" }, { status: 400 })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: "El correo electrónico ya está en uso" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const codigo = await generarCodigoPaciente()

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
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
          }
        }
      },
      include: { paciente: true }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error creating patient:", error)
    return NextResponse.json({ error: "Ocurrió un error al crear el paciente" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validarClave } from "@/lib/password"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { token, clave } = await req.json()

    if (!token || !clave) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const error = validarClave(clave)
    if (error) return NextResponse.json({ error }, { status: 400 })

    const registro = await prisma.passwordResetToken.findUnique({ where: { token } })

    if (!registro || registro.usado) {
      return NextResponse.json({ error: "El enlace no es válido o ya fue utilizado" }, { status: 400 })
    }

    if (new Date() > registro.expires) {
      return NextResponse.json({ error: "El enlace ha expirado. Solicita uno nuevo." }, { status: 400 })
    }

    const hash = await bcrypt.hash(clave, 12)

    await prisma.user.update({
      where: { email: registro.email },
      data: { password: hash },
    })

    await prisma.passwordResetToken.update({
      where: { token },
      data: { usado: true },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("reset-password error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

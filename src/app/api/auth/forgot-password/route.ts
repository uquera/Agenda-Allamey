import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { enviarRecuperacionClave } from "@/lib/email"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })

    // Siempre responder igual para no revelar si el email existe
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    // Invalidar tokens anteriores del mismo email
    await prisma.passwordResetToken.updateMany({
      where: { email, usado: false },
      data: { usado: true },
    })

    // Crear nuevo token — expira en 1 hora
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: { email, token, expires },
    })

    const linkReset = `${process.env.NEXT_PUBLIC_APP_URL}/restablecer-clave?token=${token}`
    const nombre = user.name ?? email.split("@")[0]

    await enviarRecuperacionClave(email, nombre, linkReset)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("forgot-password error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

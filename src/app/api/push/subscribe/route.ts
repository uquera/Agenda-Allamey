import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// POST /api/push/subscribe — registra/actualiza la suscripción push del usuario
export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const sub = await req.json()
  const endpoint = sub?.endpoint
  const p256dh = sub?.keys?.p256dh
  const auth_ = sub?.keys?.auth
  if (!endpoint || !p256dh || !auth_) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 })
  }

  const userAgent = req.headers.get("user-agent") ?? undefined

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: session.user.id, p256dh, auth: auth_, userAgent },
    create: { userId: session.user.id, endpoint, p256dh, auth: auth_, userAgent },
  })

  return NextResponse.json({ ok: true })
}

// DELETE /api/push/subscribe — elimina la suscripción (al desactivar)
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { endpoint } = await req.json().catch(() => ({}))
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } })
  }
  return NextResponse.json({ ok: true })
}

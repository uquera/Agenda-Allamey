import webpush from "web-push"
import { prisma } from "@/lib/prisma"

let configurado = false

function configurar(): boolean {
  if (configurado) return true
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com"
  if (!pub || !priv) return false
  webpush.setVapidDetails(subject, pub, priv)
  configurado = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  requireInteraction?: boolean
}

/** Envía una notificación push a todas las suscripciones de un usuario. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!configurar()) {
    console.warn("[push] VAPID no configurado; se omite el envío")
    return 0
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } })
  let enviados = 0

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload)
        )
        enviados++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        // 404/410 = suscripción expirada → eliminarla
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {})
        } else {
          console.error("[push] Error enviando notificación:", err)
        }
      }
    })
  )

  return enviados
}

/** Envía una notificación a todos los ADMIN (la doctora). */
export async function sendPushToAdmins(payload: PushPayload): Promise<number> {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
  let total = 0
  for (const a of admins) total += await sendPushToUser(a.id, payload)
  return total
}

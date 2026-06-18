import { prisma } from "@/lib/prisma"
import { enviarRecordatorio24h, enviarRecordatorio2h } from "@/lib/email"

/**
 * Envía recordatorios 24h y 2h para las citas APROBADAS dentro de cada ventana.
 * Idempotente: usa los flags recordatorio24h / recordatorio2h para no repetir.
 * Pensado para invocarse periódicamente (cron del sistema cada ~15 min) vía
 * /api/cron/recordatorios.
 */
export async function procesarRecordatorios(): Promise<{ enviados24h: number; enviados2h: number }> {
  const ahora = new Date()
  const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
  const en2h = new Date(ahora.getTime() + 2 * 60 * 60 * 1000)

  // ── 24 horas ────────────────────────────────────────────────────────────────
  const citas24h = await prisma.cita.findMany({
    where: {
      estado: "APROBADA",
      recordatorio24h: false,
      fecha: { gt: ahora, lte: en24h },
    },
    include: { paciente: { include: { user: true } } },
  })

  let enviados24h = 0
  for (const cita of citas24h) {
    const email = cita.paciente.user.email
    if (!email) continue
    try {
      await enviarRecordatorio24h(
        email,
        cita.paciente.user.name ?? "Paciente",
        cita.fecha,
        cita.modalidad,
        cita.linkSesion
      )
      await prisma.cita.update({ where: { id: cita.id }, data: { recordatorio24h: true } })
      enviados24h++
    } catch (err) {
      console.error(`[recordatorios] Error 24h cita ${cita.id}:`, err)
    }
  }

  // ── 2 horas ─────────────────────────────────────────────────────────────────
  const citas2h = await prisma.cita.findMany({
    where: {
      estado: "APROBADA",
      recordatorio2h: false,
      fecha: { gt: ahora, lte: en2h },
    },
    include: { paciente: { include: { user: true } } },
  })

  let enviados2h = 0
  for (const cita of citas2h) {
    const email = cita.paciente.user.email
    if (!email) continue
    try {
      await enviarRecordatorio2h(
        email,
        cita.paciente.user.name ?? "Paciente",
        cita.fecha,
        cita.modalidad,
        cita.linkSesion
      )
      await prisma.cita.update({ where: { id: cita.id }, data: { recordatorio2h: true } })
      enviados2h++
    } catch (err) {
      console.error(`[recordatorios] Error 2h cita ${cita.id}:`, err)
    }
  }

  return { enviados24h, enviados2h }
}

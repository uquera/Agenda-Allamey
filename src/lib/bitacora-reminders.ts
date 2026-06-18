import { prisma } from "@/lib/prisma"
import { sendPushToUser } from "@/lib/push"
import { startOfDay, endOfDay } from "date-fns"

/**
 * Envía un recordatorio push a los pacientes que tienen notificaciones activas
 * y que aún NO registraron su ánimo hoy. Pensado para llamarse 1 vez al día.
 */
export async function enviarRecordatoriosBitacora(): Promise<{ enviados: number }> {
  const ahora = new Date()
  const inicioHoy = startOfDay(ahora)
  const finHoy = endOfDay(ahora)

  const pacientes = await prisma.paciente.findMany({
    where: {
      activo: true,
      user: { pushSubscriptions: { some: {} } },
      registrosEmocionales: { none: { fecha: { gte: inicioHoy, lte: finHoy } } },
    },
    select: { userId: true, user: { select: { name: true } } },
  })

  let enviados = 0
  for (const p of pacientes) {
    const nombre = p.user.name?.split(" ")[0]
    const n = await sendPushToUser(p.userId, {
      title: nombre ? `Hola ${nombre} 🌿` : "¿Cómo te sientes hoy? 🌿",
      body: "Tómate un momento para registrar tu ánimo en tu bitácora emocional.",
      url: "/paciente/bitacora",
      tag: "bitacora-reminder",
    })
    if (n > 0) enviados++
  }

  return { enviados }
}

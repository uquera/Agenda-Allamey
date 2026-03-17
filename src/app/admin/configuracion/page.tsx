import { prisma } from "@/lib/prisma"
import ConfiguracionManager from "@/components/admin/ConfiguracionManager"

export const dynamic = "force-dynamic"

export default async function ConfiguracionPage() {
  const [disponibilidad, politicaCancelacion] = await Promise.all([
    prisma.disponibilidad.findMany({ where: { activo: true }, orderBy: { diaSemana: "asc" } }),
    prisma.politicaCancelacion.findFirst(),
  ])

  return (
    <ConfiguracionManager
      disponibilidad={disponibilidad.map((d) => ({
        id: d.id,
        diaSemana: d.diaSemana,
        horaInicio: d.horaInicio,
        horaFin: d.horaFin,
        activo: d.activo,
      }))}
      politicaCancelacion={politicaCancelacion ? {
        activa: politicaCancelacion.activa,
        horasAntelacion: politicaCancelacion.horasAntelacion,
        cobrarCancelacion: politicaCancelacion.cobrarCancelacion,
        montoCancelacion: politicaCancelacion.montoCancelacion,
        descripcion: politicaCancelacion.descripcion,
      } : null}
    />
  )
}

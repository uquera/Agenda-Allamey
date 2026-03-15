import { prisma } from "@/lib/prisma"
import ConfiguracionManager from "@/components/admin/ConfiguracionManager"

export const dynamic = "force-dynamic"

export default async function ConfiguracionPage() {
  const disponibilidad = await prisma.disponibilidad.findMany({
    where: { activo: true },
    orderBy: { diaSemana: "asc" },
  })

  return (
    <ConfiguracionManager
      disponibilidad={disponibilidad.map((d) => ({
        id: d.id,
        diaSemana: d.diaSemana,
        horaInicio: d.horaInicio,
        horaFin: d.horaFin,
        activo: d.activo,
      }))}
    />
  )
}

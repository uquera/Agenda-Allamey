import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ResenasDashboard from "./ResenasDashboard"

export const dynamic = "force-dynamic"

export default async function ResenasPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const resenas = await prisma.resena.findMany({
    include: {
      paciente: { include: { user: { select: { name: true } } } },
      cita: { select: { fecha: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const data = resenas.map((r) => ({
    id: r.id,
    calificacion: r.calificacion,
    comentario: r.comentario,
    respuesta: r.respuesta,
    respondidoEn: r.respondidoEn?.toISOString() ?? null,
    visible: r.visible,
    createdAt: r.createdAt.toISOString(),
    fechaCita: r.cita.fecha.toISOString(),
    pacienteNombre: r.paciente.user.name ?? "Paciente",
  }))

  const total = data.length
  const promedio = total > 0 ? data.reduce((s, r) => s + r.calificacion, 0) / total : 0

  return <ResenasDashboard resenas={data} promedio={promedio} total={total} />
}

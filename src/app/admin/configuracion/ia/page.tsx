import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import IAConfigManager from "./IAConfigManager"

export const dynamic = "force-dynamic"

export default async function IAConfigPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const [user, plantillas] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { iaInstrucciones: true, iaEjemplo: true },
    }),
    prisma.plantillaInforme.findMany({ orderBy: { createdAt: "desc" } }),
  ])

  return (
    <IAConfigManager
      iaInstrucciones={user?.iaInstrucciones ?? ""}
      iaEjemplo={user?.iaEjemplo ?? ""}
      plantillas={plantillas.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        contenido: p.contenido,
        activo: p.activo,
      }))}
    />
  )
}

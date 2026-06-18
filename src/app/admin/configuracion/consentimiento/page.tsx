import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import ClausulasManager from "./ClausulasManager"

export const dynamic = "force-dynamic"

export default async function ConsentimientoConfigPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const clausulas = await prisma.clausulaConsentimiento.findMany({ orderBy: { orden: "asc" } })

  return (
    <ClausulasManager
      inicial={clausulas.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        texto: c.texto,
        orden: c.orden,
        activo: c.activo,
      }))}
    />
  )
}

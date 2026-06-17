import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { BRAND } from "@/lib/brand"
import PerfilManager from "./PerfilManager"

export const dynamic = "force-dynamic"

export default async function PerfilPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const p = await prisma.perfilProfesional.findUnique({ where: { id: "singleton" } })

  return (
    <PerfilManager
      inicial={{
        nombre:       p?.nombre       ?? "",
        especialidad: p?.especialidad ?? "",
        bio:          p?.bio          ?? "",
        fotoUrl:      p?.fotoUrl      ?? "",
        infoServicio: p?.infoServicio ?? "",
        disclaimer:   p?.disclaimer   ?? "",
        telefono:     p?.telefono     ?? "",
        whatsapp:     p?.whatsapp     ?? "",
      }}
      placeholders={{
        nombre: BRAND.name,
        especialidad: BRAND.specialty,
        whatsapp: BRAND.whatsapp,
      }}
    />
  )
}

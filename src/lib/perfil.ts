import { prisma } from "@/lib/prisma"
import { BRAND } from "@/lib/brand"

export type PerfilResuelto = {
  nombre: string
  especialidad: string
  bio: string | null
  fotoUrl: string | null
  infoServicio: string | null
  disclaimer: string | null
  telefono: string | null
  whatsapp: string
}

/**
 * Devuelve el perfil de la profesional combinando el registro editable
 * (PerfilProfesional, singleton) con los valores por defecto de BRAND.
 */
export async function getPerfil(): Promise<PerfilResuelto> {
  const p = await prisma.perfilProfesional.findUnique({ where: { id: "singleton" } })
  return {
    nombre:       p?.nombre       || BRAND.name,
    especialidad: p?.especialidad || BRAND.specialty,
    bio:          p?.bio          ?? null,
    fotoUrl:      p?.fotoUrl      ?? null,
    infoServicio: p?.infoServicio ?? null,
    disclaimer:   p?.disclaimer   ?? null,
    telefono:     p?.telefono     ?? null,
    whatsapp:     p?.whatsapp      || BRAND.whatsapp,
  }
}

import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FileText, Video, Link as LinkIcon, Music, Dumbbell } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import MaterialesManager from "@/components/admin/MaterialesManager"

export const dynamic = "force-dynamic"

export default async function MaterialesAdminPage() {
  const materiales = await prisma.material.findMany({
    include: {
      _count: { select: { asignaciones: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const pacientes = await prisma.paciente.findMany({
    where: { activo: true },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <MaterialesManager
      materiales={materiales.map((m) => ({
        id: m.id,
        titulo: m.titulo,
        descripcion: m.descripcion,
        tipo: m.tipo,
        contenido: m.contenido,
        archivoUrl: m.archivoUrl,
        activo: m.activo,
        totalAsignaciones: m._count.asignaciones,
        createdAt: m.createdAt.toISOString(),
      }))}
      pacientes={pacientes.map((p) => ({
        id: p.id,
        nombre: p.user.name || "Paciente",
      }))}
    />
  )
}

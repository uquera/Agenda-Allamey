import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ArrowLeft, FolderOpen } from "lucide-react"
import Link from "next/link"
import CarpetaPaciente from "@/components/admin/CarpetaPaciente"

export const dynamic = "force-dynamic"

export default async function CarpetaPacientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  })

  if (!paciente) notFound()

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/pacientes/${id}`}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-light)" }}
          >
            <FolderOpen size={18} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Carpeta del paciente
            </h1>
            <p className="text-sm text-gray-500">{paciente.user.name}</p>
          </div>
        </div>
      </div>

      <CarpetaPaciente pacienteId={id} />
    </div>
  )
}

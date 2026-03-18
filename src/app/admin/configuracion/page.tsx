import { prisma } from "@/lib/prisma"
import ConfiguracionManager from "@/components/admin/ConfiguracionManager"
import Link from "next/link"
import { ClipboardList, ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ConfiguracionPage() {
  const [disponibilidad, politicaCancelacion] = await Promise.all([
    prisma.disponibilidad.findMany({ where: { activo: true }, orderBy: { diaSemana: "asc" } }),
    prisma.politicaCancelacion.findFirst(),
  ])

  return (
    <div className="space-y-6">
      {/* Accesos rápidos */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Formularios</h2>
        <Link
          href="/admin/configuracion/anamnesis"
          className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:bg-gray-50 transition-colors group"
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "var(--brand-light)" }}
          >
            <ClipboardList size={18} style={{ color: "var(--brand)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Preguntas de anamnesis</p>
            <p className="text-xs text-gray-400">Edita o desactiva las preguntas del formulario que rellenan los pacientes</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
        </Link>
      </div>

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
    </div>
  )
}

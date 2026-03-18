import { prisma } from "@/lib/prisma"
import { mergeConfig, AnamnesisConfigData } from "@/lib/anamnesis-config"
import { ClipboardList, ArrowLeft } from "lucide-react"
import Link from "next/link"
import AnamnesisConfigEditor from "@/components/admin/AnamnesisConfigEditor"

export const dynamic = "force-dynamic"

export default async function AnamnesisConfigPage() {
  const stored = await prisma.configAnamnesis.findUnique({ where: { id: "singleton" } })
  const config = mergeConfig(stored?.campos as AnamnesisConfigData | null)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/configuracion"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-light)" }}
          >
            <ClipboardList size={18} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Preguntas de anamnesis</h1>
            <p className="text-xs text-gray-400">
              Activa, desactiva o edita el texto de cada pregunta del formulario que rellenan los pacientes
            </p>
          </div>
        </div>
      </div>

      <AnamnesisConfigEditor initial={config} />
    </div>
  )
}

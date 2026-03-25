import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ClipboardList } from "lucide-react"
import AnamnesisForm from "@/components/paciente/AnamnesisForm"
import { mergeConfig, AnamnesisConfigData } from "@/lib/anamnesis-config"
import { BRAND } from "@/lib/brand"

export const dynamic = "force-dynamic"

export default async function AnamnesisPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const [paciente, configStored] = await Promise.all([
    prisma.paciente.findUnique({
      where: { userId: session.user.id },
      include: { anamnesis: true },
    }),
    prisma.configAnamnesis.findUnique({ where: { id: "singleton" } }),
  ])

  if (!paciente) redirect("/login")

  const config = mergeConfig(configStored?.campos as AnamnesisConfigData | null)
  const a = paciente.anamnesis

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-light)" }}
          >
            <ClipboardList size={18} style={{ color: "var(--brand)" }} />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Historia clínica</h1>
        </div>
        <p className="text-sm text-gray-500 ml-12">
          {a?.completado
            ? "Tu historial ha sido enviado. Puedes actualizarlo cuando quieras."
            : `Completa este formulario antes de tu primera consulta. ${BRAND.doctorTitle} lo revisará para ofrecerte la mejor atención.`}
        </p>
      </div>

      {a?.completado ? (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-medium"
          style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}
        >
          <span className="text-lg">✓</span>
          <span>Historial enviado — {BRAND.doctorTitle} ya tiene acceso a tu información.</span>
        </div>
      ) : (
        <AnamnesisForm
          config={config}
          initialCamposExtra={null}
          initial={null}
        />
      )}
    </div>
  )
}

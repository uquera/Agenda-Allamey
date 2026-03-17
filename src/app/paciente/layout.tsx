import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import PacienteSidebar from "@/components/paciente/PacienteSidebar"
import PacienteHeader from "@/components/paciente/PacienteHeader"

export default async function PacienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || session.user.role !== "PACIENTE") redirect("/login")

  // Verificar si el paciente ya firmó el consentimiento
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || headersList.get("next-url") || ""
  const esPaginaConsentimiento = pathname.includes("/consentimiento")

  if (!esPaginaConsentimiento) {
    const paciente = await prisma.paciente.findUnique({
      where: { userId: session.user.id },
      include: { consentimiento: { select: { firmado: true } } },
    })
    if (paciente && !paciente.consentimiento?.firmado) {
      redirect("/paciente/consentimiento")
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <PacienteSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PacienteHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

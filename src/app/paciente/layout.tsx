import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import PacienteShell from "@/components/paciente/PacienteShell"

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
    <PacienteShell user={session.user}>
      {children}
    </PacienteShell>
  )
}

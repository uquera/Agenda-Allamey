import { auth } from "@/auth"
import { redirect } from "next/navigation"
import PacienteSidebar from "@/components/paciente/PacienteSidebar"
import PacienteHeader from "@/components/paciente/PacienteHeader"

export default async function PacienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || session.user.role !== "PACIENTE") redirect("/login")

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

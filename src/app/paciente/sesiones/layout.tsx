import { redirect } from "next/navigation"
import { MODULES } from "@/lib/modules"

export default function SesionesLayout({ children }: { children: React.ReactNode }) {
  if (!MODULES.sesiones) redirect("/paciente")
  return <>{children}</>
}

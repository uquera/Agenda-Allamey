import { redirect } from "next/navigation"
import { MODULES } from "@/lib/modules"

export default function ConsentimientoLayout({ children }: { children: React.ReactNode }) {
  if (!MODULES.consentimiento) redirect("/paciente")
  return <>{children}</>
}

import { redirect } from "next/navigation"
import { MODULES } from "@/lib/modules"

export default function AgendarLayout({ children }: { children: React.ReactNode }) {
  if (!MODULES.agendar) redirect("/paciente")
  return <>{children}</>
}

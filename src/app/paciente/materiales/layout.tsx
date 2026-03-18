import { redirect } from "next/navigation"
import { MODULES } from "@/lib/modules"

export default function MaterialesLayout({ children }: { children: React.ReactNode }) {
  if (!MODULES.materiales) redirect("/paciente")
  return <>{children}</>
}

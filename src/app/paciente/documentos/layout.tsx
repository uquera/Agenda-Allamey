import { redirect } from "next/navigation"
import { MODULES } from "@/lib/modules"

export default function DocumentosLayout({ children }: { children: React.ReactNode }) {
  if (!MODULES.documentos) redirect("/paciente")
  return <>{children}</>
}

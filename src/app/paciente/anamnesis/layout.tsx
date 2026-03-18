import { redirect } from "next/navigation"
import { MODULES } from "@/lib/modules"

export default function AnamnesisLayout({ children }: { children: React.ReactNode }) {
  if (!MODULES.anamnesis) redirect("/paciente")
  return <>{children}</>
}

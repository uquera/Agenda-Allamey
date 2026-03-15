"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Loader2 } from "lucide-react"

export default function MarcarVistoButton({ asignacionId }: { asignacionId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function marcarVisto() {
    setLoading(true)
    try {
      await fetch(`/api/materiales/${asignacionId}/visto`, { method: "PATCH" })
      router.refresh()
    } catch {
      toast.error("Error al marcar como visto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={marcarVisto}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
      Marcar visto
    </button>
  )
}

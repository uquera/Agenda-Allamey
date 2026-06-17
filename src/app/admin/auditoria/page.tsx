import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { History, Calendar, CreditCard } from "lucide-react"

export const dynamic = "force-dynamic"

const ENTIDAD_LABEL: Record<string, { label: string; icon: typeof Calendar }> = {
  cita: { label: "Cita", icon: Calendar },
  pago: { label: "Pago", icon: CreditCard },
}

export default async function AuditoriaPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/login")

  const entries = await prisma.auditEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History size={24} style={{ color: "var(--brand)" }} /> Auditoría
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Registro de cambios sobre citas y pagos. Se muestran los últimos 200 movimientos.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <History size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aún no hay movimientos registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {entries.map((e) => {
            const meta = ENTIDAD_LABEL[e.entidadTipo] ?? { label: e.entidadTipo, icon: History }
            const Icon = meta.icon
            return (
              <div key={e.id} className="px-5 py-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{meta.label}</span> · {e.campo}{" "}
                    {e.valorAntes && (
                      <>
                        <span className="text-gray-400">{e.valorAntes}</span>
                        <span className="text-gray-300 mx-1">→</span>
                      </>
                    )}
                    <span className="font-medium text-gray-800">{e.valorDespues}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {e.userName} · {format(new Date(e.createdAt), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

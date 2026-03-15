import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Search } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import NuevoPacienteDialog from "@/components/admin/NuevoPacienteDialog"

export const dynamic = "force-dynamic"

export default async function PacientesPage() {
  const pacientes = await prisma.paciente.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { citas: true, sesiones: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-1">{pacientes.length} paciente{pacientes.length !== 1 ? "s" : ""} registrado{pacientes.length !== 1 ? "s" : ""}</p>
        </div>
        <NuevoPacienteDialog />
      </div>

      {pacientes.length === 0 ? (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">No hay pacientes registrados aún</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pacientes.map((p) => {
            const initials = p.user.name
              ? p.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
              : "??"
            return (
              <Link key={p.id} href={`/admin/pacientes/${p.id}`}>
                <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: "#8B1A2C" }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{p.user.name}</p>
                        <p className="text-xs text-gray-400">{p.user.email}</p>
                      </div>
                      <div className="flex items-center gap-4 text-center shrink-0">
                        <div>
                          <p className="text-lg font-bold text-gray-800">{p._count.citas}</p>
                          <p className="text-xs text-gray-400">citas</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-800">{p._count.sesiones}</p>
                          <p className="text-xs text-gray-400">sesiones</p>
                        </div>
                        <Badge
                          className={`shrink-0 ${p.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} hover:bg-opacity-100`}
                        >
                          {p.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

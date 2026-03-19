import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import CitaCard from "@/components/paciente/CitaCard"

export const dynamic = "force-dynamic"

const HORAS_24_MS = 24 * 60 * 60 * 1000

export default async function CitasPacientePage() {
  const session = await auth()
  if (!session) redirect("/login")

  const paciente = await prisma.paciente.findUnique({
    where: { userId: session.user.id },
  })
  if (!paciente) redirect("/login")

  const citas = await prisma.cita.findMany({
    where: { pacienteId: paciente.id },
    orderBy: { fecha: "desc" },
  })

  const ahora = Date.now()

  const citasConFlags = citas.map((c) => {
    const cancelable = ["PENDIENTE", "APROBADA"].includes(c.estado)
    const msRestantes = new Date(c.fecha).getTime() - ahora
    const bloqueadaPorTiempo = cancelable && msRestantes < HORAS_24_MS
    return {
      id: c.id,
      fecha: c.fecha.toISOString(),
      modalidad: c.modalidad,
      estado: c.estado,
      motivoConsulta: c.motivoConsulta,
      linkSesion: c.linkSesion,
      notasAdmin: c.notasAdmin,
      puedeCancel: cancelable && !bloqueadaPorTiempo,
      bloqueadaPorTiempo,
    }
  })

  const proximas = citasConFlags.filter(
    (c) => new Date(c.fecha) >= new Date() && ["PENDIENTE", "APROBADA"].includes(c.estado)
  )
  const pasadas = citasConFlags.filter(
    (c) => new Date(c.fecha) < new Date() || ["COMPLETADA", "CANCELADA", "RECHAZADA"].includes(c.estado)
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-2xl overflow-hidden flex items-end justify-between gap-4 px-6 pt-5 pb-0" style={{ backgroundColor: "#fce4ec" }}>
        <div className="pb-5">
          <h1 className="text-xl font-bold text-gray-800">Mis citas</h1>
          <p className="text-sm text-gray-500 mt-1">Historial y citas próximas</p>
        </div>
        <div className="shrink-0 w-36 self-end relative" style={{ height: "160px" }}>
          <Image src="/citas-banner.jpg" alt="Mis citas" fill className="object-cover object-bottom" />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "linear-gradient(to right, #fce4ec 0%, transparent 40%), linear-gradient(to bottom, #fce4ec 0%, transparent 25%)",
          }} />
        </div>
      </div>
      <div className="flex items-center justify-end">
        <Link
          href="/paciente/agendar"
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-colors"
          style={{ backgroundColor: "var(--brand)" }}
        >
          + Solicitar cita
        </Link>
      </div>

      {proximas.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Próximas
            </h2>
            <div className="space-y-3">
              {proximas.map((c) => <CitaCard key={c.id} cita={c} />)}
            </div>
          </CardContent>
        </Card>
      )}

      {pasadas.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Historial
            </h2>
            <div className="space-y-3">
              {pasadas.map((c) => <CitaCard key={c.id} cita={c} />)}
            </div>
          </CardContent>
        </Card>
      )}

      {citas.length === 0 && (
        <div className="text-center py-16">
          <CalendarDays size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 mb-4">No tienes citas registradas</p>
          <Link
            href="/paciente/agendar"
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "var(--brand)" }}
          >
            Solicitar primera cita
          </Link>
        </div>
      )}
    </div>
  )
}

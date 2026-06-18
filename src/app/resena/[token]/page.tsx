import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { BRAND } from "@/lib/brand"
import ResenaPublicaForm from "./ResenaPublicaForm"
import { CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = "force-dynamic"

export default async function ResenaPublicaPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const cita = await prisma.cita.findUnique({
    where: { resenaToken: token },
    include: {
      paciente: { include: { user: { select: { name: true } } } },
      resena: { select: { id: true, calificacion: true } },
    },
  })

  if (!cita) return notFound()

  const nombrePaciente = cita.paciente.user.name ?? "Paciente"
  const fechaCita = format(new Date(cita.fecha), "EEEE d 'de' MMMM", { locale: es })

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: BRAND.colorLight }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold tracking-wide" style={{ color: BRAND.color }}>
            {BRAND.name.toUpperCase()}
          </h1>
          <p className="text-xs tracking-widest text-gray-400 mt-1">{BRAND.specialty.toUpperCase()}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
          {cita.resena ? (
            // Ya calificada
            <div className="text-center py-6 space-y-3">
              <CheckCircle size={48} className="mx-auto text-green-500" />
              <p className="text-lg font-semibold text-gray-800">¡Gracias por tu calificación!</p>
              <p className="text-sm text-gray-500">
                Ya dejaste {cita.resena.calificacion}★ para esta sesión. Tu opinión es muy valiosa.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1 capitalize">{fechaCita}</p>
                <h2 className="text-lg font-bold text-gray-800">
                  ¿Cómo fue tu sesión con {BRAND.doctorTitle}?
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Hola {nombrePaciente.split(" ")[0]}, tu opinión ayuda a seguir mejorando.
                </p>
              </div>
              <ResenaPublicaForm
                token={token}
                citaId={cita.id}
                profesionalNombre={BRAND.doctorTitle}
              />
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Este enlace es exclusivo para ti y solo puede usarse una vez.
        </p>
      </div>
    </div>
  )
}

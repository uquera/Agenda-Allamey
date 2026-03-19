import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, FileText, BookOpen, CreditCard, ArrowLeft, Phone, Mail, User, FolderOpen, ShieldCheck, ShieldAlert, ClipboardList } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import PacienteFichaEditor from "@/components/admin/PacienteFichaEditor"
import EditarCuentaPacienteDialog from "@/components/admin/EditarCuentaPacienteDialog"
import { mergeConfig, AnamnesisConfigData } from "@/lib/anamnesis-config"

export const dynamic = "force-dynamic"

export default async function PacienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [paciente, configStored] = await Promise.all([prisma.paciente.findUnique({
    where: { id },
    include: {
      user: true,
      citas: { orderBy: { fecha: "desc" }, take: 10 },
      sesiones: { where: { publicado: true }, orderBy: { fechaSesion: "desc" }, take: 5 },
      materiales: {
        include: { material: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      pagos: { orderBy: { createdAt: "desc" }, take: 5 },
      consentimiento: true,
      anamnesis: true,
    },
  }), prisma.configAnamnesis.findUnique({ where: { id: "singleton" } })])

  if (!paciente) notFound()

  const anamnesisConfig = mergeConfig(configStored?.campos as AnamnesisConfigData | null)

  const initials = paciente.user.name
    ? paciente.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??"

  const edad = (() => {
    if (!paciente.fechaNacimiento) return null
    const hoy = new Date()
    const nac = new Date(paciente.fechaNacimiento)
    let e = hoy.getFullYear() - nac.getFullYear()
    if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--
    return e
  })()

  const estadoColor: Record<string, string> = {
    PENDIENTE: "bg-amber-100 text-amber-700",
    APROBADA: "bg-green-100 text-green-700",
    RECHAZADA: "bg-red-100 text-red-700",
    REAGENDADA: "bg-blue-100 text-blue-700",
    COMPLETADA: "bg-gray-100 text-gray-600",
    CANCELADA: "bg-gray-100 text-gray-400",
  }

  const estadoLabel: Record<string, string> = {
    PENDIENTE: "Pendiente",
    APROBADA: "Confirmada",
    RECHAZADA: "Rechazada",
    REAGENDADA: "Reagendada",
    COMPLETADA: "Completada",
    CANCELADA: "Cancelada",
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/pacientes"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: "var(--brand)" }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{paciente.user.name}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Mail size={11} />
                {paciente.user.email}
              </span>
              {paciente.telefono && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone size={11} />
                  {paciente.telefono}
                </span>
              )}
              {edad !== null && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <User size={11} />
                  {edad} años · {format(new Date(paciente.fechaNacimiento!), "d MMM yyyy", { locale: es })}
                </span>
              )}
              {paciente.consentimiento?.firmado ? (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <ShieldCheck size={11} />
                  Consentimiento firmado
                  {paciente.consentimiento.fechaFirma && (
                    <span className="text-gray-400 font-normal">
                      · {format(new Date(paciente.consentimiento.fechaFirma), "d MMM yyyy", { locale: es })}
                    </span>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <ShieldAlert size={11} />
                  Sin consentimiento
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <EditarCuentaPacienteDialog
            pacienteId={id}
            userId={paciente.userId}
            name={paciente.user.name || ""}
            email={paciente.user.email || ""}
            activo={paciente.activo}
          />
          <Link
            href={`/admin/pacientes/${id}/carpeta`}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
          >
            <FolderOpen size={14} />
            Carpeta
          </Link>
          <Link
            href={`/admin/sesiones?pacienteId=${id}`}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
          >
            + Nota de sesión
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ficha editable */}
        <div className="xl:col-span-1">
          <PacienteFichaEditor
            pacienteId={id}
            motivoConsulta={paciente.motivoConsulta}
            notas={paciente.notas}
            ocupacion={paciente.ocupacion}
            genero={paciente.genero}
            telefono={paciente.telefono}
          />
        </div>

        {/* Citas recientes */}
        <div className="xl:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <CalendarDays size={15} style={{ color: "var(--brand)" }} />
                  Citas recientes
                </h2>
                <span className="text-xs text-gray-400">{paciente.citas.length} total</span>
              </div>
              {paciente.citas.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Sin citas</p>
              ) : (
                <div className="space-y-2">
                  {paciente.citas.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 capitalize">
                          {format(new Date(c.fecha), "EEEE d 'de' MMM · HH:mm", { locale: es })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {c.modalidad === "ONLINE" ? "Online" : "Presencial"} · {c.duracion} min
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${estadoColor[c.estado]}`}>
                        {estadoLabel[c.estado]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sesiones publicadas */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <FileText size={15} style={{ color: "var(--brand)" }} />
                  Sesiones publicadas
                </h2>
              </div>
              {paciente.sesiones.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Sin sesiones publicadas</p>
              ) : (
                <div className="space-y-2">
                  {paciente.sesiones.map((s) => (
                    <Link
                      key={s.id}
                      href={`/admin/sesiones/${s.id}`}
                      className="flex items-center gap-2 py-2 hover:bg-gray-50 rounded-lg px-2 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <span className="text-sm text-gray-700 flex-1">{s.titulo}</span>
                      <span className="text-xs text-gray-400 capitalize">
                        {format(new Date(s.fechaSesion), "d MMM yyyy", { locale: es })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Anamnesis */}
      {paciente.anamnesis ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <ClipboardList size={15} style={{ color: "var(--brand)" }} />
                Historia clínica
              </h2>
              <span className="text-xs bg-green-50 text-green-700 font-medium px-2.5 py-1 rounded-full">
                ✓ Completada
              </span>
            </div>

            {(() => {
              const a = paciente.anamnesis!
              const extra = (a.camposExtra ?? {}) as Record<string, string>
              const fixedValues: Record<string, string | null> = {
                motivoPrincipal: a.motivoPrincipal, tiempoEvolucion: a.tiempoEvolucion,
                antecedentesMedicos: a.antecedentesMedicos, antecedentesPsicologicos: a.antecedentesPsicologicos,
                medicacionActual: a.medicacionActual, estadoCivil: a.estadoCivil,
                hijosCantidad: a.hijosCantidad, situacionLaboral: a.situacionLaboral,
                nivelEducativo: a.nivelEducativo, redApoyo: a.redApoyo,
                calidadSueno: a.calidadSueno, actividadFisica: a.actividadFisica,
                consumoSustancias: a.consumoSustancias, relacionPareja: a.relacionPareja,
                vidaSexual: a.vidaSexual, expectativasTerapia: a.expectativasTerapia,
                intentosAnteriores: a.intentosAnteriores,
              }
              return (
                <div className="space-y-5">
                  {anamnesisConfig.secciones.map((sec) => {
                    const campos = sec.campos
                      .map(k => ({
                        label: anamnesisConfig.campos[k]?.label ?? k,
                        valor: anamnesisConfig.campos[k]?.custom ? extra[k] : fixedValues[k],
                      }))
                      .filter(c => c.valor)
                    if (campos.length === 0) return null
                    return (
                      <div key={sec.titulo}>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{sec.titulo}</h3>
                        <div className="space-y-2">
                          {campos.map(({ label, valor }) => (
                            <div key={label} className="grid grid-cols-3 gap-2">
                              <span className="text-xs text-gray-400 col-span-1 pt-0.5">{label}</span>
                              <p className="text-sm text-gray-700 col-span-2 leading-relaxed">{valor}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <ClipboardList size={15} className="text-gray-300" />
              <p className="text-sm text-gray-400">El paciente aún no ha completado su historia clínica.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { prisma } from "@/lib/prisma"
import ConfiguracionManager from "@/components/admin/ConfiguracionManager"
import Link from "next/link"
import { ClipboardList, ChevronRight, Sparkles, UserCircle, ShieldCheck } from "lucide-react"
import NotificationsToggle from "@/components/NotificationsToggle"

export const dynamic = "force-dynamic"

export default async function ConfiguracionPage() {
  const [disponibilidad, politicaCancelacion] = await Promise.all([
    prisma.disponibilidad.findMany({ where: { activo: true }, orderBy: { diaSemana: "asc" } }),
    prisma.politicaCancelacion.findFirst(),
  ])

  return (
    <div className="space-y-6">
      {/* Notificaciones al teléfono */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Notificaciones</h2>
        <NotificationsToggle
          label="Avisos en este dispositivo"
          description="Recibe un aviso al instante cuando un paciente solicite una cita."
        />
        <p className="text-xs text-gray-400 mt-2 px-1">
          Para recibirlas en tu teléfono, abre el portal desde el navegador del celular, instálalo en la pantalla de inicio y activa esta opción.
        </p>
      </div>

      {/* Accesos rápidos */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Formularios y herramientas</h2>
        <div className="space-y-2">
          <Link
            href="/admin/configuracion/perfil"
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:bg-gray-50 transition-colors group"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--brand-light)" }}
            >
              <UserCircle size={18} style={{ color: "var(--brand)" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Mi perfil profesional</p>
              <p className="text-xs text-gray-400">Edita tu nombre, especialidad, biografía, foto e información del servicio que ven los pacientes</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>

          <Link
            href="/admin/configuracion/anamnesis"
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:bg-gray-50 transition-colors group"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--brand-light)" }}
            >
              <ClipboardList size={18} style={{ color: "var(--brand)" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Preguntas de anamnesis</p>
              <p className="text-xs text-gray-400">Edita o desactiva las preguntas del formulario que rellenan los pacientes</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>

          <Link
            href="/admin/configuracion/consentimiento"
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:bg-gray-50 transition-colors group"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--brand-light)" }}
            >
              <ShieldCheck size={18} style={{ color: "var(--brand)" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Cláusulas de consentimiento</p>
              <p className="text-xs text-gray-400">Edita los puntos del consentimiento informado que aceptan los pacientes</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>

          <Link
            href="/admin/configuracion/ia"
            className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:bg-gray-50 transition-colors group"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--brand-light)" }}
            >
              <Sparkles size={18} style={{ color: "var(--brand)" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Asistente de IA para informes</p>
              <p className="text-xs text-gray-400">Configura instrucciones de estilo y plantillas de informe modelo para generar notas con IA</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>
        </div>
      </div>

      <ConfiguracionManager
        disponibilidad={disponibilidad.map((d) => ({
          id: d.id,
          diaSemana: d.diaSemana,
          horaInicio: d.horaInicio,
          horaFin: d.horaFin,
          activo: d.activo,
        }))}
        politicaCancelacion={politicaCancelacion ? {
          activa: politicaCancelacion.activa,
          horasAntelacion: politicaCancelacion.horasAntelacion,
          cobrarCancelacion: politicaCancelacion.cobrarCancelacion,
          montoCancelacion: politicaCancelacion.montoCancelacion,
          descripcion: politicaCancelacion.descripcion,
        } : null}
      />
    </div>
  )
}

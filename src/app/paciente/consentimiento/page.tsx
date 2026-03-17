"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldCheck, CheckSquare, Square } from "lucide-react"

const CLAUSULAS = [
  {
    id: "naturaleza",
    titulo: "Naturaleza del servicio",
    texto:
      "Entiendo que los servicios psicológicos comprenden evaluación, orientación, psicoterapia individual, de pareja o grupal, y asesoría en sexología clínica. El objetivo es apoyar mi bienestar emocional, mental y sexual mediante técnicas basadas en evidencia.",
  },
  {
    id: "confidencialidad",
    titulo: "Confidencialidad",
    texto:
      "Entiendo que toda la información compartida durante las sesiones es estrictamente confidencial. Solo se romperá la confidencialidad en casos establecidos por ley: riesgo inminente para mi vida o la de terceros, sospecha de abuso o maltrato de menores, o requerimiento legal formal de un tribunal competente.",
  },
  {
    id: "registros",
    titulo: "Registro de sesiones",
    texto:
      "Acepto que se lleven notas de progreso clínico que forman parte de mi expediente. Estos registros son confidenciales y solo serán compartidos con mi consentimiento expreso o en los supuestos legales antes mencionados.",
  },
  {
    id: "cancelaciones",
    titulo: "Cancelaciones y honorarios",
    texto:
      "Entiendo que las citas deben cancelarse o reprogramarse con un mínimo de 24 horas de anticipación. Las cancelaciones tardías o inasistencias sin previo aviso podrán ser objeto de cobro según la política vigente del consultorio.",
  },
  {
    id: "comunicacion",
    titulo: "Comunicación entre sesiones",
    texto:
      "Entiendo que la comunicación fuera de las sesiones (mensajes, llamadas, correos) se limitará a asuntos logísticos. Las consultas de carácter clínico se atenderán únicamente en las sesiones agendadas.",
  },
  {
    id: "voluntario",
    titulo: "Consentimiento voluntario",
    texto:
      "Declaro que he leído y comprendido este documento, que participo voluntariamente en el proceso terapéutico y que puedo retirar mi consentimiento en cualquier momento. Autorizo a Allamey Sanz, Psicóloga Clínica y Sexóloga, a brindarme los servicios descritos.",
  },
]

export default function ConsentimientoPage() {
  const router = useRouter()
  const [aceptados, setAceptados] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  const toggleClausula = (id: string) => {
    setAceptados((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const aceptadosCount = Object.values(aceptados).filter(Boolean).length
  const todosAceptados = CLAUSULAS.every((c) => aceptados[c.id])

  async function handleFirmar() {
    if (!todosAceptados) {
      toast.error("Debes aceptar todos los puntos para continuar")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/consentimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firma: "checkbox-accepted" }),
      })
      if (!res.ok) throw new Error()
      toast.success("Consentimiento registrado correctamente")
      router.push("/paciente")
    } catch {
      toast.error("Error al guardar. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="text-center pt-2">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: "#fff0f2" }}
        >
          <ShieldCheck size={24} style={{ color: "#8B1A2C" }} />
        </div>
        <h1 className="text-xl font-bold text-gray-800">Consentimiento informado</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lee cada punto y márcalo para confirmar que lo entiendes y aceptas
        </p>
      </div>

      {/* Encabezado del documento */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Psicóloga Clínica · Sexóloga
        </p>
        <h2 className="text-base font-bold" style={{ color: "#8B1A2C" }}>
          Allamey Sanz
        </h2>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Para usar el portal de pacientes necesitas leer y aceptar cada uno de los
          siguientes puntos del consentimiento informado para servicios psicológicos.
          Este documento tiene validez legal.
        </p>
      </div>

      {/* Cláusulas */}
      <div className="space-y-3">
        {CLAUSULAS.map((clausula) => {
          const aceptado = !!aceptados[clausula.id]
          return (
            <button
              key={clausula.id}
              onClick={() => toggleClausula(clausula.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                aceptado
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  {aceptado ? (
                    <CheckSquare size={20} className="text-green-600" />
                  ) : (
                    <Square size={20} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold mb-1 ${aceptado ? "text-green-700" : "text-gray-700"}`}>
                    {clausula.titulo}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">{clausula.texto}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Barra de progreso */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Puntos aceptados</span>
          <span className="text-xs font-semibold text-gray-700">
            {aceptadosCount} / {CLAUSULAS.length}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(aceptadosCount / CLAUSULAS.length) * 100}%`,
              backgroundColor: todosAceptados ? "#16a34a" : "#8B1A2C",
            }}
          />
        </div>
      </div>

      {/* Botón */}
      <Button
        className="w-full h-12 text-white font-semibold text-sm"
        style={{
          backgroundColor: todosAceptados ? "#16a34a" : "#8B1A2C",
          opacity: !todosAceptados ? 0.5 : 1,
        }}
        onClick={handleFirmar}
        disabled={loading || !todosAceptados}
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin mr-2" />Guardando...</>
        ) : todosAceptados ? (
          <><ShieldCheck size={16} className="mr-2" />Acepto y continuar</>
        ) : (
          "Acepta todos los puntos para continuar"
        )}
      </Button>
    </div>
  )
}

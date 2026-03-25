"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AnamnesisConfigData } from "@/lib/anamnesis-config"
import { BRAND } from "@/lib/brand"

type FixedFields = {
  motivoPrincipal: string
  tiempoEvolucion: string
  antecedentesMedicos: string
  antecedentesPsicologicos: string
  medicacionActual: string
  estadoCivil: string
  hijosCantidad: string
  situacionLaboral: string
  nivelEducativo: string
  redApoyo: string
  calidadSueno: string
  actividadFisica: string
  consumoSustancias: string
  relacionPareja: string
  vidaSexual: string
  expectativasTerapia: string
  intentosAnteriores: string
}

const emptyFixed: FixedFields = {
  motivoPrincipal: "", tiempoEvolucion: "",
  antecedentesMedicos: "", antecedentesPsicologicos: "", medicacionActual: "",
  estadoCivil: "", hijosCantidad: "", situacionLaboral: "", nivelEducativo: "", redApoyo: "",
  calidadSueno: "", actividadFisica: "", consumoSustancias: "",
  relacionPareja: "", vidaSexual: "",
  expectativasTerapia: "", intentosAnteriores: "",
}

const SELECT_OPTIONS: Partial<Record<keyof FixedFields, string[]>> = {
  estadoCivil:        ["Soltero/a", "En relación", "Casado/a", "Unión libre", "Separado/a", "Divorciado/a", "Viudo/a"],
  situacionLaboral:   ["Empleado/a", "Independiente / Freelance", "Desempleado/a", "Estudiante", "Ama/o de casa", "Jubilado/a"],
  nivelEducativo:     ["Primaria", "Secundaria", "Técnico / TSU", "Universitario", "Posgrado / Maestría", "Doctorado"],
  calidadSueno:       ["Buena (duermo bien)", "Regular (interrupciones ocasionales)", "Mala (insomnio o sueño excesivo)"],
  actividadFisica:    ["Nunca", "Ocasional (1 vez/semana)", "Regular (2-3 veces/semana)", "Frecuente (más de 3 veces/semana)"],
  consumoSustancias:  ["No", "Sí, actualmente", "Lo he tenido en el pasado", "Prefiero no responder"],
  relacionPareja:     ["No tengo pareja", "Estable", "En conflicto", "Prefiero no responder"],
  vidaSexual:         ["Satisfactoria", "Con algunas dificultades", "Insatisfactoria", "Prefiero no responder"],
  expectativasTerapia:["Mejorar mi bienestar emocional", "Resolver una situación específica", "Conocerme mejor / desarrollo personal", "Manejar el estrés o la ansiedad", "Otro"],
  intentosAnteriores: ["Sí", "No", "Prefiero no responder"],
}

const TEXTAREA_KEYS: (keyof FixedFields)[] = [
  "motivoPrincipal", "antecedentesMedicos", "antecedentesPsicologicos", "redApoyo",
]

const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white resize-none"
const selectClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 bg-white"
const labelClass = "block text-xs font-semibold text-gray-600 mb-1"

function SectionTitle({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
        style={{ backgroundColor: "var(--brand)" }}
      >
        {number}
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

export default function AnamnesisForm({
  initial,
  initialCamposExtra,
  config,
}: {
  initial: Partial<FixedFields> | null
  initialCamposExtra: Record<string, string> | null
  config: AnamnesisConfigData
}) {
  const router = useRouter()
  const [form, setForm] = useState<FixedFields>({ ...emptyFixed, ...(initial ?? {}) })
  const [camposExtra, setCamposExtra] = useState<Record<string, string>>(initialCamposExtra ?? {})
  const [guardando, setGuardando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const setFixed = (field: keyof FixedFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
    }

  const setCustom = (key: string) =>
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
      setCamposExtra(prev => ({ ...prev, [key]: e.target.value }))
    }

  const shouldShow = (campo: (typeof config.campos)[string] | undefined): boolean => {
    if (!campo?.dependsOn) return true
    const { field, value } = campo.dependsOn
    if (field in form) return form[field as keyof FixedFields] === value
    return camposExtra[field] === value
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    const res = await fetch("/api/anamnesis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, camposExtra }),
    })
    if (res.ok) {
      setEnviado(true)
      setForm({ ...emptyFixed })
      setCamposExtra({})
      router.refresh()
    }
    setGuardando(false)
  }

  if (enviado) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm text-center space-y-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: "var(--brand-light)" }}
        >
          <span className="text-2xl" style={{ color: "var(--brand)" }}>✓</span>
        </div>
        <p className="text-base font-semibold text-gray-800">
          Gracias por compartir esta información.
        </p>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          Nos permitirá acompañarte de forma más consciente y alineada a tus necesidades.
        </p>
      </div>
    )
  }

  let sectionNumber = 0

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {config.secciones.map((seccion, secIdx) => {
        const camposActivos = seccion.campos.filter(k => {
          const campo = config.campos[k]
          return campo?.activo && !campo?.adminOnly && shouldShow(campo)
        })
        if (camposActivos.length === 0) return null
        sectionNumber++
        const tieneSelects = camposActivos.some(k => SELECT_OPTIONS[k as keyof FixedFields] || config.campos[k]?.options)

        return (
          <div key={secIdx} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <SectionTitle
              number={String(sectionNumber)}
              title={seccion.titulo}
              subtitle={seccion.subtitulo}
            />
            <div className={tieneSelects ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
              {camposActivos.map(k => {
                const campo = config.campos[k]
                const label = campo?.label ?? k
                const esCustom = campo?.custom === true

                if (esCustom) {
                  const customOptions = campo?.options
                  if (customOptions) {
                    return (
                      <div key={k}>
                        <label className={labelClass}>{label}</label>
                        <select
                          value={camposExtra[k] ?? ""}
                          onChange={setCustom(k)}
                          className={selectClass}
                        >
                          <option value="">Seleccionar...</option>
                          {customOptions.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    )
                  }
                  return (
                    <div key={k} className={tieneSelects ? "sm:col-span-2" : undefined}>
                      <label className={labelClass}>{label}</label>
                      <textarea
                        rows={3}
                        value={camposExtra[k] ?? ""}
                        onChange={setCustom(k)}
                        className={inputClass}
                      />
                    </div>
                  )
                }

                const options = SELECT_OPTIONS[k as keyof FixedFields]
                const isTextarea = TEXTAREA_KEYS.includes(k as keyof FixedFields)

                if (options) {
                  return (
                    <div key={k}>
                      <label className={labelClass}>{label}</label>
                      <select
                        value={form[k as keyof FixedFields]}
                        onChange={setFixed(k as keyof FixedFields)}
                        className={selectClass}
                      >
                        <option value="">Seleccionar...</option>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  )
                }

                if (isTextarea) {
                  return (
                    <div key={k} className={tieneSelects ? "sm:col-span-2" : undefined}>
                      <label className={labelClass}>{label}</label>
                      <textarea
                        rows={3}
                        value={form[k as keyof FixedFields]}
                        onChange={setFixed(k as keyof FixedFields)}
                        className={inputClass}
                      />
                    </div>
                  )
                }

                return (
                  <div key={k}>
                    <label className={labelClass}>{label}</label>
                    <input
                      type="text"
                      value={form[k as keyof FixedFields]}
                      onChange={setFixed(k as keyof FixedFields)}
                      className={inputClass}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex items-center justify-between py-2">
        <p className="text-xs text-gray-400 max-w-sm">
          Tu información es estrictamente confidencial y solo {BRAND.doctorTitle} tiene acceso a ella.
        </p>
        <button
          type="submit"
          disabled={guardando}
          className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {guardando ? "Guardando..." : initial ? "Actualizar historial" : "Enviar historial"}
        </button>
      </div>
    </form>
  )
}

"use client"

import { useState } from "react"
import { AnamnesisConfigData } from "@/lib/anamnesis-config"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"

export default function AnamnesisConfigEditor({ initial }: { initial: AnamnesisConfigData }) {
  const [config, setConfig] = useState<AnamnesisConfigData>(
    JSON.parse(JSON.stringify(initial))
  )
  const [guardando, setGuardando] = useState(false)

  // ─── Campos ────────────────────────────────────────────────────────────────

  function toggleCampo(key: string) {
    setConfig(prev => ({
      ...prev,
      campos: {
        ...prev.campos,
        [key]: { ...prev.campos[key], activo: !prev.campos[key].activo },
      },
    }))
  }

  function setLabel(key: string, label: string) {
    setConfig(prev => ({
      ...prev,
      campos: { ...prev.campos, [key]: { ...prev.campos[key], label } },
    }))
  }

  function eliminarCampo(seccionIdx: number, key: string) {
    setConfig(prev => {
      const secciones = prev.secciones.map((s, i) =>
        i === seccionIdx ? { ...s, campos: s.campos.filter(k => k !== key) } : s
      )
      const campos = { ...prev.campos }
      delete campos[key]
      return { campos, secciones }
    })
  }

  function agregarCampo(seccionIdx: number) {
    const key = `custom_${Date.now()}`
    setConfig(prev => {
      const secciones = prev.secciones.map((s, i) =>
        i === seccionIdx ? { ...s, campos: [...s.campos, key] } : s
      )
      const campos = {
        ...prev.campos,
        [key]: { label: "Nueva pregunta", activo: true, custom: true as const },
      }
      return { campos, secciones }
    })
  }

  // ─── Guardar ────────────────────────────────────────────────────────────────

  async function guardar() {
    setGuardando(true)
    try {
      const res = await fetch("/api/admin/anamnesis-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error()
      toast.success("Configuración guardada")
    } catch {
      toast.error("No se pudo guardar la configuración")
    } finally {
      setGuardando(false)
    }
  }

  const totalActivos = Object.values(config.campos).filter(c => c.activo).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{totalActivos}</span> de{" "}
          {Object.keys(config.campos).length} preguntas activas
        </p>
        <button
          onClick={guardar}
          disabled={guardando}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {guardando && <Loader2 size={14} className="animate-spin" />}
          Guardar cambios
        </button>
      </div>

      {config.secciones.map((seccion, secIdx) => {
        const camposSeccion = seccion.campos.filter(k => config.campos[k])
        return (
          <div key={secIdx} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Cabecera de sección */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: "var(--brand)" }}
              >
                {secIdx + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800">{seccion.titulo}</h3>
                <p className="text-xs text-gray-400">{seccion.subtitulo}</p>
              </div>
              <span className="text-xs text-gray-400">
                {camposSeccion.filter(k => config.campos[k]?.activo).length}/{camposSeccion.length} activas
              </span>
            </div>

            {/* Campos */}
            <div className="divide-y divide-gray-50">
              {camposSeccion.map((key) => {
                const campo = config.campos[key]
                const esCustom = campo.custom === true
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 px-5 py-3 transition-colors ${!campo.activo ? "opacity-50 bg-gray-50" : ""}`}
                  >
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleCampo(key)}
                      className="relative shrink-0 w-9 h-5 rounded-full transition-colors focus:outline-none"
                      style={campo.activo ? { backgroundColor: "var(--brand)" } : { backgroundColor: "#d1d5db" }}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${campo.activo ? "translate-x-4" : ""}`}
                      />
                    </button>

                    {/* Label editable */}
                    <input
                      type="text"
                      value={campo.label}
                      onChange={e => setLabel(key, e.target.value)}
                      disabled={!campo.activo}
                      placeholder="Texto de la pregunta..."
                      className="flex-1 text-sm text-gray-700 bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-gray-300 focus:outline-none py-0.5 transition-colors disabled:cursor-not-allowed placeholder:text-gray-300"
                    />

                    {/* Badge custom */}
                    {esCustom && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium shrink-0">
                        nueva
                      </span>
                    )}

                    {/* Botón eliminar — custom siempre, fijas solo si se quiere borrar permanente */}
                    <button
                      type="button"
                      onClick={() => eliminarCampo(secIdx, key)}
                      className={`shrink-0 transition-colors ${esCustom ? "text-red-300 hover:text-red-500" : "text-gray-200 hover:text-red-400"}`}
                      title="Eliminar pregunta"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Botón agregar */}
            <div className="px-5 py-3 border-t border-gray-50">
              <button
                type="button"
                onClick={() => agregarCampo(secIdx)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus size={13} />
                Agregar pregunta en esta sección
              </button>
            </div>
          </div>
        )
      })}

      <div className="flex justify-end pt-1">
        <button
          onClick={guardar}
          disabled={guardando}
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {guardando && <Loader2 size={14} className="animate-spin" />}
          Guardar cambios
        </button>
      </div>
    </div>
  )
}

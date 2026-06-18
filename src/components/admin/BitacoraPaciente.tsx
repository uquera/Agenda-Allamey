"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { HeartPulse, Loader2, Moon, Battery } from "lucide-react"
import { moodByValue, MOODS } from "@/lib/bitacora"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Registro {
  id: string
  fecha: string
  estadoAnimo: number
  emociones: string[]
  desencadenante: string | null
  nota: string | null
  horasSueno: number | null
  nivelEnergia: number | null
}

export default function BitacoraPaciente({ pacienteId }: { pacienteId: string }) {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch(`/api/pacientes/${pacienteId}/bitacora`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setRegistros)
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [pacienteId])

  // Promedio y frecuencia de emociones
  const promedio = registros.length ? registros.reduce((s, r) => s + r.estadoAnimo, 0) / registros.length : 0
  const freq: Record<string, number> = {}
  for (const r of registros) for (const e of r.emociones) freq[e] = (freq[e] ?? 0) + 1
  const topEmociones = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Datos del gráfico (cronológico, máximo 20 últimos)
  const serie = [...registros].reverse().slice(-20)

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <HeartPulse size={15} style={{ color: "var(--brand)" }} /> Bitácora emocional
          </h2>
          {registros.length > 0 && (
            <span className="text-xs text-gray-400">
              {moodByValue(Math.round(promedio)).emoji} prom. {promedio.toFixed(1)} · {registros.length} registros
            </span>
          )}
        </div>

        {cargando ? (
          <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
        ) : registros.length === 0 ? (
          <p className="text-xs text-gray-400 py-3">El paciente aún no tiene registros en su bitácora.</p>
        ) : (
          <div className="space-y-4">
            {/* Gráfico de ánimo */}
            <MoodChart serie={serie} />

            {/* Emociones más frecuentes */}
            {topEmociones.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Emociones más frecuentes</p>
                <div className="flex flex-wrap gap-1.5">
                  {topEmociones.map(([e, n]) => (
                    <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {e} <span className="text-gray-400">×{n}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Entradas recientes */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Registros recientes</p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {registros.slice(0, 12).map((r) => {
                  const m = moodByValue(r.estadoAnimo)
                  return (
                    <div key={r.id} className="flex gap-2.5 border-b border-gray-50 pb-2 last:border-0">
                      <span className="text-lg leading-none mt-0.5">{m.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700 capitalize">
                            {format(new Date(r.fecha), "d MMM · HH:mm", { locale: es })}
                          </span>
                          <span className="text-[10px]" style={{ color: m.color }}>{m.label}</span>
                        </div>
                        {r.emociones.length > 0 && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{r.emociones.join(" · ")}</p>
                        )}
                        {r.desencadenante && <p className="text-[11px] text-gray-400 mt-0.5">Detonante: {r.desencadenante}</p>}
                        {r.nota && <p className="text-xs text-gray-600 mt-0.5">{r.nota}</p>}
                        {(r.horasSueno != null || r.nivelEnergia != null) && (
                          <div className="flex gap-3 mt-1 text-[10px] text-gray-400">
                            {r.horasSueno != null && <span className="flex items-center gap-0.5"><Moon size={10} /> {r.horasSueno}h</span>}
                            {r.nivelEnergia != null && <span className="flex items-center gap-0.5"><Battery size={10} /> {r.nivelEnergia}/5</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MoodChart({ serie }: { serie: { id: string; estadoAnimo: number; fecha: string }[] }) {
  if (serie.length === 0) return null
  const W = 100, H = 38, pad = 4
  const n = serie.length
  const x = (i: number) => (n === 1 ? W / 2 : pad + (i * (W - 2 * pad)) / (n - 1))
  const y = (v: number) => pad + ((5 - v) * (H - 2 * pad)) / 4
  const pts = serie.map((r, i) => `${x(i)},${y(r.estadoAnimo)}`).join(" ")

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-500">Ánimo en el tiempo</p>
        <span className="text-[10px] text-gray-300">últimos {n}</span>
      </div>
      <div className="relative rounded-lg bg-gray-50 p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "70px" }} preserveAspectRatio="none">
          {[1, 2, 3, 4, 5].map((v) => (
            <line key={v} x1={pad} x2={W - pad} y1={y(v)} y2={y(v)} stroke="#e5e7eb" strokeWidth="0.3" />
          ))}
          <polyline points={pts} fill="none" stroke="var(--brand)" strokeWidth="0.8" strokeLinejoin="round" strokeLinecap="round" />
          {serie.map((r, i) => {
            const m = moodByValue(r.estadoAnimo)
            return <circle key={r.id} cx={x(i)} cy={y(r.estadoAnimo)} r="1.3" fill={m.color} />
          })}
        </svg>
        <div className="flex justify-between mt-1 px-0.5">
          <span className="text-[9px] text-gray-300">{MOODS[0].emoji}…{MOODS[4].emoji}</span>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, HeartPulse, Moon, Battery, Send } from "lucide-react"
import { MOODS, EMOCIONES, moodByValue } from "@/lib/bitacora"
import { format, isToday, isYesterday } from "date-fns"
import { es } from "date-fns/locale"
import NotificationsToggle from "@/components/NotificationsToggle"

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

export default function BitacoraPage() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [animo, setAnimo] = useState(0)
  const [emociones, setEmociones] = useState<string[]>([])
  const [desencadenante, setDesencadenante] = useState("")
  const [nota, setNota] = useState("")
  const [sueno, setSueno] = useState("")
  const [energia, setEnergia] = useState(0)

  useEffect(() => {
    fetch("/api/bitacora")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRegistros)
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const toggleEmocion = (e: string) =>
    setEmociones((prev) => (prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]))

  async function guardar() {
    if (!animo) { toast.error("Selecciona cómo te sientes hoy"); return }
    setGuardando(true)
    try {
      const res = await fetch("/api/bitacora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estadoAnimo: animo, emociones, desencadenante, nota, horasSueno: sueno, nivelEnergia: energia || null }),
      })
      if (!res.ok) throw new Error()
      toast.success("Registro guardado. ¡Gracias por compartir cómo te sientes!")
      // refrescar
      const data = await fetch("/api/bitacora").then((r) => r.json())
      setRegistros(data)
      setAnimo(0); setEmociones([]); setDesencadenante(""); setNota(""); setSueno(""); setEnergia(0)
    } catch {
      toast.error("No se pudo guardar. Intenta de nuevo.")
    } finally {
      setGuardando(false)
    }
  }

  const fechaLabel = (iso: string) => {
    const d = new Date(iso)
    if (isToday(d)) return "Hoy"
    if (isYesterday(d)) return "Ayer"
    return format(d, "EEEE d 'de' MMMM", { locale: es })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="text-center pt-1">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "var(--brand-light)" }}>
          <HeartPulse size={24} style={{ color: "var(--brand)" }} />
        </div>
        <h1 className="text-xl font-bold text-gray-800">Mi bitácora emocional</h1>
        <p className="text-sm text-gray-500 mt-1">Registra cómo te sientes. Tu psicóloga podrá acompañarte mejor.</p>
      </div>

      {/* Recordatorios */}
      <NotificationsToggle
        label="Recordatorio diario"
        description="Recibe un aviso suave para registrar cómo te sientes cada día."
      />

      {/* Formulario */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-5">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">¿Cómo te sientes hoy?</p>
          <div className="flex justify-between gap-2">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setAnimo(m.value)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${animo === m.value ? "scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
                style={animo === m.value ? { borderColor: m.color, backgroundColor: `${m.color}12` } : { backgroundColor: "#f9fafb" }}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[10px] font-medium text-gray-600">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">¿Qué emociones notas? <span className="text-gray-400 font-normal">(opcional)</span></p>
          <div className="flex flex-wrap gap-2">
            {EMOCIONES.map((e) => {
              const on = emociones.includes(e)
              return (
                <button
                  key={e}
                  onClick={() => toggleEmocion(e)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${on ? "text-white border-transparent" : "text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                  style={on ? { backgroundColor: "var(--brand)" } : {}}
                >
                  {e}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">¿Algo lo provocó? <span className="text-gray-400 font-normal">(opcional)</span></label>
          <input
            value={desencadenante}
            onChange={(e) => setDesencadenante(e.target.value)}
            placeholder="Ej: una discusión, el trabajo, una buena noticia..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">¿Quieres contar algo más? <span className="text-gray-400 font-normal">(opcional)</span></label>
          <textarea
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            rows={3}
            placeholder="Escribe lo que quieras sobre tu día..."
            className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5"><Moon size={13} /> Horas de sueño</label>
            <input type="number" min={0} max={24} step={0.5} value={sueno} onChange={(e) => setSueno(e.target.value)} placeholder="Ej: 7"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5"><Battery size={13} /> Energía</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setEnergia(n)}
                  className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors ${energia >= n ? "text-white" : "text-gray-400 bg-gray-100"}`}
                  style={energia >= n ? { backgroundColor: "var(--brand)" } : {}}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={guardar}
          disabled={guardando || !animo}
          className="w-full h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {guardando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Guardar registro
        </button>
      </div>

      {/* Historial */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 px-1">Tus registros recientes</h2>
        {cargando ? (
          <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-gray-300" /></div>
        ) : registros.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm">
            Aún no tienes registros. ¡Empieza hoy! 🌱
          </div>
        ) : (
          <div className="space-y-2.5">
            {registros.map((r) => {
              const m = moodByValue(r.estadoAnimo)
              return (
                <div key={r.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.emoji}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 capitalize">{fechaLabel(r.fecha)}</p>
                      <p className="text-xs" style={{ color: m.color }}>{m.label}</p>
                    </div>
                    <span className="text-xs text-gray-300">{format(new Date(r.fecha), "HH:mm")}</span>
                  </div>
                  {r.emociones.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {r.emociones.map((e) => (
                        <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{e}</span>
                      ))}
                    </div>
                  )}
                  {r.desencadenante && <p className="text-xs text-gray-500 mt-2"><span className="text-gray-400">Detonante:</span> {r.desencadenante}</p>}
                  {r.nota && <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{r.nota}</p>}
                  {(r.horasSueno != null || r.nivelEnergia != null) && (
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      {r.horasSueno != null && <span className="flex items-center gap-1"><Moon size={12} /> {r.horasSueno}h sueño</span>}
                      {r.nivelEnergia != null && <span className="flex items-center gap-1"><Battery size={12} /> Energía {r.nivelEnergia}/5</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

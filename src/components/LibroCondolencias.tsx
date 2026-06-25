"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Heart, Send } from "lucide-react"

type Condolencia = {
  id: string
  nombre: string
  mensaje: string
  createdAt: string
}

function formatearFecha(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-VE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

export default function LibroCondolencias() {
  const [mensajes, setMensajes] = useState<Condolencia[]>([])
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [nombre, setNombre] = useState("")
  const [mensaje, setMensaje] = useState("")

  useEffect(() => {
    fetch("/api/condolencias")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Condolencia[]) => setMensajes(data))
      .catch(() => setMensajes([]))
      .finally(() => setCargando(false))
  }, [])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (enviando) return
    setEnviando(true)
    try {
      const res = await fetch("/api/condolencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, mensaje }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "No se pudo enviar tu mensaje")
        return
      }
      setMensajes((prev) => [data, ...prev])
      setNombre("")
      setMensaje("")
      toast.success("Gracias por tu mensaje 🤍")
    } catch {
      toast.error("No se pudo enviar tu mensaje")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="w-full max-w-2xl mx-auto mt-16 px-2">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="h-px w-12 bg-[#8B1A2C]/20" />
          <Heart size={18} className="text-[#8B1A2C]/60" fill="currentColor" />
          <div className="h-px w-12 bg-[#8B1A2C]/20" />
        </div>
        <h2 className="text-2xl font-bold text-[#5a1019]">Deja tu último adiós</h2>
        <p className="text-sm text-[#8B1A2C]/70 mt-2 max-w-md mx-auto">
          Comparte un recuerdo, una palabra de cariño o una despedida para Allamey.
          Tu mensaje quedará aquí para acompañarla.
        </p>
      </div>

      {/* Formulario */}
      <form
        onSubmit={enviar}
        className="bg-white/70 backdrop-blur rounded-2xl shadow-sm ring-1 ring-[#8B1A2C]/10 p-5 mb-10"
      >
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          maxLength={80}
          required
          className="w-full h-11 px-4 mb-3 rounded-xl border border-[#8B1A2C]/15 bg-white/80 text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#8B1A2C]/40 focus:ring-2 focus:ring-[#8B1A2C]/10 transition"
        />
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Escribe tu mensaje de despedida…"
          rows={4}
          maxLength={1000}
          required
          className="w-full px-4 py-3 mb-4 rounded-xl border border-[#8B1A2C]/15 bg-white/80 text-gray-700 placeholder:text-gray-400 outline-none focus:border-[#8B1A2C]/40 focus:ring-2 focus:ring-[#8B1A2C]/10 transition resize-none"
        />
        <button
          type="submit"
          disabled={enviando}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
          style={{ backgroundColor: "#8B1A2C" }}
        >
          {enviando ? (
            <><Loader2 size={17} className="animate-spin" /> Enviando…</>
          ) : (
            <><Send size={16} /> Dejar mi mensaje</>
          )}
        </button>
      </form>

      {/* Lista de mensajes */}
      {cargando ? (
        <div className="flex justify-center py-8">
          <Loader2 size={22} className="animate-spin text-[#8B1A2C]/50" />
        </div>
      ) : mensajes.length === 0 ? (
        <p className="text-center text-sm text-[#8B1A2C]/50 py-6">
          Sé el primero en dejar unas palabras para Allamey.
        </p>
      ) : (
        <ul className="space-y-4">
          {mensajes.map((m) => (
            <li
              key={m.id}
              className="bg-white/70 backdrop-blur rounded-2xl shadow-sm ring-1 ring-[#8B1A2C]/10 p-5"
            >
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {m.mensaje}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#8B1A2C]/10">
                <span className="text-sm font-semibold text-[#8B1A2C]">{m.nombre}</span>
                <span className="text-xs text-gray-400">{formatearFecha(m.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

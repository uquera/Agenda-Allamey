"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Sparkles, Save, Plus, Trash2, FileText, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Plantilla {
  id: string
  nombre: string
  descripcion: string | null
  contenido: string
  activo: boolean
}

export default function IAConfigManager({
  iaInstrucciones: instruccionesInicial,
  iaEjemplo: ejemploInicial,
  plantillas: plantillasInicial,
}: {
  iaInstrucciones: string
  iaEjemplo: string
  plantillas: Plantilla[]
}) {
  const router = useRouter()
  const [instrucciones, setInstrucciones] = useState(instruccionesInicial)
  const [ejemplo, setEjemplo] = useState(ejemploInicial)
  const [guardando, setGuardando] = useState(false)

  const [plantillas, setPlantillas] = useState(plantillasInicial)
  const [nuevoNombre, setNuevoNombre] = useState("")
  const [nuevaDesc, setNuevaDesc] = useState("")
  const [nuevoContenido, setNuevoContenido] = useState("")
  const [creando, setCreando] = useState(false)

  async function guardarConfig() {
    setGuardando(true)
    const res = await fetch("/api/admin/ia-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iaInstrucciones: instrucciones, iaEjemplo: ejemplo }),
    })
    setGuardando(false)
    if (res.ok) toast.success("Configuración de IA guardada")
    else toast.error("Error al guardar")
  }

  async function crearPlantilla() {
    if (!nuevoNombre.trim() || !nuevoContenido.trim()) {
      toast.error("Nombre y contenido son requeridos")
      return
    }
    setCreando(true)
    const res = await fetch("/api/plantillas-informe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevoNombre, descripcion: nuevaDesc, contenido: nuevoContenido }),
    })
    setCreando(false)
    if (res.ok) {
      const p = await res.json()
      setPlantillas((prev) => [p, ...prev])
      setNuevoNombre(""); setNuevaDesc(""); setNuevoContenido("")
      toast.success("Plantilla de informe creada")
      router.refresh()
    } else {
      toast.error("Error al crear plantilla")
    }
  }

  async function eliminarPlantilla(id: string) {
    const res = await fetch(`/api/plantillas-informe/${id}`, { method: "DELETE" })
    if (res.ok) {
      setPlantillas((prev) => prev.filter((p) => p.id !== id))
      toast.success("Plantilla eliminada")
    } else {
      toast.error("Error al eliminar")
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/configuracion" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles size={20} style={{ color: "var(--brand)" }} /> Asistente de IA para informes
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define cómo la IA redacta tus notas clínicas y guarda informes modelo de referencia.
          </p>
        </div>
      </div>

      {/* Instrucciones globales */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Instrucciones de estilo</h2>
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-600">Instrucciones personalizadas</Label>
          <Textarea
            value={instrucciones}
            onChange={(e) => setInstrucciones(e.target.value)}
            rows={4}
            placeholder="Ej: Usa un tono cálido pero técnico. Incluye siempre una sección de objetivos terapéuticos. Evita tecnicismos excesivos..."
          />
          <p className="text-xs text-gray-400">Estas instrucciones se aplican a todos los informes que genere la IA.</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-600">Informe modelo por defecto (opcional)</Label>
          <Textarea
            value={ejemplo}
            onChange={(e) => setEjemplo(e.target.value)}
            rows={6}
            placeholder="Pega aquí un informe ideal que represente tu estilo. La IA lo usará como referencia cuando no elijas una plantilla específica."
          />
        </div>
        <Button onClick={guardarConfig} disabled={guardando} className="text-white" style={{ backgroundColor: "var(--brand)" }}>
          {guardando ? <Loader2 size={15} className="animate-spin mr-2" /> : <Save size={15} className="mr-2" />}
          Guardar configuración
        </Button>
      </div>

      {/* Plantillas / informes modelo */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Plantillas de informe</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Guarda distintos tipos de informe modelo (ej: evaluación inicial, informe de alta, informe de pareja). Podrás elegir cuál usar al generar cada nota.
          </p>
        </div>

        {/* Crear nueva */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">Nombre</Label>
              <Input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Ej: Evaluación inicial" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-gray-600">Descripción (opcional)</Label>
              <Input value={nuevaDesc} onChange={(e) => setNuevaDesc(e.target.value)} placeholder="Cuándo usar esta plantilla" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-600">Contenido del informe modelo</Label>
            <Textarea
              value={nuevoContenido}
              onChange={(e) => setNuevoContenido(e.target.value)}
              rows={5}
              placeholder="Pega el informe modelo completo que represente este tipo de documento..."
            />
          </div>
          <Button onClick={crearPlantilla} disabled={creando} variant="outline">
            {creando ? <Loader2 size={15} className="animate-spin mr-2" /> : <Plus size={15} className="mr-2" />}
            Agregar plantilla
          </Button>
        </div>

        {/* Lista */}
        {plantillas.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aún no tienes plantillas de informe.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {plantillas.map((p) => (
              <div key={p.id} className="py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{p.nombre}</p>
                  {p.descripcion && <p className="text-xs text-gray-400">{p.descripcion}</p>}
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{p.contenido.slice(0, 140)}…</p>
                </div>
                <button
                  onClick={() => eliminarPlantilla(p.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Eliminar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

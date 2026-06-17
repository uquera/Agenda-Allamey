"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ShieldCheck, Plus, Trash2, Loader2, ArrowLeft, Eye, EyeOff, Save, Download } from "lucide-react"
import Link from "next/link"
import { BRAND } from "@/lib/brand"

interface Clausula { id: string; titulo: string; texto: string; orden: number; activo: boolean }

const DEFAULTS: { titulo: string; texto: string }[] = [
  { titulo: "Naturaleza del servicio", texto: "Entiendo que los servicios psicológicos comprenden evaluación, orientación, psicoterapia individual, de pareja o grupal, y asesoría en sexología clínica. El objetivo es apoyar mi bienestar emocional, mental y sexual mediante técnicas basadas en evidencia." },
  { titulo: "Confidencialidad", texto: "Entiendo que toda la información compartida durante las sesiones es estrictamente confidencial. Solo se romperá la confidencialidad en casos establecidos por ley: riesgo inminente para mi vida o la de terceros, sospecha de abuso o maltrato de menores, o requerimiento legal formal de un tribunal competente." },
  { titulo: "Registro de sesiones", texto: "Acepto que se lleven notas de progreso clínico que forman parte de mi expediente. Estos registros son confidenciales y solo serán compartidos con mi consentimiento expreso o en los supuestos legales antes mencionados." },
  { titulo: "Cancelaciones y honorarios", texto: "Entiendo que las citas deben cancelarse o reprogramarse con un mínimo de 24 horas de anticipación. Las cancelaciones tardías o inasistencias sin previo aviso podrán ser objeto de cobro según la política vigente del consultorio." },
  { titulo: "Comunicación entre sesiones", texto: "Entiendo que la comunicación fuera de las sesiones (mensajes, llamadas, correos) se limitará a asuntos logísticos. Las consultas de carácter clínico se atenderán únicamente en las sesiones agendadas." },
  { titulo: "Consentimiento voluntario", texto: `Declaro que he leído y comprendido este documento, que participo voluntariamente en el proceso terapéutico y que puedo retirar mi consentimiento en cualquier momento. Autorizo a ${BRAND.name}, ${BRAND.specialty}, a brindarme los servicios descritos.` },
]

export default function ClausulasManager({ inicial }: { inicial: Clausula[] }) {
  const router = useRouter()
  const [clausulas, setClausulas] = useState(inicial)
  const [nuevoTitulo, setNuevoTitulo] = useState("")
  const [nuevoTexto, setNuevoTexto] = useState("")
  const [creando, setCreando] = useState(false)
  const [importando, setImportando] = useState(false)

  async function crear(titulo: string, texto: string) {
    const res = await fetch("/api/clausulas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, texto }),
    })
    return res.ok ? res.json() : null
  }

  async function agregar() {
    if (!nuevoTitulo.trim() || !nuevoTexto.trim()) {
      toast.error("Título y texto son requeridos")
      return
    }
    setCreando(true)
    const c = await crear(nuevoTitulo, nuevoTexto)
    setCreando(false)
    if (c) {
      setClausulas((prev) => [...prev, c])
      setNuevoTitulo(""); setNuevoTexto("")
      toast.success("Cláusula agregada")
    } else toast.error("Error al agregar")
  }

  async function importarDefaults() {
    setImportando(true)
    const creadas: Clausula[] = []
    for (const d of DEFAULTS) {
      const c = await crear(d.titulo, d.texto)
      if (c) creadas.push(c)
    }
    setImportando(false)
    setClausulas((prev) => [...prev, ...creadas])
    toast.success(`${creadas.length} cláusulas importadas`)
    router.refresh()
  }

  async function toggleActivo(c: Clausula) {
    const res = await fetch(`/api/clausulas/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !c.activo }),
    })
    if (res.ok) {
      const u = await res.json()
      setClausulas((prev) => prev.map((x) => (x.id === c.id ? { ...x, activo: u.activo } : x)))
    }
  }

  async function eliminar(id: string) {
    const res = await fetch(`/api/clausulas/${id}`, { method: "DELETE" })
    if (res.ok) {
      setClausulas((prev) => prev.filter((x) => x.id !== id))
      toast.success("Cláusula eliminada")
    } else toast.error("Error al eliminar")
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/configuracion" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck size={20} style={{ color: "var(--brand)" }} /> Cláusulas de consentimiento
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Edita los puntos del consentimiento informado que aceptan tus pacientes la primera vez.
          </p>
        </div>
      </div>

      {clausulas.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-xl bg-amber-50/40 p-5 text-center space-y-3">
          <p className="text-sm text-gray-600">
            Aún no hay cláusulas personalizadas. Mientras tanto, los pacientes ven el consentimiento por defecto.
          </p>
          <Button onClick={importarDefaults} disabled={importando} variant="outline">
            {importando ? <Loader2 size={15} className="animate-spin mr-2" /> : <Download size={15} className="mr-2" />}
            Importar las 6 cláusulas por defecto para editarlas
          </Button>
        </div>
      )}

      {/* Lista */}
      {clausulas.length > 0 && (
        <div className="space-y-2">
          {clausulas.map((c) => (
            <ClausulaRow key={c.id} clausula={c} onToggle={() => toggleActivo(c)} onDelete={() => eliminar(c.id)}
              onSaved={(u) => setClausulas((prev) => prev.map((x) => (x.id === c.id ? u : x)))} />
          ))}
        </div>
      )}

      {/* Crear nueva */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Agregar cláusula</h2>
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-600">Título</Label>
          <Input value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} placeholder="Ej: Uso de datos personales" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm text-gray-600">Texto</Label>
          <Textarea value={nuevoTexto} onChange={(e) => setNuevoTexto(e.target.value)} rows={3} placeholder="Redacta el punto que el paciente debe aceptar..." />
        </div>
        <Button onClick={agregar} disabled={creando} variant="outline">
          {creando ? <Loader2 size={15} className="animate-spin mr-2" /> : <Plus size={15} className="mr-2" />}
          Agregar cláusula
        </Button>
      </div>
    </div>
  )
}

function ClausulaRow({
  clausula, onToggle, onDelete, onSaved,
}: {
  clausula: Clausula
  onToggle: () => void
  onDelete: () => void
  onSaved: (c: Clausula) => void
}) {
  const [editando, setEditando] = useState(false)
  const [titulo, setTitulo] = useState(clausula.titulo)
  const [texto, setTexto] = useState(clausula.texto)
  const [guardando, setGuardando] = useState(false)

  async function guardar() {
    setGuardando(true)
    const res = await fetch(`/api/clausulas/${clausula.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, texto }),
    })
    setGuardando(false)
    if (res.ok) {
      onSaved(await res.json())
      setEditando(false)
      toast.success("Cláusula actualizada")
    } else toast.error("Error al guardar")
  }

  return (
    <div className={`border rounded-xl bg-white shadow-sm p-4 ${clausula.activo ? "border-gray-100" : "border-gray-200 bg-gray-50/60"}`}>
      {editando ? (
        <div className="space-y-2">
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} />
          <div className="flex gap-2">
            <Button onClick={guardar} disabled={guardando} size="sm" className="text-white" style={{ backgroundColor: "var(--brand)" }}>
              {guardando ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Save size={14} className="mr-1.5" />} Guardar
            </Button>
            <Button onClick={() => { setEditando(false); setTitulo(clausula.titulo); setTexto(clausula.texto) }} size="sm" variant="ghost">Cancelar</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-700">{clausula.titulo}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{clausula.texto}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onToggle} title={clausula.activo ? "Activa" : "Inactiva"}
              className={`p-1.5 rounded-lg transition-colors ${clausula.activo ? "text-green-600 hover:bg-green-50" : "text-gray-300 hover:bg-gray-100"}`}>
              {clausula.activo ? <Eye size={15} /> : <EyeOff size={15} />}
            </button>
            <button onClick={() => setEditando(true)} className="text-xs text-gray-400 hover:text-gray-700 px-2">Editar</button>
            <button onClick={onDelete} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

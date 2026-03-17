"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, FileText, Video, Link as LinkIcon, Music, Dumbbell, Users, Loader2, Trash2, Pencil, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

interface Material {
  id: string
  titulo: string
  descripcion?: string | null
  tipo: string
  contenido?: string | null
  archivoUrl?: string | null
  activo: boolean
  totalAsignaciones: number
  createdAt: string
}

interface Paciente {
  id: string
  nombre: string
}

interface Props {
  materiales: Material[]
  pacientes: Paciente[]
}

const tipoIcono: Record<string, React.ElementType> = {
  PDF: FileText,
  VIDEO: Video,
  ARTICULO: LinkIcon,
  EJERCICIO: Dumbbell,
  AUDIO: Music,
}

const tipoColor: Record<string, { bg: string; text: string }> = {
  PDF: { bg: "#fff0f2", text: "#8B1A2C" },
  VIDEO: { bg: "#eff6ff", text: "#2563eb" },
  ARTICULO: { bg: "#ecfdf5", text: "#059669" },
  EJERCICIO: { bg: "#fffbeb", text: "#d97706" },
  AUDIO: { bg: "#f5f3ff", text: "#7c3aed" },
}

export default function MaterialesManager({ materiales, pacientes }: Props) {
  const router = useRouter()
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalEditar, setModalEditar] = useState<Material | null>(null)
  const [modalAsignar, setModalAsignar] = useState<Material | null>(null)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [renovandoId, setRenovandoId] = useState<string | null>(null)
  const [pacientesSeleccionados, setPacientesSeleccionados] = useState<string[]>([])

  const [form, setForm] = useState<{
    titulo: string
    descripcion: string
    tipo: string
    contenido: string
  }>({
    titulo: "",
    descripcion: "",
    tipo: "PDF",
    contenido: "",
  })

  const [formEditar, setFormEditar] = useState<{
    titulo: string
    descripcion: string
    tipo: string
    contenido: string
  }>({
    titulo: "",
    descripcion: "",
    tipo: "PDF",
    contenido: "",
  })

  function abrirEditar(m: Material) {
    setFormEditar({
      titulo: m.titulo,
      descripcion: m.descripcion || "",
      tipo: m.tipo,
      contenido: m.contenido || "",
    })
    setModalEditar(m)
  }

  async function guardarEdicion() {
    if (!modalEditar) return
    if (!formEditar.titulo) return toast.error("El título es requerido")
    setLoading(true)
    try {
      const res = await fetch(`/api/materiales/${modalEditar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formEditar),
      })
      if (!res.ok) throw new Error()
      toast.success("Material actualizado")
      setModalEditar(null)
      router.refresh()
    } catch {
      toast.error("Error al actualizar el material")
    } finally {
      setLoading(false)
    }
  }

  async function crearMaterial() {
    if (!form.titulo) return toast.error("El título es requerido")
    setLoading(true)
    try {
      const res = await fetch("/api/materiales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Material creado")
      setModalNuevo(false)
      setForm({ titulo: "", descripcion: "", tipo: "PDF", contenido: "" })
      router.refresh()
    } catch {
      toast.error("Error al crear el material")
    } finally {
      setLoading(false)
    }
  }

  async function asignarMaterial() {
    if (!modalAsignar || pacientesSeleccionados.length === 0) return
    setLoading(true)
    try {
      await Promise.all(
        pacientesSeleccionados.map((pacienteId) =>
          fetch("/api/materiales/asignar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ materialId: modalAsignar.id, pacienteId }),
          })
        )
      )
      toast.success(`Material asignado a ${pacientesSeleccionados.length} paciente(s)`)
      setModalAsignar(null)
      setPacientesSeleccionados([])
      router.refresh()
    } catch {
      toast.error("Error al asignar el material")
    } finally {
      setLoading(false)
    }
  }

  async function eliminarMaterial(id: string) {
    if (!confirm("¿Eliminar este material? Se quitará de todos los pacientes asignados.")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/materiales/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Material eliminado")
      router.refresh()
    } catch {
      toast.error("Error al eliminar el material")
    } finally {
      setDeletingId(null)
    }
  }

  async function renovarMaterial(id: string) {
    if (!confirm("¿Renovar este material? Aparecerá como 'Nuevo' para todos los pacientes asignados.")) return
    setRenovandoId(id)
    try {
      const res = await fetch(`/api/materiales/${id}/renovar`, { method: "POST" })
      if (!res.ok) throw new Error()
      toast.success("Material renovado — los pacientes lo verán como nuevo")
      router.refresh()
    } catch {
      toast.error("Error al renovar el material")
    } finally {
      setRenovandoId(null)
    }
  }

  function togglePaciente(id: string) {
    setPacientesSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  return (
    <>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Materiales didácticos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {materiales.length} material{materiales.length !== 1 ? "es" : ""} en la biblioteca
            </p>
          </div>
          <Button
            className="text-white h-9"
            style={{ backgroundColor: "#8B1A2C" }}
            onClick={() => setModalNuevo(true)}
          >
            <Plus size={16} className="mr-2" />
            Nuevo material
          </Button>
        </div>

        {materiales.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 mb-4">No hay materiales aún</p>
            <Button
              className="text-white"
              style={{ backgroundColor: "#8B1A2C" }}
              onClick={() => setModalNuevo(true)}
            >
              Crear primer material
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {materiales.map((m) => {
              const Icono = tipoIcono[m.tipo] || BookOpen
              const color = tipoColor[m.tipo] || { bg: "#f5f5f5", text: "#888" }
              return (
                <Card key={m.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: color.bg }}
                      >
                        <Icono size={18} style={{ color: color.text }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{m.titulo}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <Badge
                            className="text-xs px-2 py-0 hover:bg-transparent"
                            style={{ backgroundColor: color.bg, color: color.text }}
                          >
                            {m.tipo}
                          </Badge>
                          {m.descripcion && (
                            <span className="text-xs text-gray-400 truncate">{m.descripcion}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-center mr-1">
                          <p className="text-sm font-bold text-gray-700">{m.totalAsignaciones}</p>
                          <p className="text-xs text-gray-400">asign.</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => abrirEditar(m)}
                        >
                          <Pencil size={13} className="mr-1.5" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => {
                            setPacientesSeleccionados([])
                            setModalAsignar(m)
                          }}
                        >
                          <Users size={13} className="mr-1.5" />
                          Asignar
                        </Button>
                        {m.totalAsignaciones > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                            disabled={renovandoId === m.id}
                            onClick={() => renovarMaterial(m.id)}
                          >
                            {renovandoId === m.id
                              ? <Loader2 size={13} className="animate-spin" />
                              : <RefreshCw size={13} className="mr-1.5" />
                            }
                            Renovar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          disabled={deletingId === m.id}
                          onClick={() => eliminarMaterial(m.id)}
                        >
                          {deletingId === m.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} className="mr-1.5" />
                          }
                          Borrar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: Nuevo material */}
      <Dialog open={modalNuevo} onOpenChange={setModalNuevo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Título</Label>
              <Input
                placeholder="Nombre del material"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Tipo</Label>
              <Select value={form.tipo as string} onValueChange={(v) => v && setForm({ ...form, tipo: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["PDF", "VIDEO", "ARTICULO", "EJERCICIO", "AUDIO"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Descripción <span className="text-gray-400">(opcional)</span></Label>
              <Textarea
                placeholder="Breve descripción..."
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">
                {form.tipo === "ARTICULO" ? "URL del artículo" :
                 form.tipo === "VIDEO" ? "URL del video (YouTube, Vimeo...)" :
                 form.tipo === "AUDIO" ? "URL del audio" :
                 "Enlace"}{" "}
                <span className="text-gray-400">(opcional)</span>
              </Label>
              <Input
                placeholder="https://..."
                value={form.contenido}
                onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setModalNuevo(false)} className="flex-1 h-9">
                Cancelar
              </Button>
              <Button
                onClick={crearMaterial}
                disabled={loading || !form.titulo}
                className="flex-1 h-9 text-white"
                style={{ backgroundColor: "#8B1A2C" }}
              >
                {loading && <Loader2 size={14} className="animate-spin mr-1" />}
                Crear material
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar material */}
      <Dialog open={!!modalEditar} onOpenChange={() => setModalEditar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Título</Label>
              <Input
                placeholder="Nombre del material"
                value={formEditar.titulo}
                onChange={(e) => setFormEditar({ ...formEditar, titulo: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Tipo</Label>
              <Select value={formEditar.tipo} onValueChange={(v) => v && setFormEditar({ ...formEditar, tipo: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["PDF", "VIDEO", "ARTICULO", "EJERCICIO", "AUDIO"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Descripción <span className="text-gray-400">(opcional)</span></Label>
              <Textarea
                placeholder="Breve descripción..."
                value={formEditar.descripcion}
                onChange={(e) => setFormEditar({ ...formEditar, descripcion: e.target.value })}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">
                {formEditar.tipo === "ARTICULO" ? "URL del artículo" :
                 formEditar.tipo === "VIDEO" ? "URL del video (YouTube, Vimeo...)" :
                 formEditar.tipo === "AUDIO" ? "URL del audio" :
                 "Enlace"}{" "}
                <span className="text-gray-400">(opcional)</span>
              </Label>
              <Input
                placeholder="https://..."
                value={formEditar.contenido}
                onChange={(e) => setFormEditar({ ...formEditar, contenido: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setModalEditar(null)} className="flex-1 h-9">
                Cancelar
              </Button>
              <Button
                onClick={guardarEdicion}
                disabled={loading || !formEditar.titulo}
                className="flex-1 h-9 text-white"
                style={{ backgroundColor: "#8B1A2C" }}
              >
                {loading && <Loader2 size={14} className="animate-spin mr-1" />}
                Guardar cambios
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Asignar a pacientes */}
      <Dialog open={!!modalAsignar} onOpenChange={() => setModalAsignar(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar material</DialogTitle>
          </DialogHeader>
          {modalAsignar && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800">{modalAsignar.titulo}</p>
                <p className="text-xs text-gray-400 mt-0.5">{modalAsignar.tipo}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Seleccionar pacientes</Label>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {pacientes.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => togglePaciente(p.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-sm text-left transition-colors ${
                        pacientesSeleccionados.includes(p.id)
                          ? "text-white"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                      }`}
                      style={
                        pacientesSeleccionados.includes(p.id)
                          ? { backgroundColor: "#8B1A2C" }
                          : undefined
                      }
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          pacientesSeleccionados.includes(p.id) ? "bg-white/20" : ""
                        }`}
                        style={
                          !pacientesSeleccionados.includes(p.id)
                            ? { backgroundColor: "#fff0f2", color: "#8B1A2C" }
                            : undefined
                        }
                      >
                        {p.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      {p.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setModalAsignar(null)}
                  className="flex-1 h-9"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={asignarMaterial}
                  disabled={loading || pacientesSeleccionados.length === 0}
                  className="flex-1 h-9 text-white"
                  style={{ backgroundColor: "#8B1A2C" }}
                >
                  {loading && <Loader2 size={14} className="animate-spin mr-1" />}
                  Asignar ({pacientesSeleccionados.length})
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

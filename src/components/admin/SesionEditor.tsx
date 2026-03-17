"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TiptapImage from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Bold, Italic, List, ListOrdered, Heading2, Undo, Redo,
  Save, Eye, EyeOff, FileDown, Loader2, ArrowLeft, User,
  ImageIcon, Paperclip, FileSpreadsheet, FileText, File, Trash2, ExternalLink, Music,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface Archivo {
  id: string
  nombre: string
  tipo: string
  url: string
  tamano: number | null
  createdAt: string
}

interface Props {
  sesion: {
    id: string
    titulo: string
    tipoSesion: string
    contenido: string
    recomendacion?: string | null
    cantidadSesiones?: number | null
    estadoSeguimiento?: string | null
    publicado: boolean
    fechaSesion: string
    pdfUrl?: string | null
    paciente: { nombre: string; email: string }
  }
}

const ESTADOS_SEGUIMIENTO = [
  { value: "AGENDADA", label: "Agendada", color: "bg-blue-100 text-blue-700" },
  { value: "CUMPLIDA", label: "Cumplida", color: "bg-green-100 text-green-700" },
  { value: "REPROGRAMAR", label: "Reprogramar", color: "bg-amber-100 text-amber-700" },
  { value: "CANCELADA", label: "Cancelada", color: "bg-red-100 text-red-700" },
]

function formatBytes(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const tipoIcono: Record<string, React.ReactNode> = {
  excel: <FileSpreadsheet size={16} className="text-green-600" />,
  word: <FileText size={16} className="text-blue-600" />,
  pdf: <FileText size={16} className="text-red-500" />,
  imagen: <ImageIcon size={16} className="text-pink-500" />,
  audio: <Music size={16} className="text-violet-500" />,
  otro: <File size={16} className="text-gray-400" />,
}

const tipoColor: Record<string, string> = {
  excel: "bg-green-50",
  word: "bg-blue-50",
  pdf: "bg-red-50",
  imagen: "bg-pink-50",
  audio: "bg-violet-50",
  otro: "bg-gray-50",
}

export default function SesionEditor({ sesion }: Props) {
  const router = useRouter()
  const [titulo, setTitulo] = useState(sesion.titulo)
  const [tipoSesion, setTipoSesion] = useState(sesion.tipoSesion || "INDIVIDUAL")
  const [recomendacion, setRecomendacion] = useState(sesion.recomendacion || "")
  const [cantidadSesiones, setCantidadSesiones] = useState(sesion.cantidadSesiones?.toString() || "")
  const [estadoSeguimiento, setEstadoSeguimiento] = useState(sesion.estadoSeguimiento || "")
  const [publicado, setPublicado] = useState(sesion.publicado)
  const [saving, setSaving] = useState(false)
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)

  // Cargar archivos adjuntos al montar
  useEffect(() => {
    fetch(`/api/sesiones/${sesion.id}/archivos`)
      .then((r) => r.json())
      .then(setArchivos)
      .catch(() => {})
  }, [sesion.id])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TiptapImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder: "Escribe aquí las notas y el resumen de la sesión...",
      }),
    ],
    content: sesion.contenido,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none text-gray-700",
      },
    },
  })

  // Subir imagen e insertarla en el editor
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !editor) return
      setSubiendoImagen(true)
      const fd = new FormData()
      fd.append("file", file)
      try {
        const res = await fetch(`/api/sesiones/${sesion.id}/archivos`, { method: "POST", body: fd })
        if (!res.ok) throw new Error()
        const nuevo: Archivo = await res.json()
        editor.chain().focus().setImage({ src: nuevo.url, alt: nuevo.nombre }).run()
        setArchivos((prev) => [...prev, nuevo])
        toast.success("Imagen insertada en el editor")
      } catch {
        toast.error("Error al subir imagen")
      } finally {
        setSubiendoImagen(false)
        if (imgInputRef.current) imgInputRef.current.value = ""
      }
    },
    [editor, sesion.id]
  )

  // Subir documento (Excel, Word, etc.)
  const handleDocUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (!files.length) return
      setSubiendoArchivo(true)
      let ok = 0
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        try {
          const res = await fetch(`/api/sesiones/${sesion.id}/archivos`, { method: "POST", body: fd })
          if (!res.ok) throw new Error()
          const nuevo: Archivo = await res.json()
          setArchivos((prev) => [...prev, nuevo])
          ok++
        } catch {
          toast.error(`Error al subir ${file.name}`)
        }
      }
      if (ok > 0) toast.success(`${ok} archivo${ok > 1 ? "s" : ""} adjunto${ok > 1 ? "s" : ""}`)
      setSubiendoArchivo(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [sesion.id]
  )

  const eliminarArchivo = async (id: string) => {
    const res = await fetch(`/api/sesiones/archivos/${id}`, { method: "DELETE" })
    if (res.ok) {
      setArchivos((prev) => prev.filter((a) => a.id !== id))
      toast.success("Archivo eliminado")
    }
  }

  const guardar = useCallback(
    async (publicarAhora?: boolean) => {
      if (!editor) return
      setSaving(true)
      const nuevoPublicado = publicarAhora !== undefined ? publicarAhora : publicado
      try {
        const res = await fetch(`/api/sesiones/${sesion.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo, contenido: editor.getHTML(), publicado: nuevoPublicado,
            tipoSesion, recomendacion, cantidadSesiones, estadoSeguimiento,
          }),
        })
        if (!res.ok) throw new Error()
        if (publicarAhora && !publicado) {
          setPublicado(true)
          toast.success("Sesión publicada. El paciente ha sido notificado.")
        } else {
          toast.success("Guardado correctamente")
        }
        router.refresh()
      } catch {
        toast.error("Error al guardar")
      } finally {
        setSaving(false)
      }
    },
    [editor, titulo, publicado, sesion.id, router]
  )

  const generarPDF = useCallback(async () => {
    if (!editor) return
    setGenerandoPDF(true)
    try {
      const res = await fetch(`/api/sesiones/${sesion.id}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, contenido: editor.getHTML() }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success("PDF generado correctamente")
      window.open(data.pdfUrl, "_blank")
      router.refresh()
    } catch {
      toast.error("Error al generar el PDF")
    } finally {
      setGenerandoPDF(false)
    }
  }, [editor, titulo, sesion.id, router])

  if (!editor) return null

  const adjuntos = archivos

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/sesiones" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-800">Editor de sesión</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <User size={12} className="text-gray-400" />
            <p className="text-sm text-gray-500">
              {sesion.paciente.nombre} ·{" "}
              <span className="capitalize">
                {format(new Date(sesion.fechaSesion), "d 'de' MMMM 'de' yyyy", { locale: es })}
              </span>
            </p>
          </div>
        </div>
        <Badge className={`${publicado ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} hover:bg-opacity-100`}>
          {publicado ? "Publicado" : "Borrador"}
        </Badge>
      </div>

      {/* Título y metadatos de sesión */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Título del resumen</Label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="text-base font-semibold h-11" placeholder="Resumen de sesión..." />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Tipo de sesión</Label>
            <Select value={tipoSesion} onValueChange={setTipoSesion}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="PAREJA">Pareja</SelectItem>
                <SelectItem value="GRUPAL">Grupal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Estado de seguimiento</Label>
            <Select value={estadoSeguimiento} onValueChange={setEstadoSeguimiento}>
              <SelectTrigger><SelectValue placeholder="Sin estado" /></SelectTrigger>
              <SelectContent>
                {ESTADOS_SEGUIMIENTO.map(e => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 p-2 border-b border-gray-100 bg-gray-50 flex-wrap">
          {[
            { icon: Bold, title: "Negrita", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
            { icon: Italic, title: "Cursiva", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
            { icon: Heading2, title: "Título", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
            { icon: List, title: "Lista", action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
            { icon: ListOrdered, title: "Lista numerada", action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
          ].map((btn) => (
            <button
              key={btn.title} title={btn.title} onClick={btn.action}
              className={`p-1.5 rounded-lg transition-colors ${btn.active ? "text-white" : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"}`}
              style={btn.active ? { backgroundColor: "#8B1A2C" } : {}}
            >
              <btn.icon size={16} />
            </button>
          ))}

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Insertar imagen */}
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <button
            title="Insertar imagen"
            onClick={() => imgInputRef.current?.click()}
            disabled={subiendoImagen}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-colors disabled:opacity-40"
          >
            {subiendoImagen ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-colors">
            <Undo size={16} />
          </button>
          <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 transition-colors">
            <Redo size={16} />
          </button>
        </div>

        <EditorContent editor={editor} />
      </div>

      {/* Adjuntos (Excel, Word, PDF, otros) */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Paperclip size={15} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Archivos adjuntos</span>
            {adjuntos.length > 0 && (
              <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{adjuntos.length}</span>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt,.pptx,.ppt,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.m4a,.aac,.flac"
              className="hidden"
              onChange={handleDocUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendoArchivo}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {subiendoArchivo ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
              {subiendoArchivo ? "Subiendo..." : "Adjuntar archivo"}
            </button>
          </div>
        </div>

        {adjuntos.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400">Sin archivos adjuntos</p>
            <p className="text-xs text-gray-300 mt-0.5">Soporta Excel, Word, PDF y más</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {adjuntos.map((a) => (
              <div key={a.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                {/* Audio: reproductor inline */}
                {a.tipo === "audio" && (
                  <div className="mb-2">
                    <audio controls src={a.url} className="w-full h-9" style={{ accentColor: "#8B1A2C" }} />
                  </div>
                )}
                {/* Imagen: thumbnail */}
                {a.tipo === "imagen" && (
                  <div className="mb-2 rounded-lg overflow-hidden bg-gray-50 max-h-40">
                    <img src={a.url} alt={a.nombre} className="w-full object-contain max-h-40" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {a.tipo !== "audio" && a.tipo !== "imagen" && (
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tipoColor[a.tipo] ?? "bg-gray-50"}`}>
                      {tipoIcono[a.tipo] ?? tipoIcono.otro}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.nombre}</p>
                    {a.tamano && <p className="text-xs text-gray-400">{formatBytes(a.tamano)}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={a.url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Abrir">
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => eliminarArchivo(a.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recomendación clínica */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Recomendación al cierre de sesión</h3>
        <Textarea
          value={recomendacion}
          onChange={e => setRecomendacion(e.target.value)}
          placeholder="Indicaciones, continuidad del proceso, observaciones para la próxima sesión..."
          rows={3}
        />
        <div className="flex items-center gap-3">
          <Label className="text-sm text-gray-600 whitespace-nowrap">Sesiones propuestas</Label>
          <Input
            type="number" min={1} max={100}
            value={cantidadSesiones}
            onChange={e => setCantidadSesiones(e.target.value)}
            placeholder="Ej: 8"
            className="w-24"
          />
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => guardar()} disabled={saving} className="h-10">
          {saving ? <Loader2 size={15} className="animate-spin mr-2" /> : <Save size={15} className="mr-2" />}
          Guardar borrador
        </Button>
        <Button variant="outline" onClick={generarPDF} disabled={generandoPDF} className="h-10">
          {generandoPDF ? <Loader2 size={15} className="animate-spin mr-2" /> : <FileDown size={15} className="mr-2" />}
          Generar PDF
        </Button>
        {!publicado ? (
          <Button className="h-10 text-white" style={{ backgroundColor: "#8B1A2C" }} onClick={() => guardar(true)} disabled={saving}>
            <Eye size={15} className="mr-2" />
            Publicar para el paciente
          </Button>
        ) : (
          <Button variant="outline" className="h-10 text-gray-600" onClick={() => { setPublicado(false); guardar(false) }} disabled={saving}>
            <EyeOff size={15} className="mr-2" />
            Despublicar
          </Button>
        )}
      </div>
    </div>
  )
}

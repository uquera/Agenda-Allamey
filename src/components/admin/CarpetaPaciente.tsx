"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload,
  Link2,
  FileText,
  File,
  Globe,
  Trash2,
  ExternalLink,
  X,
  ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

type TipoArchivo = "DOCUMENTO" | "IMAGEN" | "URL" | "OTRO"

interface Archivo {
  id: string
  nombre: string
  tipo: TipoArchivo
  url: string
  tamano: number | null
  descripcion: string | null
  createdAt: string
}

interface CarpetaPacienteProps {
  pacienteId: string
}

const TABS: { key: "TODOS" | TipoArchivo; label: string }[] = [
  { key: "TODOS", label: "Todos" },
  { key: "DOCUMENTO", label: "Documentos" },
  { key: "IMAGEN", label: "Imágenes" },
  { key: "URL", label: "URLs" },
  { key: "OTRO", label: "Otros" },
]

function formatBytes(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ArchivoCard({
  archivo,
  onDelete,
}: {
  archivo: Archivo
  onDelete: (id: string) => void
}) {
  const [confirmando, setConfirmando] = useState(false)
  const fecha = format(new Date(archivo.createdAt), "d MMM yyyy", { locale: es })

  const iconBg: Record<TipoArchivo, string> = {
    DOCUMENTO: "bg-blue-50",
    IMAGEN: "bg-pink-50",
    URL: "bg-purple-50",
    OTRO: "bg-gray-50",
  }
  const iconColor: Record<TipoArchivo, string> = {
    DOCUMENTO: "text-blue-600",
    IMAGEN: "text-pink-600",
    URL: "text-purple-600",
    OTRO: "text-gray-400",
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
      {/* Thumbnail or icon */}
      {archivo.tipo === "IMAGEN" ? (
        <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-50">
          <img
            src={archivo.url}
            alt={archivo.nombre}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg[archivo.tipo]}`}
        >
          {archivo.tipo === "DOCUMENTO" && (
            <FileText size={18} className={iconColor[archivo.tipo]} />
          )}
          {archivo.tipo === "URL" && (
            <Globe size={18} className={iconColor[archivo.tipo]} />
          )}
          {archivo.tipo === "OTRO" && (
            <File size={18} className={iconColor[archivo.tipo]} />
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium text-gray-800 truncate"
          title={archivo.nombre}
        >
          {archivo.nombre}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400">{fecha}</span>
          {archivo.tamano ? (
            <span className="text-xs text-gray-300">
              · {formatBytes(archivo.tamano)}
            </span>
          ) : null}
        </div>
        {archivo.descripcion && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {archivo.descripcion}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
        <a
          href={archivo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ExternalLink size={12} />
          {archivo.tipo === "URL" ? "Abrir enlace" : "Ver archivo"}
        </a>
        {!confirmando ? (
          <button
            onClick={() => setConfirmando(true)}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={13} />
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={() => onDelete(archivo.id)}
              className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
            >
              Eliminar
            </button>
            <button
              onClick={() => setConfirmando(false)}
              className="px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CarpetaPaciente({ pacienteId }: CarpetaPacienteProps) {
  const [archivos, setArchivos] = useState<Archivo[]>([])
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState<"TODOS" | TipoArchivo>("TODOS")
  const [subiendo, setSubiendo] = useState(false)
  const [modalUrl, setModalUrl] = useState(false)
  const [urlForm, setUrlForm] = useState({ url: "", nombre: "", descripcion: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/pacientes/${pacienteId}/archivos`)
      .then((r) => r.json())
      .then((data) => {
        setArchivos(data)
        setCargando(false)
      })
      .catch(() => {
        toast.error("Error cargando archivos")
        setCargando(false)
      })
  }, [pacienteId])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setSubiendo(true)
    let exitos = 0

    for (const file of files) {
      const fd = new FormData()
      fd.append("file", file)
      try {
        const res = await fetch(`/api/pacientes/${pacienteId}/archivos`, {
          method: "POST",
          body: fd,
        })
        if (res.ok) {
          const nuevo = await res.json()
          setArchivos((prev) => [nuevo, ...prev])
          exitos++
        } else {
          toast.error(`Error subiendo ${file.name}`)
        }
      } catch {
        toast.error(`Error subiendo ${file.name}`)
      }
    }

    if (exitos > 0) {
      toast.success(
        `${exitos} archivo${exitos > 1 ? "s" : ""} subido${exitos > 1 ? "s" : ""} correctamente`
      )
    }
    setSubiendo(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const agregarUrl = async () => {
    if (!urlForm.url || !urlForm.nombre) {
      toast.error("URL y nombre son requeridos")
      return
    }
    const res = await fetch(`/api/pacientes/${pacienteId}/archivos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(urlForm),
    })
    if (res.ok) {
      const nuevo = await res.json()
      setArchivos((prev) => [nuevo, ...prev])
      setUrlForm({ url: "", nombre: "", descripcion: "" })
      setModalUrl(false)
      toast.success("Enlace agregado")
    } else {
      toast.error("Error al agregar enlace")
    }
  }

  const eliminar = async (id: string) => {
    const res = await fetch(`/api/archivos/${id}`, { method: "DELETE" })
    if (res.ok) {
      setArchivos((prev) => prev.filter((a) => a.id !== id))
      toast.success("Archivo eliminado")
    } else {
      toast.error("Error al eliminar")
    }
  }

  const filtrados =
    tab === "TODOS" ? archivos : archivos.filter((a) => a.tipo === tab)

  const counts = {
    TODOS: archivos.length,
    DOCUMENTO: archivos.filter((a) => a.tipo === "DOCUMENTO").length,
    IMAGEN: archivos.filter((a) => a.tipo === "IMAGEN").length,
    URL: archivos.filter((a) => a.tipo === "URL").length,
    OTRO: archivos.filter((a) => a.tipo === "OTRO").length,
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={subiendo}
          style={{ backgroundColor: "#8B1A2C" }}
          className="text-white gap-2 hover:opacity-90"
        >
          <Upload size={15} />
          {subiendo ? "Subiendo..." : "Subir archivos"}
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setModalUrl(true)}
        >
          <Link2 size={15} />
          Agregar enlace
        </Button>
        <span className="text-xs text-gray-400 ml-auto">
          {archivos.length} archivo{archivos.length !== 1 ? "s" : ""} en total
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-100 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? "border-[#8B1A2C] text-[#8B1A2C]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.key
                    ? "bg-[#fff0f2] text-[#8B1A2C]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {cargando ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Cargando archivos...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <Upload size={22} className="text-gray-200" />
          </div>
          <p className="text-sm text-gray-400">No hay archivos en esta categoría</p>
          <p className="text-xs text-gray-300 mt-1">
            Sube archivos o agrega enlaces usando los botones de arriba
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtrados.map((a) => (
            <ArchivoCard key={a.id} archivo={a} onDelete={eliminar} />
          ))}
        </div>
      )}

      {/* Modal agregar URL */}
      {modalUrl && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Globe size={16} className="text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Agregar enlace externo</h3>
              </div>
              <button
                onClick={() => setModalUrl(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  URL *
                </Label>
                <Input
                  placeholder="https://..."
                  value={urlForm.url}
                  onChange={(e) =>
                    setUrlForm((p) => ({ ...p, url: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Nombre *
                </Label>
                <Input
                  placeholder="Ej: Escala de ansiedad de Beck"
                  value={urlForm.nombre}
                  onChange={(e) =>
                    setUrlForm((p) => ({ ...p, nombre: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Descripción (opcional)
                </Label>
                <Input
                  placeholder="Notas sobre este enlace..."
                  value={urlForm.descripcion}
                  onChange={(e) =>
                    setUrlForm((p) => ({ ...p, descripcion: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setModalUrl(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 text-white hover:opacity-90"
                style={{ backgroundColor: "#8B1A2C" }}
                onClick={agregarUrl}
              >
                Agregar enlace
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

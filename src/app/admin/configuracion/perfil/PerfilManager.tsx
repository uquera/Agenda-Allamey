"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { UserCircle, Save, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Perfil {
  nombre: string
  especialidad: string
  bio: string
  fotoUrl: string
  infoServicio: string
  disclaimer: string
  telefono: string
  whatsapp: string
}

export default function PerfilManager({
  inicial,
  placeholders,
}: {
  inicial: Perfil
  placeholders: { nombre: string; especialidad: string; whatsapp: string }
}) {
  const [perfil, setPerfil] = useState(inicial)
  const [guardando, setGuardando] = useState(false)

  const set = (k: keyof Perfil) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setPerfil((p) => ({ ...p, [k]: e.target.value }))

  async function guardar() {
    setGuardando(true)
    const res = await fetch("/api/perfil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(perfil),
    })
    setGuardando(false)
    if (res.ok) toast.success("Perfil actualizado")
    else toast.error("Error al guardar")
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/configuracion" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UserCircle size={20} style={{ color: "var(--brand)" }} /> Mi perfil profesional
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Estos datos se muestran a tus pacientes. Si dejas un campo vacío se usa el valor por defecto.
          </p>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-600">Nombre</Label>
            <Input value={perfil.nombre} onChange={set("nombre")} placeholder={placeholders.nombre} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-600">Especialidad</Label>
            <Input value={perfil.especialidad} onChange={set("especialidad")} placeholder={placeholders.especialidad} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-gray-600">Foto (URL de la imagen)</Label>
          <Input value={perfil.fotoUrl} onChange={set("fotoUrl")} placeholder="https://..." />
          {perfil.fotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={perfil.fotoUrl} alt="Foto de perfil" className="mt-2 w-20 h-20 rounded-full object-cover border" />
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-gray-600">Biografía</Label>
          <Textarea value={perfil.bio} onChange={set("bio")} rows={3} placeholder="Reseña profesional, formación, enfoque terapéutico..." />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-gray-600">Información del servicio</Label>
          <Textarea value={perfil.infoServicio} onChange={set("infoServicio")} rows={3} placeholder="Qué incluye la sesión, duración, modalidades, qué esperar..." />
          <p className="text-xs text-gray-400">Se muestra al paciente cuando agenda una cita.</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm text-gray-600">Aviso / descargo (disclaimer)</Label>
          <Textarea value={perfil.disclaimer} onChange={set("disclaimer")} rows={2} placeholder="Aviso legal o condiciones que el paciente debe conocer." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-600">Teléfono</Label>
            <Input value={perfil.telefono} onChange={set("telefono")} placeholder="+58 ..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-600">WhatsApp (solo números)</Label>
            <Input value={perfil.whatsapp} onChange={set("whatsapp")} placeholder={placeholders.whatsapp} />
          </div>
        </div>

        <Button onClick={guardar} disabled={guardando} className="text-white" style={{ backgroundColor: "var(--brand)" }}>
          {guardando ? <Loader2 size={15} className="animate-spin mr-2" /> : <Save size={15} className="mr-2" />}
          Guardar perfil
        </Button>
      </div>
    </div>
  )
}

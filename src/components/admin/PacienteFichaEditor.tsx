"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Save, Loader2, User } from "lucide-react"

interface Props {
  pacienteId: string
  motivoConsulta?: string | null
  notas?: string | null
  ocupacion?: string | null
  genero?: string | null
  telefono?: string | null
  cedula?: string | null
}

export default function PacienteFichaEditor({
  pacienteId,
  motivoConsulta: motivoInit,
  notas: notasInit,
  ocupacion: ocupacionInit,
  genero: generoInit,
  telefono: telefonoInit,
  cedula: cedulaInit,
}: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    motivoConsulta: motivoInit || "",
    notas: notasInit || "",
    ocupacion: ocupacionInit || "",
    genero: generoInit || "",
    telefono: telefonoInit || "",
    cedula: cedulaInit || "",
  })

  async function guardar() {
    setSaving(true)
    try {
      const res = await fetch(`/api/pacientes/${pacienteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("Ficha actualizada")
      router.refresh()
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <User size={15} style={{ color: "var(--brand)" }} />
          Ficha del paciente
        </h2>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Número de RUT</Label>
          <Input
            value={form.cedula}
            onChange={(e) => setForm({ ...form, cedula: e.target.value })}
            placeholder="12345678-k"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Teléfono</Label>
          <Input
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="+58 412 000 0000"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Género</Label>
          <Input
            value={form.genero}
            onChange={(e) => setForm({ ...form, genero: e.target.value })}
            placeholder="Femenino / Masculino / Otro"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Ocupación</Label>
          <Input
            value={form.ocupacion}
            onChange={(e) => setForm({ ...form, ocupacion: e.target.value })}
            placeholder="Profesión u ocupación"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Motivo de consulta</Label>
          <Textarea
            value={form.motivoConsulta}
            onChange={(e) => setForm({ ...form, motivoConsulta: e.target.value })}
            placeholder="Motivo principal..."
            rows={3}
            className="resize-none text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Notas clínicas privadas</Label>
          <Textarea
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Solo visible para ti..."
            rows={4}
            className="resize-none text-sm"
          />
        </div>

        <Button
          onClick={guardar}
          disabled={saving}
          className="w-full h-8 text-sm text-white"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin mr-1.5" />
          ) : (
            <Save size={13} className="mr-1.5" />
          )}
          Guardar ficha
        </Button>
      </CardContent>
    </Card>
  )
}

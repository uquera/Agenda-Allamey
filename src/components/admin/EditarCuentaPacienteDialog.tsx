"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Settings } from "lucide-react"

interface Props {
  pacienteId: string
  userId: string
  name: string
  email: string
  activo: boolean
}

export default function EditarCuentaPacienteDialog({ pacienteId, name, email, activo }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    name: name || "",
    email: email || "",
    password: "", // Solo se envía si se escribe algo
    activo: activo
  })

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/pacientes/${pacienteId}/cuenta`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al actualizar cuenta")
      
      toast.success("Cuenta actualizada exitosamente")
      setOpen(false)
      setForm({ ...form, password: "" })
      router.refresh()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Ocurrió un error inesperado")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="text-gray-600 bg-white shadow-sm border-gray-200" />}>
        <Settings size={14} className="mr-2" />
        Ajustes de Cuenta
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajustes de Cuenta</DialogTitle>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label>Nombre Completo</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Correo Electrónico</Label>
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nueva Contraseña (Opcional)</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Dejar en blanco para mantener la actual"
              minLength={6}
            />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="activo" 
              checked={form.activo} 
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="w-4 h-4 rounded text-[var(--brand)] focus:ring-[var(--brand)] cursor-pointer"
            />
            <Label htmlFor="activo" className="cursor-pointer">Paciente Activo</Label>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white"
            >
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, UserPlus } from "lucide-react"

export default function NuevoPacienteDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    telefono: "",
  })

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al crear paciente")
      
      toast.success("Paciente y cuenta creados exitosamente")
      setOpen(false)
      setForm({ name: "", email: "", password: "", telefono: "" })
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
      <DialogTrigger asChild>
        <Button className="bg-[#8B1A2C] hover:bg-[#6b1422] text-white">
          <UserPlus size={16} className="mr-2" />
          Nuevo Paciente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={guardar} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label>Nombre Completo</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej: María Pérez"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Correo Electrónico</Label>
            <Input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ejemplo@correo.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Contraseña Inicial</Label>
            <Input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono (Opcional)</Label>
            <Input
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="+58 412 000 0000"
            />
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
              className="bg-[#8B1A2C] hover:bg-[#6b1422] text-white"
            >
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Crear Paciente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

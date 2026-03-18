"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { UserPlus, ChevronRight, ChevronLeft, Check } from "lucide-react"

const PAISES = [
  "Venezuela", "Colombia", "México", "Argentina", "Chile", "Perú", "Ecuador",
  "Bolivia", "Paraguay", "Uruguay", "Brasil", "España", "Estados Unidos",
  "Canadá", "Otro",
]

const PASOS = ["Cuenta", "Datos personales", "Clínico"]

export default function NuevoPacienteDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [paso, setPaso] = useState(0)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: "", email: "", password: "",
    telefono: "", fechaNacimiento: "", genero: "",
    ocupacion: "", direccion: "", pais: "",
    quienRemite: "", primeraConsulta: true, motivoConsulta: "",
  })

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function resetForm() {
    setForm({
      name: "", email: "", password: "",
      telefono: "", fechaNacimiento: "", genero: "",
      ocupacion: "", direccion: "", pais: "",
      quienRemite: "", primeraConsulta: true, motivoConsulta: "",
    })
    setPaso(0)
  }

  function validarPaso(): boolean {
    if (paso === 0) {
      if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return false }
      if (!form.email.trim()) { toast.error("El email es obligatorio"); return false }
      if (!form.password.trim() || form.password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return false }
    }
    return true
  }

  async function handleSubmit() {
    if (!validarPaso()) return
    setLoading(true)
    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al crear paciente"); return }
      toast.success(`Paciente creado — Código: ${data.paciente?.codigo}`)
      setOpen(false)
      resetForm()
      router.refresh()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger render={<Button className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white" />}>
        <UserPlus className="w-4 h-4 mr-2" /> Nuevo Paciente
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar nuevo paciente</DialogTitle>
        </DialogHeader>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-1 mb-4">
          {PASOS.map((nombre, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors shrink-0 ${
                i < paso ? "bg-[var(--brand)] text-white" :
                i === paso ? "bg-[var(--brand)] text-white ring-2 ring-[var(--brand)]/30" :
                "bg-gray-100 text-gray-400"
              }`}>
                {i < paso ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block whitespace-nowrap ${i === paso ? "text-[var(--brand)] font-semibold" : "text-gray-400"}`}>
                {nombre}
              </span>
              {i < PASOS.length - 1 && <div className={`flex-1 h-px mx-1 ${i < paso ? "bg-[var(--brand)]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Paso 1: Cuenta */}
        {paso === 0 && (
          <div className="space-y-3">
            <div>
              <Label>Nombre completo *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ej: María González" />
            </div>
            <div>
              <Label>Correo electrónico *</Label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="paciente@email.com" />
            </div>
            <div>
              <Label>Contraseña inicial *</Label>
              <Input type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Mín. 6 caracteres" />
            </div>
          </div>
        )}

        {/* Paso 2: Datos personales */}
        {paso === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+58 412 000 0000" />
              </div>
              <div>
                <Label>Fecha de nacimiento</Label>
                <Input type="date" value={form.fechaNacimiento} onChange={e => set("fechaNacimiento", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Género</Label>
                <Select value={form.genero} onValueChange={v => v && set("genero", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="No binario">No binario</SelectItem>
                    <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ocupación</Label>
                <Input value={form.ocupacion} onChange={e => set("ocupacion", e.target.value)} placeholder="Ej: Docente" />
              </div>
            </div>
            <div>
              <Label>Dirección</Label>
              <Input value={form.direccion} onChange={e => set("direccion", e.target.value)} placeholder="Dirección de residencia" />
            </div>
            <div>
              <Label>País</Label>
              <Select value={form.pais} onValueChange={v => v && set("pais", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar país" /></SelectTrigger>
                <SelectContent>
                  {PAISES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Paso 3: Clínico */}
        {paso === 2 && (
          <div className="space-y-3">
            <div>
              <Label>¿Quién lo remite?</Label>
              <Input value={form.quienRemite} onChange={e => set("quienRemite", e.target.value)} placeholder="Médico, familiar, auto-referido..." />
            </div>
            <div className="flex items-center gap-3 py-2 border rounded-lg px-3">
              <Switch checked={form.primeraConsulta} onCheckedChange={v => set("primeraConsulta", v)} id="primera" />
              <Label htmlFor="primera" className="cursor-pointer">Primera vez que asiste a consulta</Label>
            </div>
            <div>
              <Label>Motivo de consulta</Label>
              <Textarea
                value={form.motivoConsulta}
                onChange={e => set("motivoConsulta", e.target.value)}
                placeholder="Descripción del motivo de consulta inicial..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Navegación */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => { if (paso === 0) { setOpen(false); resetForm() } else setPaso(p => p - 1) }}>
            {paso === 0 ? "Cancelar" : <><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</>}
          </Button>
          {paso < PASOS.length - 1 ? (
            <Button className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white" onClick={() => { if (validarPaso()) setPaso(p => p + 1) }}>
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white" onClick={handleSubmit} disabled={loading}>
              {loading ? "Guardando..." : "Crear paciente"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

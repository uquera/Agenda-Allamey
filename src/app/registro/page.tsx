"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2, Eye, EyeOff, ChevronRight, ChevronLeft, Check } from "lucide-react"

const PAISES = [
  "Venezuela", "Colombia", "México", "Argentina", "Chile", "Perú", "Ecuador",
  "Bolivia", "Paraguay", "Uruguay", "Brasil", "España", "Estados Unidos", "Canadá", "Otro",
]

const PASOS = ["Acceso", "Datos personales", "Clínico"]

export default function RegistroPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const [form, setForm] = useState({
    name: "", email: "", confirmEmail: "", password: "", confirmPassword: "",
    telefono: "", fechaNacimiento: "", genero: "", ocupacion: "", direccion: "", pais: "",
    quienRemite: "", primeraConsulta: true, motivoConsulta: "",
  })

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function validarPaso(): boolean {
    if (paso === 0) {
      if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return false }
      if (!form.email.trim()) { toast.error("El email es obligatorio"); return false }
      if (form.email !== form.confirmEmail) { toast.error("Los correos no coinciden"); return false }
      if (form.password.length < 6) { toast.error("La contraseña debe tener al menos 6 caracteres"); return false }
      if (form.password !== form.confirmPassword) { toast.error("Las contraseñas no coinciden"); return false }
    }
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al crear la cuenta")
      } else {
        toast.success("Cuenta creada. Ahora puedes iniciar sesión.")
        router.push("/login")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff0f2] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#8B1A2C" }}>ALLAMEY SANZ</h1>
          <p className="text-xs tracking-widest text-gray-400 mt-1">PSICÓLOGA CLÍNICA · SEXÓLOGA</p>
          <p className="text-gray-500 text-sm mt-3">Crea tu cuenta de paciente</p>
        </div>

        {/* Indicador pasos */}
        <div className="flex items-center gap-1 mb-6">
          {PASOS.map((nombre, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                i < paso ? "bg-[#8B1A2C] text-white" :
                i === paso ? "bg-[#8B1A2C] text-white ring-2 ring-[#8B1A2C]/30" :
                "bg-gray-100 text-gray-400"
              }`}>
                {i < paso ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block whitespace-nowrap ${i === paso ? "text-[#8B1A2C] font-semibold" : "text-gray-400"}`}>
                {nombre}
              </span>
              {i < PASOS.length - 1 && <div className={`flex-1 h-px mx-1 ${i < paso ? "bg-[#8B1A2C]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Paso 1: Acceso */}
        {paso === 0 && (
          <div className="space-y-4">
            <div>
              <Label>Nombre completo *</Label>
              <Input className="h-11 mt-1" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Tu nombre y apellido" />
            </div>
            <div>
              <Label>Correo electrónico *</Label>
              <Input type="email" className="h-11 mt-1" value={form.email} onChange={e => set("email", e.target.value)} placeholder="tu@email.com" />
            </div>
            <div>
              <Label>Confirmar correo *</Label>
              <Input
                type="email" className={`h-11 mt-1 ${form.confirmEmail && form.email !== form.confirmEmail ? "border-red-400" : ""}`}
                value={form.confirmEmail} onChange={e => set("confirmEmail", e.target.value)}
                onPaste={e => e.preventDefault()} placeholder="Repite tu correo"
              />
              {form.confirmEmail && form.email !== form.confirmEmail && (
                <p className="text-xs text-red-500 mt-1">Los correos no coinciden</p>
              )}
            </div>
            <div>
              <Label>Contraseña *</Label>
              <div className="relative mt-1">
                <Input type={showPass ? "text" : "password"} className="h-11 pr-10"
                  value={form.password} onChange={e => set("password", e.target.value)} placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirmar contraseña *</Label>
              <Input type="password" className="h-11 mt-1" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} placeholder="Repite tu contraseña" />
            </div>
          </div>
        )}

        {/* Paso 2: Datos personales */}
        {paso === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Teléfono</Label>
                <Input className="mt-1" value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+58 412 000 0000" />
              </div>
              <div>
                <Label>Fecha de nacimiento</Label>
                <Input type="date" className="mt-1" value={form.fechaNacimiento} onChange={e => set("fechaNacimiento", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Género</Label>
                <Select value={form.genero} onValueChange={v => set("genero", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
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
                <Input className="mt-1" value={form.ocupacion} onChange={e => set("ocupacion", e.target.value)} placeholder="Ej: Docente" />
              </div>
            </div>
            <div>
              <Label>Dirección</Label>
              <Input className="mt-1" value={form.direccion} onChange={e => set("direccion", e.target.value)} placeholder="Dirección de residencia" />
            </div>
            <div>
              <Label>País</Label>
              <Select value={form.pais} onValueChange={v => set("pais", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar país" /></SelectTrigger>
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
              <Label>¿Quién te remite? <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Input className="mt-1" value={form.quienRemite} onChange={e => set("quienRemite", e.target.value)} placeholder="Médico, familiar, auto-referido..." />
            </div>
            <div className="flex items-center gap-3 py-2 border rounded-lg px-3">
              <Switch checked={form.primeraConsulta} onCheckedChange={v => set("primeraConsulta", v)} id="primera" />
              <Label htmlFor="primera" className="cursor-pointer">Es mi primera consulta psicológica</Label>
            </div>
            <div>
              <Label>Motivo de consulta <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Textarea className="mt-1" value={form.motivoConsulta} onChange={e => set("motivoConsulta", e.target.value)}
                placeholder="Puedes describir brevemente por qué buscas apoyo psicológico..." rows={4} />
            </div>
          </div>
        )}

        {/* Navegación */}
        <div className="flex justify-between mt-6 gap-3">
          {paso > 0 ? (
            <Button variant="outline" onClick={() => setPaso(p => p - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Atrás
            </Button>
          ) : (
            <p className="text-sm text-gray-500 self-center">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: "#8B1A2C" }}>Inicia sesión</Link>
            </p>
          )}

          {paso < PASOS.length - 1 ? (
            <Button className="text-white" style={{ backgroundColor: "#8B1A2C" }}
              onClick={() => { if (validarPaso()) setPaso(p => p + 1) }}>
              Siguiente <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button className="text-white" style={{ backgroundColor: "#8B1A2C" }} onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Creando...</> : "Crear cuenta"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

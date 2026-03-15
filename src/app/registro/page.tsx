"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function RegistroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
    telefono: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.email !== form.confirmEmail) {
      toast.error("Los correos electrónicos no coinciden")
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          telefono: form.telefono,
        }),
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#8B1A2C" }}>
            ALLAMEY SANZ
          </h1>
          <p className="text-xs tracking-widest text-gray-400 mt-1">
            PSICÓLOGA CLÍNICA · SEXÓLOGA
          </p>
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800">Crear cuenta</h2>
            <p className="text-gray-500 text-sm mt-1">Regístrate como paciente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 font-medium">
              Nombre completo
            </Label>
            <Input
              id="name"
              placeholder="Tu nombre y apellido"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmEmail" className="text-gray-700 font-medium">
              Confirmar correo electrónico
            </Label>
            <Input
              id="confirmEmail"
              type="email"
              placeholder="Repite tu correo"
              value={form.confirmEmail}
              onChange={(e) => setForm({ ...form, confirmEmail: e.target.value })}
              onPaste={(e) => e.preventDefault()}
              required
              className={`h-11 ${form.confirmEmail && form.email !== form.confirmEmail ? "border-red-400 focus-visible:border-red-400" : form.confirmEmail && form.email === form.confirmEmail ? "border-green-400" : ""}`}
            />
            {form.confirmEmail && form.email !== form.confirmEmail && (
              <p className="text-xs text-red-500">Los correos no coinciden</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono" className="text-gray-700 font-medium">
              Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="telefono"
              placeholder="+58 412 000 0000"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-gray-700 font-medium">
              Confirmar contraseña
            </Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Repite tu contraseña"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 font-semibold text-white mt-2"
            style={{ backgroundColor: "#8B1A2C" }}
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin mr-2" /> Creando cuenta...</>
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "#8B1A2C" }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { BRAND } from "@/lib/brand"

export default function OlvideClavePage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setEnviado(true)
      } else {
        toast.error("Error al enviar el correo. Intenta de nuevo.")
      }
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "#f0fdf4" }}>
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Revisa tu correo</h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Si <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
          </div>
          <p className="text-xs text-gray-400">
            El enlace expira en 1 hora. Revisa también tu carpeta de spam.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--brand)" }}
          >
            <ArrowLeft size={14} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: "var(--brand-light)" }}>
          <Mail size={22} style={{ color: "var(--brand)" }} />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">¿Olvidaste tu contraseña?</h1>
        <p className="text-sm text-gray-500 mb-8">
          Ingresa tu correo y te enviaremos un enlace para crear una nueva.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-600 tracking-wide">
              CORREO ELECTRÓNICO
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 border-gray-200 bg-gray-50 focus-visible:bg-white focus-visible:ring-[var(--brand)]/20 focus-visible:border-[var(--brand)] transition-colors"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 font-semibold text-white text-base rounded-xl"
            style={{ backgroundColor: "var(--brand)" }}
          >
            {loading ? (
              <><Loader2 size={17} className="animate-spin mr-2" />Enviando...</>
            ) : (
              "Enviar enlace"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={14} />
            Volver al inicio de sesión
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-gray-300">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import { BRAND } from "@/lib/brand"
import { validarClave } from "@/lib/password"

function RestablecerForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [clave, setClave] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [showClave, setShowClave] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)
  const [errorClave, setErrorClave] = useState<string | null>(null)

  useEffect(() => {
    if (!token) router.replace("/login")
  }, [token, router])

  function onCambioClave(val: string) {
    setClave(val)
    setErrorClave(val.length > 0 ? validarClave(val) : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const err = validarClave(clave)
    if (err) { setErrorClave(err); return }

    if (clave !== confirmar) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, clave }),
      })
      const data = await res.json()
      if (res.ok) {
        setExito(true)
        setTimeout(() => router.push("/login"), 3000)
      } else {
        toast.error(data.error ?? "Error al restablecer la contraseña")
      }
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  if (exito) {
    return (
      <div className="text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "#f0fdf4" }}>
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">¡Contraseña actualizada!</h1>
          <p className="text-sm text-gray-500 mt-2">
            Serás redirigido al inicio de sesión en unos segundos...
          </p>
        </div>
        <Link href="/login" className="inline-block text-sm font-semibold" style={{ color: "var(--brand)" }}>
          Ir al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: "var(--brand-light)" }}>
        <KeyRound size={22} style={{ color: "var(--brand)" }} />
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">Nueva contraseña</h1>
      <p className="text-sm text-gray-500 mb-8">
        Crea una contraseña de al menos 4 caracteres (letras y/o números, sin secuencias como 123 o abc).
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-600 tracking-wide">NUEVA CONTRASEÑA</Label>
          <div className="relative">
            <Input
              type={showClave ? "text" : "password"}
              placeholder="Mínimo 4 caracteres"
              value={clave}
              onChange={(e) => onCambioClave(e.target.value)}
              required
              className="h-12 pr-11 border-gray-200 bg-gray-50 focus-visible:bg-white focus-visible:ring-[var(--brand)]/20 focus-visible:border-[var(--brand)] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowClave(!showClave)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showClave ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errorClave && (
            <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
              <AlertCircle size={12} />
              {errorClave}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-gray-600 tracking-wide">CONFIRMAR CONTRASEÑA</Label>
          <div className="relative">
            <Input
              type={showConfirmar ? "text" : "password"}
              placeholder="Repite tu contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              className="h-12 pr-11 border-gray-200 bg-gray-50 focus-visible:bg-white focus-visible:ring-[var(--brand)]/20 focus-visible:border-[var(--brand)] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirmar(!showConfirmar)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmar ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {confirmar.length > 0 && clave !== confirmar && (
            <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
              <AlertCircle size={12} />
              Las contraseñas no coinciden
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || !!errorClave}
          className="w-full h-12 font-semibold text-white text-base rounded-xl"
          style={{ backgroundColor: "var(--brand)" }}
        >
          {loading ? (
            <><Loader2 size={17} className="animate-spin mr-2" />Guardando...</>
          ) : (
            "Guardar nueva contraseña"
          )}
        </Button>
      </form>
    </>
  )
}

export default function RestablecerClavePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm">
        <Suspense fallback={<Loader2 className="animate-spin mx-auto" />}>
          <RestablecerForm />
        </Suspense>
        <p className="mt-10 text-center text-xs text-gray-300">
          © {new Date().getFullYear()} {BRAND.name}
        </p>
      </div>
    </div>
  )
}

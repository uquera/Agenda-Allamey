"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { BRAND } from "@/lib/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, ShieldCheck, Video, Bell } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      if (res?.error) {
        toast.error("Correo o contraseña incorrectos")
      } else {
        router.push("/")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo ── */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col items-center justify-between py-16 px-14 relative overflow-hidden"
        style={{ background: "linear-gradient(150deg, #8B1A2C 0%, #6B1220 55%, #3d0b15 100%)" }}
      >
        {/* Patrón geométrico — líneas diagonales */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 60" stroke="white" strokeWidth="1" fill="none"/>
              <path d="M 0 0 L 60 60" stroke="white" strokeWidth="1" fill="none"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Círculos de profundidad */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.06] bg-white" />
        <div className="absolute top-1/2 -translate-y-1/2 -right-24 w-64 h-64 rounded-full opacity-[0.07] bg-white" />

        {/* Contenido */}
        <div className="relative z-10 w-full max-w-md">
          {/* Credencial profesional */}
          <div className="flex items-center gap-2 mb-12">
            <div className="h-px flex-1 bg-white/20" />
            <span className="text-white/50 text-xs tracking-[3px] uppercase font-light">Portal Privado</span>
            <div className="h-px flex-1 bg-white/20" />
          </div>
        </div>

        {/* Logo + tagline centrado */}
        <div className="relative z-10 text-center flex-1 flex flex-col items-center justify-center">
          <div
            className="rounded-3xl p-7 mb-8 shadow-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.97)" }}
          >
            <Image
              src="/logo-vertical.png"
              alt={BRAND.name}
              width={240}
              height={240}
              className="mx-auto"
              priority
            />
          </div>

          <p className="text-white/70 text-base leading-relaxed max-w-xs">
            Un espacio seguro y confidencial para<br />
            tu bienestar emocional y sexual.
          </p>
        </div>

        {/* Bullets de beneficios */}
        <div className="relative z-10 w-full max-w-md space-y-3 mt-10">
          {[
            { icon: ShieldCheck, text: "Consultas 100% confidenciales" },
            { icon: Video,       text: "Sesiones online y presenciales" },
            { icon: Bell,        text: "Recordatorios automáticos por correo" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
              >
                <Icon size={15} className="text-white/80" />
              </div>
              <span className="text-white/75 text-sm">{text}</span>
            </div>
          ))}
        </div>

        {/* Copyright panel izquierdo */}
        <p className="relative z-10 mt-10 text-white/30 text-xs tracking-wide">
          © 2026 UQ EIRL — Todos los derechos reservados
        </p>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-10">
            <Image
              src="/logo-vertical.png"
              alt={BRAND.name}
              width={140}
              height={140}
              className="mx-auto mb-3"
            />
          </div>

          {/* Encabezado */}
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[3px] uppercase mb-2" style={{ color: "var(--brand)" }}>
              Bienvenido de nuevo
            </p>
            <h1 className="text-3xl font-bold text-gray-800 leading-tight">
              Inicia sesión
            </h1>
            <p className="text-gray-400 text-sm mt-2">
              Accede a tu portal personalizado
            </p>
          </div>

          {/* Separador */}
          <div className="h-px bg-gray-100 mb-8" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-600 tracking-wide">
                CORREO ELECTRÓNICO
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="h-12 border-gray-200 bg-gray-50 focus-visible:bg-white focus-visible:ring-[var(--brand)]/20 focus-visible:border-[var(--brand)] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-600 tracking-wide">
                CONTRASEÑA
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="h-12 pr-11 border-gray-200 bg-gray-50 focus-visible:bg-white focus-visible:ring-[var(--brand)]/20 focus-visible:border-[var(--brand)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 font-semibold text-white text-base rounded-xl shadow-md hover:shadow-lg transition-all mt-2"
              style={{ backgroundColor: "var(--brand)" }}
            >
              {loading ? (
                <><Loader2 size={17} className="animate-spin mr-2" /> Ingresando...</>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          {/* Separador */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-300">o</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <div className="space-y-3 text-center">
            <p className="text-sm text-gray-500">
              ¿No tienes cuenta?{" "}
              <Link
                href="/registro"
                className="font-semibold hover:underline"
                style={{ color: "var(--brand)" }}
              >
                Regístrate aquí
              </Link>
            </p>
            <p className="text-sm text-gray-400">
              <Link
                href="/olvide-clave"
                className="hover:underline"
                style={{ color: "var(--brand)" }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
          </div>

          {/* Copyright mobile */}
          <p className="lg:hidden mt-10 text-center text-xs text-gray-300">
            © 2026 UQ EIRL — Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* ── Botón flotante WhatsApp ── */}
      <a
        href="https://wa.me/584149009020"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 h-14 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
        style={{ backgroundColor: "#25D366" }}
        title="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="white" width="24" height="24" className="shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-white text-sm font-semibold pr-1">WhatsApp</span>
      </a>

    </div>
  )
}

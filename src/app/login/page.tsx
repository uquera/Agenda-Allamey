import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { BRAND } from "@/lib/brand"

export const metadata: Metadata = {
  title: "En memoria de Allamey Sanz",
  description:
    "Con profundo cariño despedimos a Allamey Sanz, Psicóloga Clínica y Sexóloga. Gracias por acompañarnos.",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
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
          <div className="flex items-center gap-2 mb-12">
            <div className="h-px flex-1 bg-white/20" />
            <span className="text-white/50 text-xs tracking-[3px] uppercase font-light">En memoria</span>
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
            Gracias por tanto, Allamey.<br />
            Tu luz seguirá acompañándonos.
          </p>
        </div>

        {/* Copyright panel izquierdo */}
        <p className="relative z-10 mt-10 text-white/30 text-xs tracking-wide">
          © 2026 UQ EIRL — Todos los derechos reservados
        </p>
      </div>

      {/* ── Panel derecho — despedida para pacientes ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md text-center">

          {/* Logo mobile */}
          <div className="lg:hidden mb-8">
            <Image
              src="/logo-vertical.png"
              alt={BRAND.name}
              width={140}
              height={140}
              className="mx-auto"
            />
          </div>

          <p className="text-xs font-semibold tracking-[3px] uppercase mb-3" style={{ color: "var(--brand)" }}>
            En memoria de
          </p>
          <h1 className="text-3xl font-bold text-gray-800 leading-tight mb-2">
            Allamey Sanz
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Psicóloga Clínica · Sexóloga
          </p>

          <div className="h-px bg-gray-100 mb-8" />

          <div className="space-y-5 text-gray-600 leading-relaxed">
            <p>
              Con profundo dolor despedimos a Allamey, quien partió dejando una
              huella imborrable en cada persona que acompañó.
            </p>
            <p>
              A sus pacientes: ella creyó en ustedes, los escuchó sin juicios y
              celebró cada uno de sus avances. Ese cariño y todo lo que aprendieron
              juntos no se va con ella — vive en cada paso que sigan dando.
            </p>
            <p className="font-medium text-gray-700">
              Gracias, Allamey, por tu entrega, tu calidez y tu luz.
              Te vamos a extrañar profundamente.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 my-8">
            <div className="h-px w-12 bg-gray-200" />
            <span style={{ color: "var(--brand)" }}>♥</span>
            <div className="h-px w-12 bg-gray-200" />
          </div>

          <p className="text-sm text-gray-400 italic">
            “Tu sonrisa, tu luz y tu amor vivirán siempre en nuestros corazones.”
          </p>

          <Link
            href="/"
            className="inline-block mt-10 text-sm font-medium hover:underline"
            style={{ color: "var(--brand)" }}
          >
            Volver al homenaje
          </Link>

          <p className="lg:hidden mt-10 text-center text-xs text-gray-300">
            © 2026 UQ EIRL — Todos los derechos reservados
          </p>
        </div>
      </div>

    </div>
  )
}

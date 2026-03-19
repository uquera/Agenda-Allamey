import { redirect } from "next/navigation"
import { auth } from "@/auth"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { CalendarDays, Heart, Users, Sparkles, ShieldCheck, BookOpen } from "lucide-react"

export const metadata: Metadata = {
  title: "Allamey Sanz | Psicóloga Clínica y Sexóloga en Venezuela",
  description:
    "Psicóloga clínica y sexóloga en Venezuela con atención online y presencial. Especialista en bienestar emocional, autoconocimiento, sexualidad y terapia de pareja. Agenda tu cita hoy.",
  alternates: { canonical: "https://psicoallameysanz.com" },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://psicoallameysanz.com/#persona",
      name: "Allamey Sanz",
      jobTitle: "Psicóloga Clínica y Sexóloga",
      description:
        "Psicóloga clínica y sexóloga en Venezuela especializada en bienestar emocional, sexualidad sana, terapia individual y de pareja.",
      url: "https://psicoallameysanz.com",
      image: "https://psicoallameysanz.com/logo-vertical.png",
      knowsAbout: [
        "Psicología Clínica",
        "Sexología",
        "Terapia Individual",
        "Terapia de Pareja",
        "Salud Mental",
        "Bienestar Emocional",
      ],
      areaServed: { "@type": "Country", name: "Venezuela" },
      availableLanguage: "Español",
    },
    {
      "@type": "MedicalBusiness",
      "@id": "https://psicoallameysanz.com/#negocio",
      name: "Allamey Sanz — Psicología y Sexología",
      description:
        "Consulta de psicología clínica y sexología en Venezuela. Atención individual, de pareja y grupal, modalidad online y presencial.",
      url: "https://psicoallameysanz.com",
      logo: "https://psicoallameysanz.com/logo-vertical.png",
      image: "https://psicoallameysanz.com/logo-vertical.png",
      telephone: "+58414-9009020",
      medicalSpecialty: ["Psicología Clínica", "Sexología"],
      availableService: [
        { "@type": "MedicalTherapy", name: "Terapia Individual" },
        { "@type": "MedicalTherapy", name: "Terapia de Pareja" },
        { "@type": "MedicalTherapy", name: "Terapia Grupal" },
        { "@type": "MedicalTherapy", name: "Sexología Clínica" },
      ],
      areaServed: { "@type": "Country", name: "Venezuela" },
      priceRange: "$$",
    },
  ],
}

const servicios = [
  {
    icon: Heart,
    titulo: "Terapia Individual",
    descripcion:
      "Un espacio seguro para explorar tus emociones, sanar heridas y construir una vida más plena.",
  },
  {
    icon: Users,
    titulo: "Terapia de Pareja",
    descripcion:
      "Reconecta y fortalece tu relación con herramientas concretas para una comunicación sana.",
  },
  {
    icon: Sparkles,
    titulo: "Sexología Clínica",
    descripcion:
      "Atención especializada en sexualidad con un enfoque libre de juicios, científico y humano.",
  },
  {
    icon: BookOpen,
    titulo: "Terapia Grupal",
    descripcion:
      "Aprende y crece junto a otras personas en procesos terapéuticos grupales guiados.",
  },
]

export default async function HomePage() {
  const session = await auth()
  if (session) {
    if (session.user.role === "ADMIN") redirect("/admin")
    redirect("/paciente")
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white font-sans">
        {/* Nav */}
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo-vertical.png" alt="Allamey Sanz" width={36} height={36} className="rounded-lg" />
              <div>
                <p className="font-bold text-sm text-gray-800 leading-none">Allamey Sanz</p>
                <p className="text-xs text-gray-400 leading-tight">Psicóloga · Sexóloga</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#8B1A2C" }}
              >
                Agendar cita
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span
              className="text-label inline-block px-3 py-1 rounded-full mb-4"
              style={{ backgroundColor: "#fff0f2", color: "#8B1A2C" }}
            >
              Psicóloga Clínica · Sexóloga · Venezuela
            </span>
            <h1 className="text-impact text-gray-900 mb-4">
              Tu bienestar emocional{" "}
              <span style={{ color: "#8B1A2C" }}>es una prioridad</span>
            </h1>
            <p className="text-body-light text-gray-500 mb-8 max-w-lg">
              Acompañamiento psicológico y sexológico personalizado, con enfoque humano
              y libre de juicios. Consultas online y presenciales en Venezuela.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/registro"
                className="btn-cta flex items-center gap-2 px-6 py-3 rounded-xl text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "#8B1A2C" }}
              >
                <CalendarDays size={16} />
                Solicitar primera cita
              </Link>
              <Link
                href="/login"
                className="btn-cta flex items-center gap-2 px-6 py-3 rounded-xl text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative w-72 h-80 rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="/inicio-banner.jpg"
                alt="Dra. Allamey Sanz — Psicóloga y Sexóloga en Venezuela"
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        </section>

        {/* Servicios */}
        <section className="py-16" style={{ backgroundColor: "#fff0f2" }} aria-labelledby="servicios-titulo">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-10">
              <h2 id="servicios-titulo" className="text-gray-900 mb-2">
                Servicios especializados
              </h2>
              <p className="text-desc text-gray-500">
                Atención integral en salud mental y sexualidad para personas y parejas en Venezuela
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {servicios.map((s) => (
                <article
                  key={s.titulo}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: "#fff0f2" }}
                  >
                    <s.icon size={20} style={{ color: "#8B1A2C" }} />
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm mb-2">{s.titulo}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.descripcion}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Por qué Allamey */}
        <section className="max-w-5xl mx-auto px-6 py-16" aria-labelledby="porque-titulo">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <div className="relative w-64 h-80 rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/materiales-banner.jpg"
                  alt="Consulta de psicología con Allamey Sanz en Venezuela"
                  fill
                  className="object-cover object-center"
                />
              </div>
            </div>
            <div>
              <h2 id="porque-titulo" className="text-gray-900 mb-4">
                Un enfoque que te pone en el centro
              </h2>
              <div className="space-y-4 text-gray-500">
                <p className="text-body-light">
                  Cada persona es única. Por eso el proceso terapéutico se construye
                  a tu medida, sin recetas genéricas ni juicios.
                </p>
                <p className="text-body-light">
                  Como psicóloga clínica y sexóloga en Venezuela, mi objetivo es que
                  entiendas tu historia, reconozcas tus recursos y construyas el bienestar
                  que mereces — a tu propio ritmo.
                </p>
                <ul className="space-y-2 mt-4">
                  {[
                    "Consultas online y presenciales",
                    "Atención individual, de pareja y grupal",
                    "Enfoque libre de juicios",
                    "Confidencialidad garantizada",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-gray-700 font-medium">
                      <ShieldCheck size={14} style={{ color: "#8B1A2C" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-16" style={{ backgroundColor: "#8B1A2C" }}>
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="text-impact text-white mb-3">
              Dar el primer paso es el acto más valiente
            </h2>
            <p className="text-body-light text-white/80 mb-8">
              Agenda tu primera consulta hoy. Atención psicológica y sexológica en Venezuela,
              online y presencial.
            </p>
            <Link
              href="/registro"
              className="btn-cta inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-white hover:bg-gray-50 transition-colors"
              style={{ color: "#8B1A2C" }}
            >
              <CalendarDays size={16} />
              Crear mi cuenta y agendar
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100 py-8">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Allamey Sanz — Psicóloga Clínica y Sexóloga en Venezuela
            </p>
            <p className="text-xs text-gray-400">
              psicoallameysanz.com
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}

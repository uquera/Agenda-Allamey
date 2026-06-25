import type { Metadata } from "next"
import Image from "next/image"
import LibroCondolencias from "@/components/LibroCondolencias"

export const metadata: Metadata = {
  title: "En memoria de Allamey Sanz",
  description:
    "En memoria de Allamey Sanz, Psicóloga Clínica y Sexóloga. Tu sonrisa, tu luz y tu amor vivirán siempre en nuestros corazones.",
  alternates: { canonical: "https://psicoallameysanz.com" },
  robots: { index: false, follow: false },
}

export default function MemorialPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-[#fdf2f4] via-[#fbe9ee] to-[#f7dde4]">
      <figure className="w-full max-w-md">
        <div className="relative w-full overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5">
          <Image
            src="/en-memoria-allamey.jpg"
            alt="En paz descanse Allamey Sanz — Tu sonrisa, tu luz y tu amor vivirán siempre en nuestros corazones."
            width={1132}
            height={1414}
            priority
            className="w-full h-auto"
          />
        </div>
        <figcaption className="mt-8 text-center text-[#8B1A2C]/80">
          <p className="text-sm font-medium tracking-wide">
            Con cariño y gratitud por todo lo que diste.
          </p>
        </figcaption>
      </figure>

      <LibroCondolencias />
    </main>
  )
}

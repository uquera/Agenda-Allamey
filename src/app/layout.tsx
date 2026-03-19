import type { Metadata } from "next"
import { Poppins, Open_Sans, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { BRAND } from "@/lib/brand"

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
})

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400"],
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} | Psicóloga Clínica y Sexóloga en Venezuela`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "Psicóloga clínica y sexóloga en Venezuela. Consultas individuales, de pareja y grupales online y presenciales. Especialista en bienestar emocional, autoconocimiento y sexualidad sana. Agenda tu cita hoy.",
  keywords: [
    "psicóloga Venezuela",
    "sexóloga Venezuela",
    "psicología clínica Venezuela",
    "terapia individual Venezuela",
    "terapia de pareja Venezuela",
    "salud mental Venezuela",
    "bienestar emocional",
    "Allamey Sanz",
    "psicóloga online Venezuela",
    "sexología Venezuela",
    "autoconocimiento",
    "ansiedad Venezuela",
    "depresión Venezuela",
  ],
  authors: [{ name: "Allamey Sanz" }],
  creator: "Allamey Sanz",
  metadataBase: new URL("https://psicoallameysanz.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_VE",
    url: "https://psicoallameysanz.com",
    siteName: "Dra. Allamey Sanz — Psicóloga y Sexóloga",
    title: "Allamey Sanz | Psicóloga Clínica y Sexóloga en Venezuela",
    description:
      "Especialista en bienestar emocional, sexualidad y desarrollo personal. Consultas individuales, de pareja y grupales. Agenda tu cita hoy.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Dra. Allamey Sanz - Psicóloga y Sexóloga en Venezuela" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Allamey Sanz | Psicóloga Clínica y Sexóloga en Venezuela",
    description: "Especialista en bienestar emocional y sexualidad. Consultas online y presenciales en Venezuela.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  icons: { icon: "/favicon.ico" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${poppins.variable} ${openSans.variable} ${playfair.variable} antialiased`} suppressHydrationWarning>
        <style dangerouslySetInnerHTML={{ __html:
          `:root { --brand: ${BRAND.color}; --brand-dark: ${BRAND.colorDark}; --brand-light: ${BRAND.colorLight}; }`
        }} />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

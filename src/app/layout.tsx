import type { Metadata } from "next"
import { Montserrat } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { BRAND } from "@/lib/brand"

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.specialty}`,
  description: `Portal de pacientes — ${BRAND.name}, ${BRAND.specialty}`,
  icons: { icon: "/favicon.ico" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${montserrat.variable} antialiased`} suppressHydrationWarning>
        <style dangerouslySetInnerHTML={{ __html:
          `:root { --brand: ${BRAND.color}; --brand-dark: ${BRAND.colorDark}; --brand-light: ${BRAND.colorLight}; }`
        }} />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

/**
 * Configuración de branding — fuente única de verdad.
 * Para personalizar un nuevo cliente, define estas variables en .env.local:
 *
 * NEXT_PUBLIC_BRAND_NAME="Dr. García"
 * NEXT_PUBLIC_BRAND_INITIALS="CG"
 * NEXT_PUBLIC_BRAND_SPECIALTY="Psicólogo Clínico"
 * NEXT_PUBLIC_BRAND_DOCTOR_TITLE="Dr. García"
 * NEXT_PUBLIC_BRAND_COLOR="#1A4A8B"
 * NEXT_PUBLIC_BRAND_COLOR_DARK="#153a6d"
 * NEXT_PUBLIC_BRAND_COLOR_LIGHT="#f0f4ff"
 * NEXT_PUBLIC_BRAND_WHATSAPP="584149009020"
 */
export const BRAND = {
  name:        process.env.NEXT_PUBLIC_BRAND_NAME         ?? "Allamey Sanz",
  initials:    process.env.NEXT_PUBLIC_BRAND_INITIALS     ?? "AS",
  specialty:   process.env.NEXT_PUBLIC_BRAND_SPECIALTY    ?? "Psicóloga Clínica · Sexóloga",
  doctorTitle: process.env.NEXT_PUBLIC_BRAND_DOCTOR_TITLE ?? "Dra. Allamey",
  color:       process.env.NEXT_PUBLIC_BRAND_COLOR        ?? "#8B1A2C",
  colorDark:   process.env.NEXT_PUBLIC_BRAND_COLOR_DARK   ?? "#6B1220",
  colorLight:  process.env.NEXT_PUBLIC_BRAND_COLOR_LIGHT  ?? "#fff0f2",
  whatsapp:    process.env.NEXT_PUBLIC_BRAND_WHATSAPP     ?? "584149009020",
} as const

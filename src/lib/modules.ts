/**
 * Feature flags — per-module toggles.
 * All modules are ACTIVE by default.
 * To disable a module, set the corresponding env var to "false" in .env.local.
 *
 * Example (minimal plan — only scheduling):
 *   NEXT_PUBLIC_MODULE_SESIONES=false
 *   NEXT_PUBLIC_MODULE_MATERIALES=false
 *   NEXT_PUBLIC_MODULE_ANAMNESIS=false
 *   NEXT_PUBLIC_MODULE_CONSENTIMIENTO=false
 */
export const MODULES = {
  /** Booking + appointments list (/paciente/agendar, /paciente/citas) */
  agendar:        process.env.NEXT_PUBLIC_MODULE_AGENDAR        !== "false",
  /** Session summaries shared by the doctor (/paciente/sesiones) */
  sesiones:       process.env.NEXT_PUBLIC_MODULE_SESIONES       !== "false",
  /** Resources / materials assigned to the patient (/paciente/materiales) */
  materiales:     process.env.NEXT_PUBLIC_MODULE_MATERIALES     !== "false",
  /** Clinical history / anamnesis form (/paciente/anamnesis) */
  anamnesis:      process.env.NEXT_PUBLIC_MODULE_ANAMNESIS      !== "false",
  /** Informed consent (/paciente/consentimiento) */
  consentimiento: process.env.NEXT_PUBLIC_MODULE_CONSENTIMIENTO !== "false",
} as const

export type ModuleKey = keyof typeof MODULES

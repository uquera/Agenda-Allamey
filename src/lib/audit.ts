import { prisma } from "@/lib/prisma"

interface AuditInput {
  entidadTipo: string
  entidadId: string
  campo: string
  valorAntes?: string | null
  valorDespues?: string | null
  userId: string
  userName?: string | null
}

/**
 * Registra un cambio en el log de auditoría. Fire-and-forget: nunca lanza,
 * para no romper la operación principal si el log falla.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditEntry.create({
      data: {
        entidadTipo:  input.entidadTipo,
        entidadId:    input.entidadId,
        campo:        input.campo,
        valorAntes:   input.valorAntes ?? null,
        valorDespues: input.valorDespues ?? null,
        userId:       input.userId,
        userName:     input.userName ?? "—",
      },
    })
  } catch (err) {
    console.error("[audit] no se pudo registrar la entrada:", err)
  }
}

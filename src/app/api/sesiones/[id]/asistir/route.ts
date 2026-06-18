import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `Eres un asistente de psicología clínica. Ayudas a la terapeuta a redactar notas e informes de sesión estructurados y profesionales. Recibirás el borrador de la terapeuta (puede estar vacío) y el contexto del paciente. Genera una nota clínica completa en formato HTML con exactamente estas secciones usando etiquetas h3:

<h3>Resumen de sesión</h3>
<h3>Observaciones clínicas</h3>
<h3>Intervenciones realizadas</h3>
<h3>Plan de seguimiento</h3>

Usa lenguaje clínico profesional. No inventes datos que no estén en el contexto. Si el borrador ya tiene contenido, úsalo como base y expándelo conservando lo que la terapeuta escribió. Devuelve SOLO el HTML, sin bloques de código, sin explicaciones adicionales.`

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "El asistente de IA no está configurado (falta ANTHROPIC_API_KEY)." },
      { status: 503 }
    )
  }

  const { id } = await params
  const { borrador, instruccion, plantillaId } = (await req.json()) as {
    borrador?: string
    instruccion?: string
    plantillaId?: string
  }

  // Cargar sesión con contexto completo del paciente
  const sesion = await prisma.sesionNota.findUnique({
    where: { id },
    include: {
      paciente: {
        include: {
          user: { select: { name: true } },
          anamnesis: true,
          sesiones: {
            orderBy: { fechaSesion: "desc" },
            take: 3,
            select: { id: true, titulo: true, fechaSesion: true, recomendacion: true },
          },
        },
      },
      cita: { select: { modalidad: true } },
    },
  })

  if (!sesion) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })

  // Configuración IA de la doctora (User ADMIN)
  const userConfig = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { iaInstrucciones: true, iaEjemplo: true },
  })

  // Plantilla de informe modelo seleccionada (opcional)
  let plantillaContenido: string | null = null
  if (plantillaId) {
    const plantilla = await prisma.plantillaInforme.findUnique({ where: { id: plantillaId } })
    plantillaContenido = plantilla?.contenido ?? null
  }

  const { paciente, cita, tipoSesion, fechaSesion } = sesion
  const an = paciente.anamnesis

  const fmtFecha = (d: Date) => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })

  // Construir contexto del paciente
  const lines: string[] = []
  lines.push(`PACIENTE: ${paciente.user.name ?? "Sin nombre"}`)
  lines.push(`FECHA DE SESIÓN: ${fmtFecha(fechaSesion)}`)
  lines.push(`TIPO DE SESIÓN: ${tipoSesion}`)
  if (cita?.modalidad) lines.push(`MODALIDAD: ${cita.modalidad}`)

  if (an) {
    if (an.motivoPrincipal)          lines.push(`\nMOTIVO DE CONSULTA: ${an.motivoPrincipal}`)
    if (an.tiempoEvolucion)          lines.push(`TIEMPO DE EVOLUCIÓN: ${an.tiempoEvolucion}`)
    if (an.antecedentesMedicos)      lines.push(`ANTECEDENTES MÉDICOS: ${an.antecedentesMedicos}`)
    if (an.antecedentesPsicologicos) lines.push(`ANTECEDENTES PSICOLÓGICOS: ${an.antecedentesPsicologicos}`)
    if (an.medicacionActual)         lines.push(`MEDICACIÓN ACTUAL: ${an.medicacionActual}`)
    if (an.expresionDiagnostica)     lines.push(`EXPRESIÓN DIAGNÓSTICA: ${an.expresionDiagnostica}`)
    if (an.patologia)                lines.push(`PATOLOGÍA: ${an.patologia}`)
    if (an.expectativasTerapia)      lines.push(`EXPECTATIVAS DE TERAPIA: ${an.expectativasTerapia}`)
    if (an.redApoyo)                 lines.push(`RED DE APOYO: ${an.redApoyo}`)
    if (an.situacionLaboral)         lines.push(`SITUACIÓN LABORAL: ${an.situacionLaboral}`)
  }

  // Sesiones anteriores (excluyendo la actual)
  const anteriores = paciente.sesiones.filter((s) => s.id !== id)
  if (anteriores.length > 0) {
    lines.push(`\nSESIONES ANTERIORES DEL PACIENTE (últimas ${anteriores.length}):`)
    for (const s of anteriores) {
      lines.push(
        `- ${fmtFecha(s.fechaSesion)}: ${s.titulo}` +
        (s.recomendacion ? ` (recomendación: ${s.recomendacion.slice(0, 100)}...)` : "")
      )
    }
  }

  if (borrador?.trim()) lines.push(`\nBORRADOR DE LA TERAPEUTA:\n${borrador}`)
  if (instruccion?.trim()) lines.push(`\nINSTRUCCIÓN ESPECÍFICA DE LA TERAPEUTA: ${instruccion}`)

  const userMessage = lines.join("\n")

  // System prompt con config personalizada + plantilla modelo
  let systemPrompt = SYSTEM_PROMPT
  if (userConfig?.iaInstrucciones?.trim()) {
    systemPrompt += `\n\nINSTRUCCIONES PERSONALIZADAS DE LA TERAPEUTA (tienen prioridad sobre el formato por defecto):\n${userConfig.iaInstrucciones.trim()}`
  }
  // La plantilla seleccionada tiene prioridad sobre el ejemplo global
  const ejemplo = plantillaContenido?.trim() || userConfig?.iaEjemplo?.trim()
  if (ejemplo) {
    systemPrompt += `\n\nINFORME MODELO DE REFERENCIA (úsalo como guía de estilo, estructura y tono. Adapta el contenido al paciente actual, no copies datos del modelo):\n${ejemplo}`
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })

    const html = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("")

    return NextResponse.json({ html })
  } catch (err) {
    console.error("[asistir] Error llamando a Claude:", err)
    return NextResponse.json({ error: "Error al generar la nota clínica" }, { status: 500 })
  }
}

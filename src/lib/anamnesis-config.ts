export type CampoConfig = {
  label: string
  activo: boolean
  custom?: true
}

export type SeccionDef = {
  titulo: string
  subtitulo: string
  campos: string[]
}

export type AnamnesisConfigData = {
  campos: Record<string, CampoConfig>
  secciones: SeccionDef[]
}

// Campos fijos del schema de Prisma
export const FIXED_KEYS = [
  "motivoPrincipal", "tiempoEvolucion",
  "antecedentesMedicos", "antecedentesPsicologicos", "medicacionActual",
  "estadoCivil", "hijosCantidad", "situacionLaboral", "nivelEducativo", "redApoyo",
  "calidadSueno", "actividadFisica", "consumoSustancias",
  "relacionPareja", "vidaSexual",
  "expectativasTerapia", "intentosAnteriores",
] as const

export const DEFAULT_CONFIG: AnamnesisConfigData = {
  campos: {
    motivoPrincipal:          { label: "¿Cuál es el motivo principal de tu consulta?", activo: true },
    tiempoEvolucion:          { label: "¿Desde hace cuánto tiempo presentas esta situación?", activo: true },
    antecedentesMedicos:      { label: "Antecedentes médicos relevantes", activo: true },
    antecedentesPsicologicos: { label: "Antecedentes psicológicos / psiquiátricos", activo: true },
    medicacionActual:         { label: "Medicación actual", activo: true },
    estadoCivil:              { label: "Estado civil", activo: true },
    hijosCantidad:            { label: "Número de hijos", activo: true },
    situacionLaboral:         { label: "Situación laboral", activo: true },
    nivelEducativo:           { label: "Nivel educativo", activo: true },
    redApoyo:                 { label: "Red de apoyo familiar / social", activo: true },
    calidadSueno:             { label: "Calidad del sueño", activo: true },
    actividadFisica:          { label: "Actividad física", activo: true },
    consumoSustancias:        { label: "Consumo de sustancias", activo: true },
    relacionPareja:           { label: "Relación de pareja actual (si aplica)", activo: true },
    vidaSexual:               { label: "Vida sexual", activo: true },
    expectativasTerapia:      { label: "¿Qué esperas lograr con la terapia?", activo: true },
    intentosAnteriores:       { label: "¿Has recibido terapia psicológica antes?", activo: true },
  },
  secciones: [
    {
      titulo: "Motivo de consulta",
      subtitulo: "Describe en tus propias palabras qué te trae a consulta",
      campos: ["motivoPrincipal", "tiempoEvolucion"],
    },
    {
      titulo: "Antecedentes de salud",
      subtitulo: "Información sobre tu historial médico y psicológico",
      campos: ["antecedentesMedicos", "antecedentesPsicologicos", "medicacionActual"],
    },
    {
      titulo: "Situación personal y social",
      subtitulo: "Contexto actual de tu vida",
      campos: ["estadoCivil", "hijosCantidad", "situacionLaboral", "nivelEducativo", "redApoyo"],
    },
    {
      titulo: "Hábitos y estilo de vida",
      subtitulo: "Tu rutina diaria y bienestar general",
      campos: ["calidadSueno", "actividadFisica", "consumoSustancias"],
    },
    {
      titulo: "Vida afectiva y sexual",
      subtitulo: "Esta información es estrictamente confidencial y ayuda a ofrecer una atención integral",
      campos: ["relacionPareja", "vidaSexual"],
    },
    {
      titulo: "Expectativas terapéuticas",
      subtitulo: "Qué esperas lograr con este proceso",
      campos: ["expectativasTerapia", "intentosAnteriores"],
    },
  ],
}

export function mergeConfig(stored: AnamnesisConfigData | null): AnamnesisConfigData {
  if (!stored || !stored.secciones || !stored.campos) {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG))
  }

  const result: AnamnesisConfigData = {
    secciones: stored.secciones,
    campos: { ...stored.campos },
  }

  // Garantizar que todos los campos fijos existan (para cuando se añadan nuevos en el futuro)
  for (const key of FIXED_KEYS) {
    if (!result.campos[key]) {
      result.campos[key] = DEFAULT_CONFIG.campos[key]
      // Añadir a la sección correspondiente del default
      const secDefault = DEFAULT_CONFIG.secciones.find(s => s.campos.includes(key))
      if (secDefault) {
        const sec = result.secciones.find(s => s.titulo === secDefault.titulo)
        if (sec && !sec.campos.includes(key)) sec.campos.push(key)
      }
    }
  }

  return result
}

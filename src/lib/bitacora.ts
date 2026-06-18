// Constantes compartidas de la bitácora emocional (paciente y doctora)

export interface Mood {
  value: number
  emoji: string
  label: string
  color: string
}

export const MOODS: Mood[] = [
  { value: 1, emoji: "😣", label: "Muy mal", color: "#dc2626" },
  { value: 2, emoji: "😟", label: "Mal",     color: "#f97316" },
  { value: 3, emoji: "😐", label: "Neutral", color: "#eab308" },
  { value: 4, emoji: "🙂", label: "Bien",    color: "#22c55e" },
  { value: 5, emoji: "😄", label: "Muy bien", color: "#16a34a" },
]

export const moodByValue = (v: number): Mood => MOODS.find((m) => m.value === v) ?? MOODS[2]

export const EMOCIONES: string[] = [
  "Ansiedad", "Tristeza", "Alegría", "Calma", "Enojo", "Miedo",
  "Cansancio", "Esperanza", "Frustración", "Gratitud", "Soledad", "Motivación",
]

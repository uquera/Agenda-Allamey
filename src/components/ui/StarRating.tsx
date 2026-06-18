"use client"

interface StarRatingProps {
  value: number          // valor actual (0-5)
  onChange?: (v: number) => void  // si se pasa, es interactivo
  size?: "sm" | "md" | "lg"
}

const SIZES = { sm: 14, md: 20, lg: 28 }

const LABELS: Record<number, string> = {
  1: "Deficiente",
  2: "Regular",
  3: "Bueno",
  4: "Muy bueno",
  5: "Excelente",
}

export default function StarRating({ value, onChange, size = "md" }: StarRatingProps) {
  const px = SIZES[size]
  const interactive = !!onChange

  return (
    <div className="flex items-center gap-0.5" role={interactive ? "radiogroup" : undefined} aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star
        const half = !filled && value >= star - 0.5

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            title={interactive ? LABELS[star] : undefined}
            className={interactive ? "hover:scale-110 transition-transform focus:outline-none" : "cursor-default"}
            aria-label={interactive ? LABELS[star] : undefined}
          >
            <svg
              width={px}
              height={px}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {half && (
                  <linearGradient id={`half-${star}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#d1d5db" />
                  </linearGradient>
                )}
              </defs>
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={filled ? "#f59e0b" : half ? `url(#half-${star})` : "#d1d5db"}
                stroke={filled || half ? "#f59e0b" : "#d1d5db"}
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

// Componente auxiliar solo para mostrar promedio con texto
export function StarDisplay({
  promedio,
  total,
  size = "sm",
}: {
  promedio: number
  total: number
  size?: "sm" | "md" | "lg"
}) {
  if (total === 0) return null
  return (
    <div className="flex items-center gap-1.5">
      <StarRating value={promedio} size={size} />
      <span className="text-sm font-semibold text-amber-600">{promedio.toFixed(1)}</span>
      <span className="text-xs text-gray-400">({total} {total === 1 ? "reseña" : "reseñas"})</span>
    </div>
  )
}

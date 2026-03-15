"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Settings, Clock } from "lucide-react"

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

interface Disponibilidad {
  id: string
  diaSemana: number
  horaInicio: string
  horaFin: string
  activo: boolean
}

interface Props {
  disponibilidad: Disponibilidad[]
}

export default function ConfiguracionManager({ disponibilidad }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState<number | null>(null)

  // Inicializar estado local con los 7 días
  const [horarios, setHorarios] = useState(() => {
    const base = Array.from({ length: 7 }, (_, i) => {
      const existing = disponibilidad.find((d) => d.diaSemana === i)
      return {
        diaSemana: i,
        horaInicio: existing?.horaInicio || "09:00",
        horaFin: existing?.horaFin || "18:00",
        activo: existing?.activo ?? false,
      }
    })
    return base
  })

  async function guardarDia(diaSemana: number) {
    const horario = horarios[diaSemana]
    setSaving(diaSemana)
    try {
      if (!horario.activo) {
        // Desactivar — eliminar disponibilidad
        await fetch("/api/disponibilidad", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ diaSemana }),
        })
      } else {
        await fetch("/api/disponibilidad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            diaSemana,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
          }),
        })
      }
      toast.success(`${DIAS[diaSemana]} actualizado`)
      router.refresh()
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(null)
    }
  }

  function updateHorario(diaSemana: number, field: string, value: string | boolean) {
    setHorarios((prev) =>
      prev.map((h) => (h.diaSemana === diaSemana ? { ...h, [field]: value } : h))
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestiona tu horario de disponibilidad para citas
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} style={{ color: "#8B1A2C" }} />
            <h2 className="text-sm font-semibold text-gray-800">Horario de atención semanal</h2>
          </div>

          <div className="space-y-3">
            {horarios.map((h) => (
              <div
                key={h.diaSemana}
                className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                  h.activo ? "bg-gray-50" : "bg-white opacity-60"
                }`}
              >
                {/* Toggle activo */}
                <Switch
                  checked={h.activo}
                  onCheckedChange={(v) => updateHorario(h.diaSemana, "activo", v)}
                  className="shrink-0"
                  style={h.activo ? { backgroundColor: "#8B1A2C" } : {}}
                />

                {/* Nombre del día */}
                <span className="w-24 text-sm font-medium text-gray-700 shrink-0">
                  {DIAS[h.diaSemana]}
                </span>

                {/* Horas */}
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={h.horaInicio}
                    onChange={(e) => updateHorario(h.diaSemana, "horaInicio", e.target.value)}
                    disabled={!h.activo}
                    className="h-8 text-sm w-28"
                  />
                  <span className="text-gray-400 text-xs">a</span>
                  <Input
                    type="time"
                    value={h.horaFin}
                    onChange={(e) => updateHorario(h.diaSemana, "horaFin", e.target.value)}
                    disabled={!h.activo}
                    className="h-8 text-sm w-28"
                  />
                </div>

                {/* Guardar */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs shrink-0"
                  onClick={() => guardarDia(h.diaSemana)}
                  disabled={saving === h.diaSemana}
                >
                  {saving === h.diaSemana ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

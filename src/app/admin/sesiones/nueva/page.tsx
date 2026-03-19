"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Paciente {
  id: string
  nombre: string
}

interface CitaPendiente {
  id: string
  pacienteId: string
  fecha: string
  pacienteNombre: string
}

export default function NuevaSesionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const citaIdParam = searchParams.get("citaId")

  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [citasPendientes, setCitasPendientes] = useState<CitaPendiente[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [form, setForm] = useState({
    pacienteId: "",
    citaId: citaIdParam ?? "",
    fechaSesion: new Date().toISOString().slice(0, 16),
    titulo: "Resumen de sesión",
    tipoSesion: "INDIVIDUAL",
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/pacientes-lista").then((r) => r.json()),
      fetch("/api/citas-sin-sesion").then((r) => r.json()),
    ])
      .then(([pacs, citas]) => {
        setPacientes(pacs)
        setCitasPendientes(citas)

        // Si viene un citaId por URL, auto-rellenar paciente y fecha
        if (citaIdParam) {
          const cita = citas.find((c: CitaPendiente) => c.id === citaIdParam)
          if (cita) {
            setForm((f) => ({
              ...f,
              pacienteId: cita.pacienteId,
              fechaSesion: new Date(cita.fecha).toISOString().slice(0, 16),
            }))
          }
        }
      })
      .catch(() => toast.error("Error cargando datos"))
      .finally(() => setCargando(false))
  }, [citaIdParam])

  const handleCitaChange = (citaId: string) => {
    const cita = citasPendientes.find((c) => c.id === citaId)
    if (cita) {
      setForm((f) => ({
        ...f,
        citaId,
        pacienteId: cita.pacienteId,
        fechaSesion: new Date(cita.fecha).toISOString().slice(0, 16),
      }))
    } else {
      setForm((f) => ({ ...f, citaId: "" }))
    }
  }

  const crear = async () => {
    if (!form.pacienteId || !form.fechaSesion) {
      toast.error("Selecciona un paciente y una fecha")
      return
    }
    setGuardando(true)
    try {
      const res = await fetch("/api/sesiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const nueva = await res.json()
      toast.success("Sesión creada")
      router.push(`/admin/sesiones/${nueva.id}`)
    } catch {
      toast.error("Error al crear la sesión")
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/sesiones"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--brand-light)" }}
          >
            <FileText size={18} style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Nueva nota de sesión</h1>
            <p className="text-sm text-gray-500">Completa los datos para comenzar</p>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 space-y-5">
          {/* Vincular a cita existente (opcional) */}
          {citasPendientes.length > 0 && (
            <div>
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                Vincular a cita completada (opcional)
              </Label>
              <select
                value={form.citaId}
                onChange={(e) => handleCitaChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              >
                <option value="">— Sin vincular a cita —</option>
                {citasPendientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.pacienteNombre} —{" "}
                    {new Date(c.fecha).toLocaleDateString("es-VE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Al seleccionar una cita, paciente y fecha se rellenan automáticamente
              </p>
            </div>
          )}

          {/* Paciente */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Paciente *
            </Label>
            <select
              value={form.pacienteId}
              onChange={(e) => setForm((f) => ({ ...f, pacienteId: e.target.value }))}
              className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            >
              <option value="">— Seleccionar paciente —</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Fecha y hora de la sesión *
            </Label>
            <Input
              type="datetime-local"
              value={form.fechaSesion}
              onChange={(e) => setForm((f) => ({ ...f, fechaSesion: e.target.value }))}
              className="h-10 bg-gray-50"
            />
          </div>

          {/* Tipo de sesión */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Tipo de sesión
            </Label>
            <select
              value={form.tipoSesion}
              onChange={(e) => setForm((f) => ({ ...f, tipoSesion: e.target.value }))}
              className="w-full h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="PAREJA">Pareja</option>
              <option value="GRUPAL">Grupal</option>
            </select>
          </div>

          {/* Título */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Título del resumen
            </Label>
            <Input
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Resumen de sesión"
              className="h-10 bg-gray-50"
            />
          </div>

          <Button
            className="w-full h-11 text-white mt-2"
            style={{ backgroundColor: "var(--brand)" }}
            onClick={crear}
            disabled={guardando || !form.pacienteId}
          >
            {guardando ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <FileText size={16} className="mr-2" />
            )}
            Crear y abrir editor
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

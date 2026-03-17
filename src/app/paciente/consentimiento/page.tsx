"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, PenLine, RotateCcw, CheckCircle2 } from "lucide-react"

const TEXTO_CONSENTIMIENTO = `CONSENTIMIENTO INFORMADO PARA SERVICIOS PSICOLÓGICOS

Psicóloga: Allamey Sanz
Especialidad: Psicología Clínica y Sexología

1. NATURALEZA DEL SERVICIO
Los servicios psicológicos comprenden evaluación, orientación, psicoterapia individual, de pareja o grupal, y asesoría en sexología clínica. El objetivo es apoyar su bienestar emocional, mental y sexual mediante técnicas basadas en evidencia.

2. CONFIDENCIALIDAD
Toda la información compartida durante las sesiones es estrictamente confidencial. Solo se romperá la confidencialidad en los siguientes casos establecidos por ley: (a) riesgo inminente para su vida o la de terceros, (b) sospecha de abuso o maltrato de menores, o (c) requerimiento legal formal de un tribunal competente.

3. REGISTRO DE SESIONES
Se llevarán notas de progreso clínico que forman parte de su expediente. Estos registros son confidenciales y solo serán compartidos con su consentimiento expreso o en los supuestos legales antes mencionados.

4. DERECHOS DEL PACIENTE
Usted tiene derecho a: recibir información clara sobre su proceso terapéutico, hacer preguntas sobre las técnicas y objetivos del tratamiento, solicitar una segunda opinión profesional en cualquier momento, y finalizar el proceso terapéutico cuando lo desee, previo aviso con la antelación acordada.

5. CANCELACIONES Y REPROGRAMACIONES
Las citas deben cancelarse o reprogramarse con un mínimo de 24 horas de anticipación. Las cancelaciones tardías o inasistencias sin previo aviso podrán ser objeto de cobro según la política vigente del consultorio.

6. HONORARIOS Y FORMAS DE PAGO
Los honorarios serán acordados al inicio del proceso terapéutico. Los pagos deberán realizarse según la modalidad y plazo convenidos. Los cambios en los honorarios serán notificados con anticipación.

7. COMUNICACIÓN ENTRE SESIONES
La comunicación fuera de las sesiones (mensajes, llamadas, correos) se limitará a asuntos logísticos como programación de citas. Las consultas de carácter clínico se atenderán en las sesiones agendadas.

8. TECNOLOGÍA Y SESIONES ONLINE
Para las sesiones online, se utilizarán plataformas que garanticen privacidad. Usted es responsable de asegurar un espacio privado y conexión estable durante las sesiones virtuales.

9. DECLARACIÓN
He leído y comprendido este documento. He tenido la oportunidad de hacer preguntas y las mismas han sido respondidas satisfactoriamente. Entiendo que puedo solicitar una copia de este consentimiento en cualquier momento.

Al firmar este documento, consiento voluntariamente recibir servicios psicológicos bajo los términos aquí descritos.`

export default function ConsentimientoPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasFirma, setHasFirma] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ("touches" in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    const pos = getPos(e, canvas)
    setLastPoint(pos)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx || !lastPoint) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setLastPoint(pos)
    setHasFirma(true)
  }

  function stopDrawing() {
    setIsDrawing(false)
    setLastPoint(null)
  }

  function limpiarFirma() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setHasFirma(false)
  }

  async function handleFirmar() {
    if (!hasFirma) {
      toast.error("Por favor dibuja tu firma antes de continuar")
      return
    }
    setLoading(true)
    try {
      const canvas = canvasRef.current
      const firmaBase64 = canvas?.toDataURL("image/png") || null
      const res = await fetch("/api/consentimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firma: firmaBase64 }),
      })
      if (!res.ok) throw new Error("Error al guardar")
      toast.success("Consentimiento firmado correctamente")
      router.push("/paciente")
    } catch {
      toast.error("Error al guardar la firma. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Consentimiento informado</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lee el documento completo y firma para continuar usando el portal
        </p>
      </div>

      {/* Texto del consentimiento */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#8B1A2C]" />
          <span className="text-xs font-medium text-gray-600">Documento de consentimiento</span>
        </div>
        <ScrollArea className="h-64">
          <div className="p-5">
            <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
              {TEXTO_CONSENTIMIENTO}
            </pre>
          </div>
        </ScrollArea>
      </div>

      {/* Zona de firma */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Firma digital</span>
          </div>
          {hasFirma && (
            <button
              onClick={limpiarFirma}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw size={12} />
              Limpiar
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">
          Dibuja tu firma en el recuadro de abajo usando el mouse o tu dedo
        </p>
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className={`w-full border-2 rounded-lg touch-none cursor-crosshair ${
            hasFirma ? "border-[#8B1A2C]/40" : "border-dashed border-gray-200"
          } bg-gray-50`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasFirma && (
          <p className="text-center text-xs text-gray-300 -mt-2">Área de firma</p>
        )}
      </div>

      {/* Declaración y botón */}
      <div className="bg-[#fff0f2] border border-[#8B1A2C]/10 rounded-xl p-4">
        <div className="flex gap-3">
          <CheckCircle2 size={18} className="text-[#8B1A2C] shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">
            Al firmar este documento confirmo que he leído, comprendido y acepto los términos del
            consentimiento informado para recibir servicios psicológicos de <strong>Allamey Sanz</strong>.
            Mi firma tiene validez legal como expresión de mi consentimiento voluntario.
          </p>
        </div>
      </div>

      <Button
        className="w-full h-11 text-white font-semibold"
        style={{ backgroundColor: "#8B1A2C" }}
        onClick={handleFirmar}
        disabled={loading || !hasFirma}
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin mr-2" /> Guardando firma...</>
        ) : (
          "Firmar y continuar"
        )}
      </Button>
    </div>
  )
}

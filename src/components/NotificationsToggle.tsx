"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react"
import { toast } from "sonner"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export default function NotificationsToggle({
  label = "Notificaciones",
  description,
}: {
  label?: string
  description?: string
}) {
  const [soportado, setSoportado] = useState(true)
  const [activo, setActivo] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [listo, setListo] = useState(false)

  useEffect(() => {
    const ok = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    setSoportado(ok)
    if (!ok) { setListo(true); return }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setActivo(!!sub))
      .catch(() => {})
      .finally(() => setListo(true))
  }, [])

  async function activar() {
    setCargando(true)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== "granted") {
        toast.error("Permiso de notificaciones denegado")
        return
      }
      const reg = await navigator.serviceWorker.ready
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!key) { toast.error("Notificaciones no configuradas"); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as unknown as BufferSource,
      })
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      })
      if (!res.ok) throw new Error()
      setActivo(true)
      toast.success("Notificaciones activadas en este dispositivo")
    } catch (err) {
      console.error(err)
      toast.error("No se pudieron activar las notificaciones")
    } finally {
      setCargando(false)
    }
  }

  async function desactivar() {
    setCargando(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setActivo(false)
      toast.success("Notificaciones desactivadas")
    } catch {
      toast.error("Error al desactivar")
    } finally {
      setCargando(false)
    }
  }

  if (!listo) return null

  if (!soportado) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4">
        <BellOff size={18} className="text-gray-400 shrink-0" />
        <p className="text-sm text-gray-500">
          Este dispositivo o navegador no admite notificaciones push.
          {" "}En iPhone, primero instala la app en la pantalla de inicio.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--brand-light)" }}>
          {activo ? <BellRing size={18} style={{ color: "var(--brand)" }} /> : <Bell size={18} className="text-gray-400" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">
            {description ?? (activo ? "Activas en este dispositivo" : "Recíbelas en este teléfono o computadora")}
          </p>
        </div>
      </div>
      <button
        onClick={activo ? desactivar : activar}
        disabled={cargando}
        className="text-xs font-semibold px-3.5 py-2 rounded-lg text-white disabled:opacity-50 shrink-0"
        style={{ backgroundColor: activo ? "#6B7280" : "var(--brand)" }}
      >
        {cargando ? <Loader2 size={14} className="animate-spin" /> : activo ? "Desactivar" : "Activar"}
      </button>
    </div>
  )
}

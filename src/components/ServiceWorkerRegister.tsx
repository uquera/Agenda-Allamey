"use client"

import { useEffect } from "react"

/** Registra el service worker (PWA + push). Se monta una vez en el layout raíz. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("[sw] registro falló:", err)
    })
  }, [])

  return null
}

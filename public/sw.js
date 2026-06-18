/* Service worker — Allamey Sanz PWA + Web Push */

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

// Recibir push y mostrar la notificación
self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: "Allamey Sanz", body: event.data ? event.data.text() : "" }
  }

  const title = data.title || "Allamey Sanz"
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/" },
    vibrate: [120, 60, 120],
    requireInteraction: data.requireInteraction || false,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Al tocar la notificación, abrir/enfocar la URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || "/"

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})

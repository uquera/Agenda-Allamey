import nodemailer from "nodemailer"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const brandColor = "#8B1A2C"
const grayColor = "#4A4A4A"

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Allamey Sanz</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#ffffff;padding:28px 40px;text-align:center;border-bottom:3px solid ${brandColor};">
              <img src="${process.env.NEXT_PUBLIC_APP_URL}/logo-vertical.png" alt="Allamey Sanz" width="160" style="display:block;margin:0 auto;max-width:160px;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eeeeee;text-align:center;">
              <p style="margin:0;color:#999999;font-size:12px;">
                Este es un mensaje automático de la consulta de Allamey Sanz.<br>
                Por favor no respondas directamente a este correo.
              </p>
              <p style="margin:8px 0 0;color:#cccccc;font-size:11px;">
                © ${new Date().getFullYear()} Allamey Sanz — Psicóloga Clínica
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── TEMPLATES ─────────────────────────────────────────────────────────────────

export async function enviarConfirmacionSolicitud(
  email: string,
  nombre: string,
  fecha: Date
) {
  const fechaStr = format(fecha, "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:${grayColor};font-size:22px;">Solicitud recibida</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Tu cita está pendiente de aprobación</p>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      Hemos recibido tu solicitud de cita para el <strong style="color:${brandColor};">${fechaStr}</strong>.<br>
      La Dra. Allamey revisará tu solicitud y recibirás una confirmación por este medio.
    </p>

    <div style="background:#fff8f8;border-left:4px solid ${brandColor};padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:${grayColor};font-size:14px;font-weight:600;">Estado: Pendiente de aprobación</p>
      <p style="margin:4px 0 0;color:#888;font-size:13px;">Te notificaremos cuando la Dra. Allamey confirme tu cita.</p>
    </div>

    <p style="color:#888;font-size:13px;margin:24px 0 0;">
      Si tienes alguna consulta urgente, puedes contactar a la consulta directamente.
    </p>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Solicitud de cita recibida — Allamey Sanz",
    html,
  })
}

export async function enviarAprobacionCita(
  email: string,
  nombre: string,
  fecha: Date,
  modalidad: string,
  linkSesion?: string | null
) {
  const fechaStr = format(fecha, "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
  const esOnline = modalidad === "ONLINE"

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:${grayColor};font-size:22px;">¡Cita confirmada! ✓</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Tu cita ha sido aprobada</p>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      La Dra. Allamey ha <strong style="color:#2d7a3a;">confirmado tu cita</strong> para el:<br>
      <strong style="color:${brandColor};font-size:17px;">${fechaStr}</strong>
    </p>

    <div style="background:#f0faf2;border-left:4px solid #2d7a3a;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:${grayColor};font-size:14px;"><strong>Modalidad:</strong> ${esOnline ? "Online (videollamada)" : "Presencial en consulta"}</p>
      ${linkSesion ? `<p style="margin:8px 0 0;color:${grayColor};font-size:14px;"><strong>Enlace:</strong> <a href="${linkSesion}" style="color:${brandColor};">${linkSesion}</a></p>` : ""}
    </div>

    ${!esOnline ? `<p style="color:#888;font-size:13px;">Recuerda llegar 5 minutos antes a tu cita en la consulta.</p>` : ""}
    <p style="color:#888;font-size:13px;">Recibirás un recordatorio 24 horas antes de tu cita.</p>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Cita confirmada — Allamey Sanz",
    html,
  })
}

export async function enviarRechazoRcita(
  email: string,
  nombre: string,
  fecha: Date,
  motivo?: string | null
) {
  const fechaStr = format(fecha, "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:${grayColor};font-size:22px;">Cita no disponible</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Tu solicitud requiere atención</p>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      Lamentablemente no es posible confirmar tu cita para el <strong>${fechaStr}</strong>.
    </p>

    ${motivo ? `
    <div style="background:#fff8f8;border-left:4px solid ${brandColor};padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:${grayColor};font-size:14px;"><strong>Motivo:</strong> ${motivo}</p>
    </div>` : ""}

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      Te invitamos a solicitar una nueva cita en otro horario disponible desde tu portal de paciente.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/paciente/agendar"
         style="background:${brandColor};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
        Solicitar nueva cita
      </a>
    </div>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Actualización de tu solicitud — Allamey Sanz",
    html,
  })
}

export async function enviarRecordatorio24h(
  email: string,
  nombre: string,
  fecha: Date,
  modalidad: string,
  linkSesion?: string | null
) {
  const fechaStr = format(fecha, "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
  const esOnline = modalidad === "ONLINE"

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:${grayColor};font-size:22px;">Recordatorio de cita</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Tu cita es mañana</p>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      Te recordamos que tienes una cita programada para mañana:
    </p>

    <div style="background:#fff8f8;border:1px solid #f0d0d4;padding:20px;border-radius:10px;margin:24px 0;text-align:center;">
      <p style="margin:0;color:${brandColor};font-size:20px;font-weight:700;">${fechaStr}</p>
      <p style="margin:8px 0 0;color:#888;font-size:14px;">${esOnline ? "📱 Sesión online" : "🏥 Consulta presencial"}</p>
      ${linkSesion ? `<p style="margin:12px 0 0;"><a href="${linkSesion}" style="color:${brandColor};font-size:14px;">Acceder al enlace de videollamada</a></p>` : ""}
    </div>

    <p style="color:#888;font-size:13px;">
      Si necesitas cancelar o reagendar, por favor hazlo con anticipación desde tu portal.
    </p>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Recordatorio: Cita mañana — Allamey Sanz",
    html,
  })
}

export async function enviarNuevoMaterial(
  email: string,
  nombre: string,
  tituloMaterial: string
) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:${grayColor};font-size:22px;">Nuevo material disponible</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">La Dra. Allamey te ha asignado un recurso</p>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      La Dra. Allamey ha compartido contigo el siguiente material de apoyo:
    </p>

    <div style="background:#fff8f8;border-left:4px solid ${brandColor};padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:${grayColor};font-size:16px;font-weight:600;">📄 ${tituloMaterial}</p>
    </div>

    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/paciente/materiales"
         style="background:${brandColor};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
        Ver material
      </a>
    </div>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Nuevo material: ${tituloMaterial} — Allamey Sanz`,
    html,
  })
}

export async function enviarConfirmacionPago(
  email: string,
  nombre: string,
  monto: number,
  moneda: string,
  metodoPago: string,
  referencia?: string | null,
  fechaPago?: Date | null
) {
  const fechaStr = format(fechaPago ?? new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })

  const metodosLabel: Record<string, string> = {
    ZELLE: "Zelle",
    PAGO_MOVIL: "Pago Móvil",
    BINANCE: "Binance",
    TRANSFERENCIA_USD: "Transferencia USD",
    TRANSFERENCIA_BS: "Transferencia BS",
    EFECTIVO: "Efectivo",
  }
  const metodoStr = metodosLabel[metodoPago] ?? metodoPago

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:${grayColor};font-size:22px;">Pago confirmado ✓</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Hemos recibido tu pago correctamente</p>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      Con mucho gusto confirmamos que hemos recibido tu pago por los servicios de consulta psicológica.
      Tu confianza es lo más importante para nosotros, y nos honra acompañarte en tu proceso de bienestar mental.
    </p>

    <div style="background:#fff8f8;border:1px solid #f0d0d4;padding:24px;border-radius:10px;margin:24px 0;">
      <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Detalle del pago</p>
      <p style="margin:8px 0 0;color:${grayColor};font-size:15px;"><strong>Monto:</strong> <span style="color:${brandColor};font-size:18px;font-weight:700;">${moneda === "BS" ? "Bs." : "$"} ${monto.toFixed(2)}</span></p>
      <p style="margin:8px 0 0;color:${grayColor};font-size:14px;"><strong>Método:</strong> ${metodoStr}</p>
      <p style="margin:8px 0 0;color:${grayColor};font-size:14px;"><strong>Fecha:</strong> ${fechaStr}</p>
      ${referencia ? `<p style="margin:8px 0 0;color:${grayColor};font-size:14px;"><strong>Referencia:</strong> ${referencia}</p>` : ""}
    </div>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      Gracias por confiar en la Dra. Allamey Sanz para acompañarte en el cuidado de tu salud mental.
      Seguimos aquí para ti en cada paso de tu proceso terapéutico.
    </p>

    <p style="color:#888;font-size:13px;margin-top:24px;">
      Si tienes alguna duda sobre este pago, no dudes en contactarnos por WhatsApp al
      <a href="https://wa.me/584149009020" style="color:${brandColor};">+58 414 900 9020</a>.
    </p>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Pago confirmado — Allamey Sanz",
    html,
  })
}

export async function enviarResumenSesion(
  email: string,
  nombre: string,
  fechaSesion: Date
) {
  const fechaStr = format(fechaSesion, "d 'de' MMMM 'de' yyyy", { locale: es })

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:${grayColor};font-size:22px;">Resumen de sesión disponible</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Sesión del ${fechaStr}</p>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      La Dra. Allamey ha publicado el resumen de tu sesión del <strong>${fechaStr}</strong>.
      Puedes consultarlo en tu portal cuando lo desees.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/paciente/sesiones"
         style="background:${brandColor};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
        Ver resumen
      </a>
    </div>

    <p style="color:#888;font-size:12px;margin-top:24px;">
      La información de tus sesiones es estrictamente confidencial y solo tú tienes acceso a ella.
    </p>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Resumen de sesión disponible — Allamey Sanz`,
    html,
  })
}

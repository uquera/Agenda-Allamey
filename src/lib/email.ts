import nodemailer from "nodemailer"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { BRAND } from "@/lib/brand"

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const brandColor = BRAND.color
const grayColor = "#4A4A4A"

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header: barra superior crimson -->
          <tr>
            <td style="background-color:${brandColor};height:6px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header: logo -->
          <tr>
            <td style="background-color:#ffffff;padding:28px 40px 24px;text-align:center;">
              <img
                src="${process.env.NEXT_PUBLIC_APP_URL}/logo-email.png"
                alt="${BRAND.name} — ${BRAND.specialty}"
                width="300"
                style="display:block;margin:0 auto;max-width:300px;height:auto;"
              />
            </td>
          </tr>

          <!-- Header: separador decorativo -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#f0d0d4;height:1px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:36px 40px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 40px;border-top:1px solid #eeeeee;text-align:center;">
              <p style="margin:0;color:#999999;font-size:12px;line-height:1.6;">
                Este es un mensaje automático de la consulta de ${BRAND.name}.<br>
                Por favor no respondas directamente a este correo.
              </p>
              <p style="margin:10px 0 0;color:#cccccc;font-size:11px;">
                &copy; ${new Date().getFullYear()} ${BRAND.name} &mdash; ${BRAND.specialty}
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
      ${BRAND.doctorTitle} revisará tu solicitud y recibirás una confirmación por este medio.
    </p>

    <div style="background:#fff8f8;border-left:4px solid ${brandColor};padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:${grayColor};font-size:14px;font-weight:600;">Estado: Pendiente de aprobación</p>
      <p style="margin:4px 0 0;color:#888;font-size:13px;">Te notificaremos cuando ${BRAND.doctorTitle} confirme tu cita.</p>
    </div>

    <p style="color:#888;font-size:13px;margin:24px 0 0;">
      Si tienes alguna consulta urgente, puedes contactar a la consulta directamente.
    </p>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Solicitud de cita recibida — ${BRAND.name}`,
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
      ${BRAND.doctorTitle} ha <strong style="color:#2d7a3a;">confirmado tu cita</strong> para el:<br>
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
    subject: `Cita confirmada — ${BRAND.name}`,
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
    subject: `Actualización de tu solicitud — ${BRAND.name}`,
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
    subject: `Recordatorio: Cita mañana — ${BRAND.name}`,
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
    <p style="margin:0 0 24px;color:#888;font-size:14px;">${BRAND.doctorTitle} te ha asignado un recurso</p>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      ${BRAND.doctorTitle} ha compartido contigo el siguiente material de apoyo:
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
    subject: `Nuevo material: ${tituloMaterial} — ${BRAND.name}`,
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
      Gracias por confiar en ${BRAND.doctorTitle} para acompañarte en el cuidado de tu salud mental.
      Seguimos aquí para ti en cada paso de tu proceso terapéutico.
    </p>

    <p style="color:#888;font-size:13px;margin-top:24px;">
      Si tienes alguna duda sobre este pago, no dudes en contactarnos por WhatsApp al
      <a href="https://wa.me/${BRAND.whatsapp}" style="color:${brandColor};">+${BRAND.whatsapp}</a>.
    </p>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Pago confirmado — ${BRAND.name}`,
    html,
  })
}

export async function enviarBienvenidaPaciente(
  email: string,
  nombre: string
) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:${grayColor};font-size:22px;">¡Bienvenida/o a tu portal!</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Tu cuenta ha sido creada exitosamente</p>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      Me alegra que hayas dado este paso. Tu cuenta en el portal de ${BRAND.name} ya está activa
      y lista para que puedas agendar citas, revisar materiales y llevar el seguimiento de tu proceso.
    </p>

    <div style="background:#fff8f8;border:1px solid #f0d0d4;padding:24px;border-radius:10px;margin:28px 0;">
      <p style="margin:0 0 4px;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Tus datos de acceso</p>
      <p style="margin:12px 0 0;color:${grayColor};font-size:15px;"><strong>Correo:</strong> ${email}</p>
      <p style="margin:12px 0 0;color:#aaa;font-size:13px;">Ingresa con el correo y la contraseña que elegiste al registrarte. Puedes cambiarla en cualquier momento desde el portal.</p>
    </div>

    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
         style="background:${brandColor};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
        Ingresar al portal
      </a>
    </div>

    <p style="color:#888;font-size:13px;margin-top:8px;text-align:center;">
      Si tienes dudas, escríbenos por WhatsApp al
      <a href="https://wa.me/${BRAND.whatsapp}" style="color:${brandColor};">+${BRAND.whatsapp}</a>.
    </p>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Bienvenida/o a tu portal — ${BRAND.name}`,
    html,
  })
}

export async function enviarRecuperacionClave(
  email: string,
  nombre: string,
  linkReset: string
) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:${grayColor};font-size:22px;">Restablecer contraseña</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Solicitud de cambio de clave</p>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta.
      Haz clic en el botón de abajo para crear una nueva:
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${linkReset}"
         style="background:${brandColor};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
        Crear nueva contraseña
      </a>
    </div>

    <div style="background:#fff8f8;border-left:4px solid ${brandColor};padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
      <p style="margin:0;color:${grayColor};font-size:13px;">
        Este enlace expira en <strong>1 hora</strong> y solo puede usarse una vez.
      </p>
    </div>

    <p style="color:#888;font-size:13px;margin-top:16px;">
      Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual permanecerá sin cambios.
    </p>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Restablecer contraseña — ${BRAND.name}`,
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
      ${BRAND.doctorTitle} ha publicado el resumen de tu sesión del <strong>${fechaStr}</strong>.
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
    subject: `Resumen de sesión disponible — ${BRAND.name}`,
    html,
  })
}

export async function enviarNuevaSolicitudAlAdmin(
  adminEmails: string | string[],
  nombrePaciente: string,
  fecha: Date,
  modalidad: string,
  motivoConsulta?: string | null
) {
  const recipients = Array.isArray(adminEmails) ? adminEmails.join(", ") : adminEmails
  const fechaStr = format(fecha, "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
  const modalidadStr = modalidad === "ONLINE" ? "Online (videollamada)" : "Presencial en consulta"

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:${grayColor};font-size:22px;">Nueva solicitud de cita</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Un paciente ha pedido una hora</p>

    <p style="color:${grayColor};font-size:15px;line-height:1.6;">
      <strong>${nombrePaciente}</strong> ha solicitado una cita para el:
    </p>
    <p style="color:${brandColor};font-size:18px;font-weight:700;margin:4px 0 24px;">${fechaStr}</p>

    <div style="background:#fff8f8;border-left:4px solid ${brandColor};padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0;color:${grayColor};font-size:14px;"><strong>Paciente:</strong> ${nombrePaciente}</p>
      <p style="margin:8px 0 0;color:${grayColor};font-size:14px;"><strong>Modalidad:</strong> ${modalidadStr}</p>
      ${motivoConsulta ? `<p style="margin:8px 0 0;color:${grayColor};font-size:14px;"><strong>Motivo:</strong> ${motivoConsulta}</p>` : ""}
      <p style="margin:8px 0 0;color:#888;font-size:13px;"><strong>Estado:</strong> Pendiente de aprobación</p>
    </div>

    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/agenda"
         style="background:${brandColor};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
        Revisar en la agenda
      </a>
    </div>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipients,
    subject: `Nueva solicitud de cita — ${nombrePaciente}`,
    html,
  })
}

export async function enviarNuevoRegistroAlAdmin(
  adminEmails: string[],
  nombrePaciente: string,
  emailPaciente: string
) {
  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;color:${grayColor};font-size:22px;">Nuevo paciente registrado</h2>
    <p style="margin:0 0 24px;color:#888;font-size:14px;">Un nuevo paciente se ha registrado en el portal</p>

    <div style="background:#fff8f8;border-left:4px solid ${brandColor};padding:16px 20px;border-radius:0 8px 8px 0;margin:0 0 24px;">
      <p style="margin:0;color:${grayColor};font-size:14px;"><strong>Nombre:</strong> ${nombrePaciente}</p>
      <p style="margin:8px 0 0;color:${grayColor};font-size:14px;"><strong>Correo:</strong> ${emailPaciente}</p>
    </div>

    <div style="text-align:center;margin:32px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/pacientes"
         style="background:${brandColor};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
        Ver pacientes
      </a>
    </div>
  `)

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: adminEmails.join(", "),
    subject: `Nuevo paciente registrado — ${nombrePaciente}`,
    html,
  })
}

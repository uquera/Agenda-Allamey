/**
 * Envío único: correo memorial a los pacientes de Allamey Sanz.
 * De parte de la familia y amigos, invitándolos a dejar sus palabras en el memorial.
 *
 * - Envía UNO POR UNO (sin copias visibles, nadie ve los correos de los demás).
 * - Lleva registro en scripts/memorial-envios.json para no duplicar si se reejecuta.
 * - Pausa entre correos para no saturar el SMTP de Gmail.
 *
 * Uso (en el servidor):  set -a; . ./.env; set +a; npx tsx scripts/enviar-memorial.ts
 */
import nodemailer from "nodemailer"
import Database from "better-sqlite3"
import fs from "fs"
import path from "path"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://psicoallameysanz.com"
const FROM = process.env.EMAIL_FROM || "Allamey Sanz <Sanzallamey722@gmail.com>"
const BRAND_COLOR = "#8B1A2C"
const GRAY = "#4A4A4A"
const DB_PATH = "prod.db"
const LOG_PATH = path.join("scripts", "memorial-envios.json")
const PAUSA_MS = 1500

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
})

function primerNombre(nombre: string | null): string {
  if (!nombre) return ""
  return nombre.trim().split(/\s+/)[0]
}

function html(nombre: string | null): string {
  const saludo = primerNombre(nombre) ? `Hola ${primerNombre(nombre)},` : "Hola,"
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>En memoria de Allamey Sanz</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background-color:${BRAND_COLOR};height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="background-color:#ffffff;padding:28px 40px 24px;text-align:center;">
          <img src="${APP_URL}/logo-email.png" alt="Allamey Sanz" width="260" style="display:block;margin:0 auto;max-width:260px;height:auto;" />
        </td></tr>
        <tr><td style="padding:0 40px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background-color:#f0d0d4;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
        <tr><td style="padding:36px 40px 40px;">
          <h2 style="margin:0 0 24px;color:${GRAY};font-size:22px;text-align:center;">En memoria de Allamey Sanz</h2>

          <p style="color:${GRAY};font-size:15px;line-height:1.7;">${saludo}</p>

          <p style="color:${GRAY};font-size:15px;line-height:1.7;">
            Con profundo dolor les compartimos que <strong>Allamey Sanz</strong>, psicóloga y sexóloga, ha fallecido.
          </p>

          <p style="color:${GRAY};font-size:15px;line-height:1.7;">
            Sabemos que para muchos de ustedes Allamey fue una compañía en momentos importantes de su vida.
            Los escuchó con cariño, sin juicios, y se entregó por entero a su vocación de ayudar.
            Por eso, su familia y amigos quisimos avisarles personalmente.
          </p>

          <p style="color:${GRAY};font-size:15px;line-height:1.7;">
            Hemos preparado un espacio para despedirla y honrar su memoria. Si lo deseas, puedes dejar allí
            unas últimas palabras, un recuerdo o un mensaje de cariño:
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${APP_URL}" style="background:${BRAND_COLOR};color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;display:inline-block;">
              Dejar mis palabras para Allamey
            </a>
          </div>

          <p style="color:${GRAY};font-size:15px;line-height:1.7;">Gracias por haber sido parte de su camino.</p>

          <p style="color:${GRAY};font-size:15px;line-height:1.7;margin-top:24px;">
            Con afecto,<br>
            <strong>La familia y amigos de Allamey</strong>
          </p>
        </td></tr>
        <tr><td style="background-color:#fafafa;padding:24px 40px;border-top:1px solid #eeeeee;text-align:center;">
          <p style="margin:0;color:#999999;font-size:12px;line-height:1.6;">
            Recibes este mensaje porque formaste parte de la consulta de Allamey Sanz.<br>
            Descansa en paz. &#128330;
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

type LogEntry = { email: string; ok: boolean; error?: string; at: string }

async function main() {
  const db = new Database(DB_PATH, { readonly: true })
  const rows = db
    .prepare(
      "SELECT u.email AS email, u.name AS name FROM pacientes p JOIN users u ON u.id = p.userId WHERE u.email IS NOT NULL"
    )
    .all() as { email: string; name: string | null }[]
  db.close()

  // Filtrar emails válidos y de prueba
  const validos = rows.filter(
    (r) =>
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email) &&
      !/(example|test|demo|allamey\.com)/i.test(r.email)
  )

  // Registro previo (idempotencia)
  let log: LogEntry[] = []
  if (fs.existsSync(LOG_PATH)) {
    try { log = JSON.parse(fs.readFileSync(LOG_PATH, "utf8")) } catch { log = [] }
  }
  const yaEnviados = new Set(log.filter((l) => l.ok).map((l) => l.email.toLowerCase()))

  const pendientes = validos.filter((r) => !yaEnviados.has(r.email.toLowerCase()))

  console.log(`Pacientes con email válido: ${validos.length}`)
  console.log(`Ya enviados (registro previo): ${yaEnviados.size}`)
  console.log(`Pendientes de enviar ahora: ${pendientes.length}`)
  console.log("─".repeat(50))

  let ok = 0
  let fail = 0
  for (let i = 0; i < pendientes.length; i++) {
    const { email, name } = pendientes[i]
    try {
      await transporter.sendMail({
        from: FROM,
        to: email,
        subject: "En memoria de Allamey Sanz",
        html: html(name),
      })
      ok++
      log.push({ email, ok: true, at: new Date().toISOString() })
      console.log(`✓ [${i + 1}/${pendientes.length}] ${email}`)
    } catch (e) {
      fail++
      const msg = e instanceof Error ? e.message : String(e)
      log.push({ email, ok: false, error: msg, at: new Date().toISOString() })
      console.log(`✗ [${i + 1}/${pendientes.length}] ${email} — ${msg}`)
    }
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
    if (i < pendientes.length - 1) await new Promise((res) => setTimeout(res, PAUSA_MS))
  }

  console.log("─".repeat(50))
  console.log(`Enviados OK: ${ok}   Fallidos: ${fail}`)
  console.log(`Registro guardado en ${LOG_PATH}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })

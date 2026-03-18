import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import fs from "fs"
import path from "path"
import { BRAND } from "@/lib/brand"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  const { titulo, contenido } = await req.json()

  const sesion = await prisma.sesionNota.findUnique({
    where: { id },
    include: {
      paciente: { include: { user: { select: { name: true } } } },
    },
  })
  if (!sesion) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // Generar HTML del PDF como página descargable
  const fechaStr = format(new Date(sesion.fechaSesion), "d 'de' MMMM 'de' yyyy", { locale: es })
  const nombrePaciente = sesion.paciente.user.name || "Paciente"

  const htmlDoc = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${titulo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 60px 80px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #8B1A2C; }
  .brand h1 { font-size: 22px; color: #8B1A2C; letter-spacing: 1px; font-weight: 700; }
  .brand p { font-size: 11px; color: #888; letter-spacing: 2px; margin-top: 3px; }
  .meta { text-align: right; font-size: 12px; color: #666; line-height: 1.8; }
  .meta strong { color: #333; }
  h2 { font-size: 20px; font-weight: 700; color: #222; margin-bottom: 24px; }
  .content { font-size: 14px; line-height: 1.8; color: #444; }
  .content h2 { font-size: 16px; font-weight: 600; color: #8B1A2C; margin: 20px 0 8px; }
  .content p { margin-bottom: 12px; }
  .content ul, .content ol { margin: 12px 0 12px 20px; }
  .content li { margin-bottom: 6px; }
  .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>ALLAMEY SANZ</h1>
      <p>PSICÓLOGA CLÍNICA · SEXÓLOGA</p>
    </div>
    <div class="meta">
      <p><strong>Paciente:</strong> ${nombrePaciente}</p>
      <p><strong>Fecha de sesión:</strong> ${fechaStr}</p>
      <p><strong>Documento generado:</strong> ${format(new Date(), "d/MM/yyyy")}</p>
    </div>
  </div>
  <h2>${titulo}</h2>
  <div class="content">
    ${contenido}
  </div>
  <div class="footer">
    <p>Este documento es de carácter confidencial y de uso exclusivo del paciente.</p>
    <p>${BRAND.name} — ${BRAND.specialty}</p>
  </div>
</body>
</html>`

  // Guardar el HTML como archivo descargable en /public/sesiones/
  const dir = path.join(process.cwd(), "public", "sesiones")
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const filename = `sesion-${id}-${Date.now()}.html`
  const filepath = path.join(dir, filename)
  fs.writeFileSync(filepath, htmlDoc, "utf-8")

  const pdfUrl = `/sesiones/${filename}`

  // Actualizar la sesión con la URL del archivo
  await prisma.sesionNota.update({
    where: { id },
    data: { pdfUrl, titulo, contenido },
  })

  return NextResponse.json({ pdfUrl })
}

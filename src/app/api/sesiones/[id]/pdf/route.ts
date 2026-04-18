import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { BRAND } from "@/lib/brand"

function buildHtml(titulo: string, contenido: string, nombrePaciente: string, fechaStr: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
  .toolbar {
    position: fixed; top: 16px; right: 16px;
    display: flex; gap: 8px; align-items: center;
  }
  .toolbar button {
    background: #8B1A2C; color: white; border: none;
    padding: 10px 18px; border-radius: 8px; font-size: 14px;
    font-weight: 600; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-family: inherit;
  }
  .toolbar button:hover { background: #6e1522; }
  .toolbar .back-btn {
    background: #f3f4f6; color: #374151; box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }
  .toolbar .back-btn:hover { background: #e5e7eb; }
  @media print { .toolbar { display: none !important; } }
  @media (max-width: 600px) {
    body { padding: 30px 20px; }
    .header { flex-direction: column; gap: 12px; }
    .meta { text-align: left; }
    .toolbar { top: 10px; right: 10px; }
    .toolbar button { padding: 8px 12px; font-size: 13px; }
  }
</style>
</head>
<body>
  <div class="toolbar">
    <button class="back-btn" onclick="history.back()">← Volver</button>
    <button onclick="window.print()">Guardar como PDF</button>
  </div>
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
}

// GET: sirve el HTML del PDF directamente (admin o el propio paciente)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 })
  }

  const { id } = await params

  const sesion = await prisma.sesionNota.findUnique({
    where: { id },
    include: {
      paciente: { include: { user: { select: { name: true } } } },
    },
  })
  if (!sesion) return new NextResponse("No encontrado", { status: 404 })

  // Admin puede ver cualquier sesión; paciente solo las suyas publicadas
  if (session.user.role !== "ADMIN") {
    const paciente = await prisma.paciente.findUnique({ where: { userId: session.user.id } })
    if (!paciente || paciente.id !== sesion.pacienteId || !sesion.publicado) {
      return new NextResponse("No autorizado", { status: 401 })
    }
  }

  const fechaStr = format(new Date(sesion.fechaSesion), "d 'de' MMMM 'de' yyyy", { locale: es })
  const nombrePaciente = sesion.paciente.user.name || "Paciente"
  const html = buildHtml(sesion.titulo, sesion.contenido, nombrePaciente, fechaStr)

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

// POST: guarda el contenido y marca la sesión como "PDF disponible"
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

  const pdfUrl = `/api/sesiones/${id}/pdf`

  await prisma.sesionNota.update({
    where: { id },
    data: { pdfUrl, titulo, contenido },
  })

  const fechaStr = format(new Date(sesion.fechaSesion), "d 'de' MMMM 'de' yyyy", { locale: es })
  const nombrePaciente = sesion.paciente.user.name || "Paciente"
  const html = buildHtml(titulo, contenido, nombrePaciente, fechaStr)

  return NextResponse.json({ pdfUrl, html })
}

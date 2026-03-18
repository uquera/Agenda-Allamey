import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import fs from "fs"
import path from "path"
import { BRAND } from "@/lib/brand"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const paciente = await prisma.paciente.findUnique({
    where: { userId: session.user.id },
    include: { consentimiento: true },
  })

  if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

  return NextResponse.json(paciente.consentimiento ?? { firmado: false })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const paciente = await prisma.paciente.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

  const { firma } = await req.json()

  const headersList = await headers()
  const ipAddress =
    headersList.get("x-forwarded-for")?.split(",")[0] ||
    headersList.get("x-real-ip") ||
    "desconocida"

  const fechaFirma = new Date()

  const consentimiento = await prisma.consentimientoInformado.upsert({
    where: { pacienteId: paciente.id },
    create: { pacienteId: paciente.id, firmado: true, fechaFirma, ipAddress, firma: firma || null },
    update: { firmado: true, fechaFirma, ipAddress, firma: firma || null },
  })

  // Generar documento PDF descargable y guardarlo en carpeta del paciente
  try {
    const nombrePaciente = paciente.user.name || "Paciente"
    const emailPaciente = paciente.user.email || ""
    const fechaStr = format(fechaFirma, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Consentimiento Informado – ${nombrePaciente}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 60px 80px; font-size: 13px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 20px; border-bottom: 2px solid #8B1A2C; }
  .brand h1 { font-size: 20px; color: #8B1A2C; letter-spacing: 1px; font-weight: 700; }
  .brand p { font-size: 10px; color: #888; letter-spacing: 2px; margin-top: 3px; }
  .meta { text-align: right; font-size: 11px; color: #666; line-height: 2; }
  .meta strong { color: #333; }
  h2 { font-size: 16px; font-weight: 700; color: #8B1A2C; margin: 24px 0 8px; }
  p { line-height: 1.8; margin-bottom: 10px; color: #444; }
  .clausula { margin-bottom: 20px; padding: 14px 16px; border-left: 3px solid #8B1A2C; background: #fafafa; border-radius: 0 6px 6px 0; }
  .clausula h3 { font-size: 12px; font-weight: 700; color: #8B1A2C; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .clausula p { font-size: 12px; color: #555; margin: 0; line-height: 1.7; }
  .firma-box { margin-top: 40px; padding: 20px; border: 1.5px solid #ccc; border-radius: 8px; background: #f9f9f9; }
  .firma-box h3 { font-size: 13px; font-weight: 700; color: #333; margin-bottom: 14px; }
  .firma-row { display: flex; gap: 40px; }
  .firma-col { flex: 1; }
  .firma-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .firma-value { font-size: 13px; font-weight: 600; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
  .check { color: #16a34a; margin-right: 6px; }
  .footer { margin-top: 50px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #aaa; text-align: center; line-height: 1.8; }
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
      <p><strong>Email:</strong> ${emailPaciente}</p>
      <p><strong>Código:</strong> ${paciente.codigo || "—"}</p>
      <p><strong>Fecha de firma:</strong> ${fechaStr}</p>
    </div>
  </div>

  <p style="font-size:15px; font-weight:700; color:#222; margin-bottom:20px;">CONSENTIMIENTO INFORMADO PARA SERVICIOS PSICOLÓGICOS</p>
  <p>El paciente identificado arriba ha leído, comprendido y aceptado voluntariamente cada uno de los siguientes puntos:</p>

  <div class="clausula">
    <h3>✓ Naturaleza del servicio</h3>
    <p>Los servicios psicológicos comprenden evaluación, orientación, psicoterapia individual, de pareja o grupal, y asesoría en sexología clínica, con el objetivo de apoyar el bienestar emocional, mental y sexual mediante técnicas basadas en evidencia.</p>
  </div>

  <div class="clausula">
    <h3>✓ Confidencialidad</h3>
    <p>Toda la información compartida durante las sesiones es estrictamente confidencial. Solo se romperá la confidencialidad ante: riesgo inminente para la vida del paciente o de terceros, sospecha de abuso o maltrato de menores, o requerimiento legal formal de un tribunal competente.</p>
  </div>

  <div class="clausula">
    <h3>✓ Registro de sesiones</h3>
    <p>Se llevarán notas de progreso clínico como parte del expediente del paciente. Estos registros son confidenciales y solo serán compartidos con el consentimiento expreso del paciente o en los supuestos legales antes mencionados.</p>
  </div>

  <div class="clausula">
    <h3>✓ Cancelaciones y honorarios</h3>
    <p>Las citas deben cancelarse o reprogramarse con un mínimo de 24 horas de anticipación. Las cancelaciones tardías o inasistencias sin previo aviso podrán ser objeto de cobro según la política vigente del consultorio.</p>
  </div>

  <div class="clausula">
    <h3>✓ Comunicación entre sesiones</h3>
    <p>La comunicación fuera de las sesiones se limitará a asuntos logísticos. Las consultas de carácter clínico se atenderán únicamente en las sesiones agendadas.</p>
  </div>

  <div class="clausula">
    <h3>✓ Consentimiento voluntario</h3>
    <p>El paciente declara participar voluntariamente en el proceso terapéutico y que puede retirar su consentimiento en cualquier momento. Autoriza a ${BRAND.name}, ${BRAND.specialty}, a brindarle los servicios descritos.</p>
  </div>

  <div class="firma-box">
    <h3>Registro de firma digital</h3>
    <div class="firma-row">
      <div class="firma-col">
        <div class="firma-label">Firmado por</div>
        <div class="firma-value">${nombrePaciente}</div>
      </div>
      <div class="firma-col">
        <div class="firma-label">Fecha y hora</div>
        <div class="firma-value">${fechaStr}</div>
      </div>
      <div class="firma-col">
        <div class="firma-label">Dirección IP</div>
        <div class="firma-value">${ipAddress}</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Este documento fue firmado digitalmente a través del portal de pacientes de ${BRAND.name}.</p>
    <p>Documento generado el ${format(fechaFirma, "d/MM/yyyy 'a las' HH:mm", { locale: es })} · Referencia: ${consentimiento.id}</p>
    <p>${BRAND.name} — ${BRAND.specialty}</p>
  </div>
</body>
</html>`

    const dir = path.join(process.cwd(), "public", "uploads", "consentimientos")
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const filename = `consentimiento-${paciente.id}.html`
    fs.writeFileSync(path.join(dir, filename), html, "utf-8")
    const archivoUrl = `/uploads/consentimientos/${filename}`

    // Guardar en carpeta del paciente (upsert por nombre de archivo)
    const existente = await prisma.archivoPaciente.findFirst({
      where: { pacienteId: paciente.id, url: archivoUrl },
    })
    if (!existente) {
      await prisma.archivoPaciente.create({
        data: {
          pacienteId: paciente.id,
          nombre: `Consentimiento Informado – ${nombrePaciente}.html`,
          tipo: "DOCUMENTO",
          url: archivoUrl,
          descripcion: `Firmado digitalmente el ${fechaStr}`,
        },
      })
    }
  } catch (err) {
    console.error("Error generando documento de consentimiento:", err)
    // No fallamos el request si falla la generación del PDF
  }

  return NextResponse.json(consentimiento)
}

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { enviarRecordatoriosBitacora } from "@/lib/bitacora-reminders"

export const dynamic = "force-dynamic"

async function autorizado(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get("authorization") === `Bearer ${secret}`) return true
  const session = await auth()
  return !!session && session.user.role === "ADMIN"
}

export async function GET(req: Request) {
  if (!(await autorizado(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const resultado = await enviarRecordatoriosBitacora()
  return NextResponse.json({ ok: true, ...resultado })
}

export async function POST(req: Request) {
  return GET(req)
}

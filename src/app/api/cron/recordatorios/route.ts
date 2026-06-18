import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { procesarRecordatorios } from "@/lib/recordatorios"

export const dynamic = "force-dynamic"

// Autoriza si: (a) trae el header Authorization: Bearer <CRON_SECRET>, o
//              (b) hay sesión de ADMIN (trigger manual desde el panel).
async function autorizado(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const header = req.headers.get("authorization")
    if (header === `Bearer ${secret}`) return true
  }
  const session = await auth()
  return !!session && session.user.role === "ADMIN"
}

export async function GET(req: Request) {
  if (!(await autorizado(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const resultado = await procesarRecordatorios()
  return NextResponse.json({ ok: true, ...resultado })
}

// POST equivalente para triggers que prefieran POST
export async function POST(req: Request) {
  return GET(req)
}

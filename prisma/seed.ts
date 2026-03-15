import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import bcrypt from "bcryptjs"

const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Iniciando seed...")

  const hash = await bcrypt.hash("allamey2024", 10)

  const admin = await prisma.user.upsert({
    where: { email: "allamey@allamey.com" },
    update: {},
    create: {
      name: "Allamey Sanz",
      email: "allamey@allamey.com",
      password: hash,
      role: "ADMIN",
    },
  })

  console.log("✅ Admin creado:", admin.email)

  const dias = [1, 2, 3, 4, 5]
  for (const dia of dias) {
    await prisma.disponibilidad.upsert({
      where: { id: `default-${dia}` },
      update: {},
      create: {
        id: `default-${dia}`,
        diaSemana: dia,
        horaInicio: "09:00",
        horaFin: "18:00",
        activo: true,
      },
    })
  }

  console.log("✅ Disponibilidad: Lunes a Viernes 9:00 - 18:00")

  // Usuario de prueba
  const hashCliente = await bcrypt.hash("1234cliente", 10)
  const cliente = await prisma.user.upsert({
    where: { email: "clienteprueba@allamey.com" },
    update: {},
    create: {
      name: "Cliente Prueba",
      email: "clienteprueba@allamey.com",
      password: hashCliente,
      role: "PACIENTE",
      paciente: { create: {} },
    },
  })
  console.log("✅ Paciente prueba creado:", cliente.email)

  console.log("\n📋 Credenciales:")
  console.log("   Admin:   allamey@allamey.com / allamey2024")
  console.log("   Paciente: clienteprueba@allamey.com / 1234cliente\n")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

import sharp from "sharp"
import { writeFileSync } from "fs"

const SRC = "public/logo-vertical.png"

// 1. Recortar la zona del monograma (parte superior, sin el texto) y quitar el blanco sobrante
const cropped = await sharp(SRC)
  .extract({ left: 0, top: 0, width: 1737, height: 1050 })
  .png()
  .toBuffer()
const mono = await sharp(cropped).trim({ threshold: 12 }).png().toBuffer()

const m = await sharp(mono).metadata()
const side = Math.round(Math.max(m.width, m.height) * 1.2) // 10% de padding por lado

// 2. Centrar el monograma en un cuadro blanco
const square = await sharp({
  create: { width: side, height: side, channels: 4, background: "#ffffff" },
})
  .composite([{ input: mono, gravity: "center" }])
  .png()
  .toBuffer()

// 3. Generar todos los tamaños
await sharp(square).resize(512, 512).png().toFile("src/app/icon.png")
await sharp(square).resize(180, 180).png().toFile("src/app/apple-icon.png")
await sharp(square).resize(192, 192).png().toFile("public/icon-192.png")
await sharp(square).resize(512, 512).png().toFile("public/icon-512.png")

// 4. favicon.ico (PNG-in-ICO, 64x64)
const png = await sharp(square).resize(64, 64).png().toBuffer()
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4)
const entry = Buffer.alloc(16)
entry.writeUInt8(64, 0); entry.writeUInt8(64, 1); entry.writeUInt8(0, 2); entry.writeUInt8(0, 3)
entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6); entry.writeUInt32LE(png.length, 8); entry.writeUInt32LE(22, 12)
writeFileSync("src/app/favicon.ico", Buffer.concat([header, entry, png]))

console.log(`monograma ${m.width}x${m.height} → cuadro ${side}px · iconos regenerados (favicon ${22 + png.length}B)`)

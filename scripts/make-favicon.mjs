import sharp from "sharp"
import { readFileSync, writeFileSync } from "fs"

const svg = readFileSync("src/app/icon.svg")

// PNGs cuadrados branded desde el icon.svg
await sharp(svg, { density: 384 }).resize(512, 512).png().toFile("src/app/icon.png")
await sharp(svg, { density: 384 }).resize(180, 180).png().toFile("src/app/apple-icon.png")

// favicon.ico = contenedor ICO con un PNG 64x64 (PNG-in-ICO, soportado por navegadores modernos)
const png = await sharp(svg, { density: 384 }).resize(64, 64).png().toBuffer()
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)   // reserved
header.writeUInt16LE(1, 2)   // type = icon
header.writeUInt16LE(1, 4)   // count = 1
const entry = Buffer.alloc(16)
entry.writeUInt8(64, 0)              // width
entry.writeUInt8(64, 1)              // height
entry.writeUInt8(0, 2)               // colors
entry.writeUInt8(0, 3)               // reserved
entry.writeUInt16LE(1, 4)            // planes
entry.writeUInt16LE(32, 6)           // bpp
entry.writeUInt32LE(png.length, 8)   // size
entry.writeUInt32LE(22, 12)          // offset
writeFileSync("src/app/favicon.ico", Buffer.concat([header, entry, png]))
console.log("favicon.ico:", 22 + png.length, "bytes · icon.png 512 · apple-icon.png 180")

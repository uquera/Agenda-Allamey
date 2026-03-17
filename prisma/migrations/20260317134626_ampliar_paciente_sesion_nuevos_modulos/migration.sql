/*
  Warnings:

  - Added the required column `codigo` to the `pacientes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "configuracion_agenda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duracionIndividual" INTEGER NOT NULL DEFAULT 60,
    "duracionPareja" INTEGER NOT NULL DEFAULT 90,
    "duracionGrupal" INTEGER NOT NULL DEFAULT 120,
    "cupoMaximoDiario" INTEGER NOT NULL DEFAULT 8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "politica_cancelacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activa" BOOLEAN NOT NULL DEFAULT false,
    "horasAntelacion" INTEGER NOT NULL DEFAULT 24,
    "cobrarCancelacion" BOOLEAN NOT NULL DEFAULT false,
    "montoCancelacion" REAL,
    "descripcion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "consentimientos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pacienteId" TEXT NOT NULL,
    "firmado" BOOLEAN NOT NULL DEFAULT false,
    "fechaFirma" DATETIME,
    "ipAddress" TEXT,
    "firma" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "consentimientos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_pacientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT,
    "userId" TEXT NOT NULL,
    "telefono" TEXT,
    "fechaNacimiento" DATETIME,
    "genero" TEXT,
    "ocupacion" TEXT,
    "direccion" TEXT,
    "pais" TEXT,
    "quienRemite" TEXT,
    "primeraConsulta" BOOLEAN NOT NULL DEFAULT true,
    "motivoConsulta" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pacientes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_pacientes" ("activo", "createdAt", "fechaNacimiento", "genero", "id", "motivoConsulta", "notas", "ocupacion", "telefono", "updatedAt", "userId") SELECT "activo", "createdAt", "fechaNacimiento", "genero", "id", "motivoConsulta", "notas", "ocupacion", "telefono", "updatedAt", "userId" FROM "pacientes";
DROP TABLE "pacientes";
ALTER TABLE "new_pacientes" RENAME TO "pacientes";
CREATE UNIQUE INDEX "pacientes_codigo_key" ON "pacientes"("codigo");
CREATE UNIQUE INDEX "pacientes_userId_key" ON "pacientes"("userId");
CREATE TABLE "new_sesiones_notas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citaId" TEXT,
    "pacienteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT 'Resumen de Sesion',
    "tipoSesion" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "contenido" TEXT NOT NULL,
    "recomendacion" TEXT,
    "cantidadSesiones" INTEGER,
    "estadoSeguimiento" TEXT,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    "fechaSesion" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sesiones_notas_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sesiones_notas_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "pacientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_sesiones_notas" ("citaId", "contenido", "createdAt", "fechaSesion", "id", "pacienteId", "pdfUrl", "publicado", "titulo", "updatedAt") SELECT "citaId", "contenido", "createdAt", "fechaSesion", "id", "pacienteId", "pdfUrl", "publicado", "titulo", "updatedAt" FROM "sesiones_notas";
DROP TABLE "sesiones_notas";
ALTER TABLE "new_sesiones_notas" RENAME TO "sesiones_notas";
CREATE UNIQUE INDEX "sesiones_notas_citaId_key" ON "sesiones_notas"("citaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "consentimientos_pacienteId_key" ON "consentimientos"("pacienteId");

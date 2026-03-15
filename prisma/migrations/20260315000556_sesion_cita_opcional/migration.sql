-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sesiones_notas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citaId" TEXT,
    "pacienteId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL DEFAULT 'Resumen de Sesion',
    "contenido" TEXT NOT NULL,
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

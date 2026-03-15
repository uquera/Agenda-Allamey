-- CreateTable
CREATE TABLE "sesion_archivos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sesionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamano" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sesion_archivos_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "sesiones_notas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

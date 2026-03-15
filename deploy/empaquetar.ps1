# ─────────────────────────────────────────────────────────────
# Empaqueta el proyecto para subir al VPS
# Ejecutar en PowerShell desde la carpeta del proyecto:
#   .\deploy\empaquetar.ps1
# ─────────────────────────────────────────────────────────────

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputFile  = "$env:USERPROFILE\Desktop\agenda-allamey-deploy.zip"

$excludes = @(
    "node_modules",
    ".next",
    ".git",
    "deploy\empaquetar.ps1",
    "prisma\dev.db",
    "prisma\dev.db-shm",
    "prisma\dev.db-wal",
    "dev.db"
)

Write-Host "Empaquetando proyecto..." -ForegroundColor Cyan

Get-ChildItem -Path $projectRoot -Recurse |
  Where-Object {
    $rel = $_.FullName.Substring($projectRoot.Length + 1)
    foreach ($ex in $excludes) {
      if ($rel -like "$ex*") { return $false }
    }
    return $true
  } |
  Compress-Archive -DestinationPath $outputFile -Force

Write-Host ""
Write-Host "✅  Archivo creado en: $outputFile" -ForegroundColor Green
Write-Host "    Sube este ZIP al VPS via FTP o el panel de Hostinger." -ForegroundColor Yellow

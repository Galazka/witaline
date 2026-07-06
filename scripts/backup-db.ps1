#!/usr/bin/env pwsh
<#
.SYNOPSIS
  WitaLine — Backup Supabase database via pg_dump (Supabase CLI).
  Usage:    .\scripts\backup-db.ps1
  Requires: supabase CLI, SUPABASE_DB_URL env var (or pg_pass in Railway)
#>

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $PSScriptRoot ".." "backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# Determine DB URL
$dbUrl = $env:SUPABASE_DB_URL
if (-not $dbUrl) {
  $host = $env:SUPABASE_HOST
  $pass = $env:SUPABASE_DB_PASSWORD
  $user = $env:SUPABASE_USER ?? "postgres"
  $db   = $env:SUPABASE_DATABASE ?? "postgres"
  $host = $host ?? "db.vhudsyfxhvqaybzmgvra.supabase.co"
  if ($pass) {
    $encPass = [Uri]::EscapeDataString($pass)
    $dbUrl = "postgresql://${user}:${encPass}@${host}:5432/${db}"
  } else {
    Write-Warning " SUPABASE_DB_URL or SUPABASE_DB_PASSWORD not set. Skipping backup."
    exit 0
  }
}

# Schema-only backup
$schemaFile = Join-Path $backupDir "witaline-schema-${timestamp}.sql"
Write-Host " Dumping schema → $schemaFile"
supabase db dump --db-url $dbUrl --schema public --file $schemaFile 2>&1
if ($LASTEXITCODE -ne 0) { Write-Error "Schema dump failed"; exit 1 }

# Data-only backup (exclude logs/temp if needed)
$dataFile = Join-Path $backupDir "witaline-data-${timestamp}.sql"
Write-Host " Dumping data → $dataFile"
supabase db dump --db-url $dbUrl --data-only --use-copy --file $dataFile 2>&1
if ($LASTEXITCODE -ne 0) { Write-Error "Data dump failed"; exit 1 }

# Summary
$schemaSize = (Get-Item $schemaFile).Length / 1KB
$dataSize = (Get-Item $dataFile).Length / 1KB
Write-Host " Backup complete: schema ${schemaSize}KB, data ${dataSize}KB"
Write-Host "   $schemaFile"
Write-Host "   $dataFile"

# Cleanup: keep last 7 backups
Get-ChildItem $backupDir -Filter "*.sql" | Group-Object { $_.Name.Substring(0, $_.Name.IndexOf('-')) } | ForEach-Object {
  $_.Group | Sort-Object LastWriteTime -Descending | Select-Object -Skip 14 | Remove-Item -Force
}

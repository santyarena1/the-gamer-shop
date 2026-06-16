param(
  [string]$OutputFile = ""
)

$ErrorActionPreference = "Stop"

function Get-EnvValue {
  param(
    [string]$Path,
    [string]$Key
  )
  if (!(Test-Path $Path)) { return $null }
  $line = Select-String -Path $Path -Pattern "^\s*$Key\s*=" -CaseSensitive | Select-Object -First 1
  if (!$line) { return $null }
  $raw = ($line.Line -split "=", 2)[1].Trim()
  if ($raw.StartsWith('"') -and $raw.EndsWith('"')) {
    return $raw.Substring(1, $raw.Length - 2)
  }
  return $raw
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$envLocal = Join-Path $repoRoot ".env.local"

$dbUrl = Get-EnvValue -Path $envLocal -Key "DATABASE_URL"
$dbPassword = Get-EnvValue -Path $envLocal -Key "POSTGRES_PASSWORD"

if (!$dbUrl) {
  throw "Falta DATABASE_URL en .env.local"
}
if (!$dbPassword) {
  throw "Falta POSTGRES_PASSWORD en .env.local"
}

$uri = [System.Uri]$dbUrl
$dbName = $uri.AbsolutePath.TrimStart("/")
$dbUser = if ($uri.UserInfo) { $uri.UserInfo.Split(":")[0] } else { "postgres" }
$dbHost = if ($uri.Host) { $uri.Host } else { "127.0.0.1" }
$dbPort = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }

$pgDump = "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
if (!(Test-Path $pgDump)) {
  throw "No se encontró pg_dump en $pgDump"
}

$backupDir = Join-Path $repoRoot "backups\db"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $OutputFile = Join-Path $backupDir "$stamp-$dbName.dump"
} elseif (!(Split-Path -Parent $OutputFile)) {
  $OutputFile = Join-Path $repoRoot $OutputFile
}

$env:PGPASSWORD = $dbPassword
& $pgDump -h $dbHost -p $dbPort -U $dbUser -d $dbName -F c -f $OutputFile
if ($LASTEXITCODE -ne 0) {
  throw "pg_dump falló con código $LASTEXITCODE"
}

Write-Host "Backup creado: $OutputFile"

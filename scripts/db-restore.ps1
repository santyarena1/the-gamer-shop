param(
  [string]$InputFile = ""
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

$pgRestore = "C:\Program Files\PostgreSQL\16\bin\pg_restore.exe"
$psql = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
if (!(Test-Path $pgRestore)) { throw "No se encontró pg_restore en $pgRestore" }
if (!(Test-Path $psql)) { throw "No se encontró psql en $psql" }

$backupDir = Join-Path $repoRoot "backups\db"
if ([string]::IsNullOrWhiteSpace($InputFile)) {
  $latest = Get-ChildItem -Path $backupDir -Filter "*.dump" -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (!$latest) { throw "No hay backups en $backupDir" }
  $InputFile = $latest.FullName
} elseif (!(Test-Path $InputFile)) {
  $candidate = Join-Path $repoRoot $InputFile
  if (Test-Path $candidate) {
    $InputFile = $candidate
  } else {
    throw "No existe el archivo de backup: $InputFile"
  }
}

$env:PGPASSWORD = $dbPassword

# Reconstruye la base para evitar drift al restaurar.
& $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$dbName' AND pid <> pg_backend_pid();"
& $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS `"$dbName`";"
& $psql -h $dbHost -p $dbPort -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE `"$dbName`";"

& $pgRestore -h $dbHost -p $dbPort -U $dbUser -d $dbName --no-owner --no-privileges $InputFile
if ($LASTEXITCODE -ne 0) {
  throw "pg_restore falló con código $LASTEXITCODE"
}

Write-Host "Restore completado desde: $InputFile"

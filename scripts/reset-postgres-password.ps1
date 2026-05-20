# Ejecutar como Administrador (clic derecho → Ejecutar como administrador)
# Restaura acceso local con contraseña: devlocal

$ErrorActionPreference = "Stop"
$pgData = "C:\Program Files\PostgreSQL\16\data"
$pgBin = "C:\Program Files\PostgreSQL\16\bin"
$hba = Join-Path $pgData "pg_hba.conf"
$service = "postgresql-x64-16"
$newPassword = "devlocal"

if (-not (Test-Path $hba)) {
  Write-Error "No se encontró PostgreSQL 16 en $pgData"
}

$backup = "$hba.backup-tgs-reset"
if (-not (Test-Path $backup)) {
  Copy-Item $hba $backup
  Write-Host "Backup: $backup"
}

$content = Get-Content $hba -Raw
$content = $content -replace '(?m)^host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256\s*$', 'host    all             all             127.0.0.1/32            trust'
$content = $content -replace '(?m)^host\s+all\s+all\s+::1/128\s+scram-sha-256\s*$', 'host    all             all             ::1/128                 trust'
Set-Content $hba $content -NoNewline

Restart-Service $service -Force
Start-Sleep -Seconds 2

$env:PGPASSWORD = ""
& "$pgBin\psql.exe" -U postgres -h localhost -d postgres -c "ALTER USER postgres WITH PASSWORD '$newPassword';"
& "$pgBin\psql.exe" -U postgres -h localhost -d postgres -c "DO `$`$ BEGIN IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'santy') THEN ALTER USER santy WITH PASSWORD '$newPassword'; END IF; END `$`$;"

Copy-Item $backup $hba -Force
Restart-Service $service -Force

$envFile = Join-Path $PSScriptRoot "..\.env.local"
@"
# Generado por reset-postgres-password.ps1 — no se commitea (gitignore)
DATABASE_URL="postgresql://postgres@127.0.0.1:5432/thegamershop"
POSTGRES_PASSWORD=$newPassword
NEXTAUTH_URL="http://localhost:3000"
"@ | Set-Content $envFile -Encoding utf8

Write-Host ""
Write-Host "Listo. Contraseña PostgreSQL: $newPassword"
Write-Host "Guardada en .env.local"
Write-Host "Reiniciá npm run dev -- -p 3003"

# Inicia PostgreSQL 16 local (cuando el servicio de Windows está detenido).
# Si falla, abrí services.msc → postgresql-x64-16 → Iniciar (como Administrador).

$ErrorActionPreference = "Stop"
$pgBin = "C:\Program Files\PostgreSQL\16\bin"
$pgData = "C:\Program Files\PostgreSQL\16\data"
$service = "postgresql-x64-16"

if (-not (Test-Path "$pgBin\pg_ctl.exe")) {
  Write-Error "No se encontró PostgreSQL 16 en $pgBin"
}

$svc = Get-Service $service -ErrorAction SilentlyContinue
if ($svc -and $svc.Status -eq "Running") {
  Write-Host "PostgreSQL ya está en ejecución (servicio Windows)."
  exit 0
}

Write-Host "Iniciando PostgreSQL (puede tardar ~15s si hubo apagado brusco)..."
& "$pgBin\pg_ctl.exe" start -D $pgData -w -t 120

$env:PGPASSWORD = "devlocal"
& "$pgBin\psql.exe" -U postgres -h 127.0.0.1 -d thegamershop -c "SELECT 1" | Out-Null
Write-Host "OK — base thegamershop accesible en 127.0.0.1:5432"
Write-Host "Ahora podés usar npm run dev y abrir http://localhost:3000"

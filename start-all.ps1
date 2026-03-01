########################################################
#  SocialAutoPro - Start All Services (Redis + Backend + Frontend)
#  Just run:  .\start-all.ps1
########################################################

$Host.UI.RawUI.WindowTitle = "SocialAutoPro Launcher"

# ---------- CONFIG ----------
$projectRoot   = $PSScriptRoot
$backendDir    = Join-Path $projectRoot "backend"
$frontendDir   = Join-Path $projectRoot "frontend"

# Redis paths (check common locations)
$redisPaths = @(
    "C:\Redis\redis-server.exe",
    "C:\Program Files\Redis\redis-server.exe",
    "C:\Program Files (x86)\Redis\redis-server.exe"
)

$redisExe = $null
foreach ($p in $redisPaths) {
    if (Test-Path $p) { $redisExe = $p; break }
}

# ---------- HELPERS ----------
function Write-Header($text) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-PortInUse($port) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    return ($null -ne $conn -and $conn.Count -gt 0)
}

# ---------- 1. START REDIS ----------
Write-Header "Starting Redis..."

if (-not $redisExe) {
    Write-Host "[!] redis-server.exe not found in common paths." -ForegroundColor Red
    Write-Host "    Install Redis or update the path in this script." -ForegroundColor Red
    Write-Host "    Continuing without Redis (backend may fail if it needs it)..." -ForegroundColor Yellow
} else {
    # Check if Redis is already running on port 6379
    if (Test-PortInUse 6379) {
        Write-Host "[OK] Redis is already running on port 6379" -ForegroundColor Green
    } else {
        Write-Host "Starting Redis from: $redisExe" -ForegroundColor Gray
        Start-Process -FilePath $redisExe -WindowStyle Minimized
        Start-Sleep -Seconds 2

        if (Test-PortInUse 6379) {
            Write-Host "[OK] Redis started successfully on port 6379" -ForegroundColor Green
        } else {
            Write-Host "[!] Redis may not have started correctly. Check manually." -ForegroundColor Yellow
        }
    }
}

# ---------- 2. INSTALL DEPENDENCIES (if needed) ----------
Write-Header "Checking Dependencies..."

$backendModules  = Join-Path $backendDir "node_modules"
$frontendModules = Join-Path $frontendDir "node_modules"

if (-not (Test-Path $backendModules)) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location $backendDir
    npm install
    Pop-Location
} else {
    Write-Host "[OK] Backend node_modules exists" -ForegroundColor Green
}

if (-not (Test-Path $frontendModules)) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $frontendDir
    npm install
    Pop-Location
} else {
    Write-Host "[OK] Frontend node_modules exists" -ForegroundColor Green
}

# ---------- 3. START BACKEND ----------
Write-Header "Starting Backend (Express + BullMQ)..."

$backendCmd = "cd `"$backendDir`"; Write-Host ''; Write-Host '=== BACKEND SERVER ===' -ForegroundColor Cyan; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Write-Host "[OK] Backend starting in new terminal..." -ForegroundColor Green
Start-Sleep -Seconds 2

# ---------- 4. START FRONTEND ----------
Write-Header "Starting Frontend (Next.js)..."

$frontendCmd = "cd `"$frontendDir`"; Write-Host ''; Write-Host '=== FRONTEND SERVER ===' -ForegroundColor Cyan; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "[OK] Frontend starting in new terminal..." -ForegroundColor Green

# ---------- DONE ----------
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services launched!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Redis     :  localhost:6379" -ForegroundColor White
Write-Host "  Backend   :  http://localhost:5000  (or check .env)" -ForegroundColor White
Write-Host "  Frontend  :  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "  To stop everything:" -ForegroundColor Yellow
Write-Host "    - Close the Backend & Frontend terminal windows" -ForegroundColor Gray
Write-Host "    - Run: Stop-Process -Name redis-server -Force" -ForegroundColor Gray
Write-Host ""

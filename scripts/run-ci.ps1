<#
.SYNOPSIS
    MacroGuard CI/CD Pipeline Simulation Script
.DESCRIPTION
    Runs the complete 3-tier test pyramid locally:
    1. Unit Tests (.NET 10 / xUnit - 32 tests)
    2. API Integration Tests (Playwright - 17 tests)
    3. E2E Tests (Playwright POM - 8 tests)
#>

[CmdletBinding()]
param (
    [switch]$Quick       # Run only unit tests
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "       🛡️  MacroGuard Local CI/CD Pipeline Simulation        " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

$PassedStages = 0
$TotalStages = if ($Quick) { 1 } else { 3 }

# -------------------------------------------------------------
# Stage 1: Unit Tests (.NET 10 / xUnit)
# -------------------------------------------------------------
Write-Host "▶ [Stage 1/$TotalStages] Running Unit Tests (.NET 10 / xUnit)..." -ForegroundColor Yellow
$unitResult = & dotnet test "$Root/backend/tests/MacroGuard.UnitTests/MacroGuard.UnitTests.csproj" --nologo -v q
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Unit Tests: 32/32 PASSED" -ForegroundColor Green
    $PassedStages++
} else {
    Write-Host "  ❌ Unit Tests: FAILED" -ForegroundColor Red
    exit 1
}

if ($Quick) {
    Write-Host ""
    Write-Host "🏁 Quick CI/CD Quality Gate PASSED (1/1 stages)" -ForegroundColor Green
    exit 0
}

# -------------------------------------------------------------
# Pre-flight check: Are services running?
# -------------------------------------------------------------
$backendRunning = $false
$frontendRunning = $false

try {
    $res = Invoke-WebRequest -Uri "http://localhost:5000/api/foods" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($res.StatusCode -eq 200) { $backendRunning = $true }
} catch { }

try {
    $res = Invoke-WebRequest -Uri "http://localhost:4200" -Method Get -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($res.StatusCode -eq 200) { $frontendRunning = $true }
} catch { }

# -------------------------------------------------------------
# Stage 2: API Integration Tests (Playwright)
# -------------------------------------------------------------
Write-Host ""
Write-Host "▶ [Stage 2/$TotalStages] Running API Integration Tests (Playwright)..." -ForegroundColor Yellow

if (-not $backendRunning) {
    Write-Host "  ⚠️  Backend (http://localhost:5000) is NOT running." -ForegroundColor Yellow
    Write-Host "     Please start Docker services and Backend API to run API tests." -ForegroundColor Gray
    Write-Host "     Skipping Stage 2..." -ForegroundColor DarkGray
} else {
    $apiResult = & npm --prefix "$Root/tests" run test:api
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ API Integration Tests: 17/17 PASSED" -ForegroundColor Green
        $PassedStages++
    } else {
        Write-Host "  ❌ API Integration Tests: FAILED" -ForegroundColor Red
        exit 1
    }
}

# -------------------------------------------------------------
# Stage 3: E2E Tests (Playwright + Page Object Model)
# -------------------------------------------------------------
Write-Host ""
Write-Host "▶ [Stage 3/$TotalStages] Running E2E Tests (Playwright + POM)..." -ForegroundColor Yellow

if (-not $backendRunning -or -not $frontendRunning) {
    Write-Host "  ⚠️  Backend or Frontend (http://localhost:4200) is NOT running." -ForegroundColor Yellow
    Write-Host "     Skipping Stage 3..." -ForegroundColor DarkGray
} else {
    $e2eResult = & npm --prefix "$Root/tests" run test:e2e
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ E2E Tests: 8/8 PASSED" -ForegroundColor Green
        $PassedStages++
    } else {
        Write-Host "  ❌ E2E Tests: FAILED" -ForegroundColor Red
        exit 1
    }
}

# -------------------------------------------------------------
# Summary
# -------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🏁 CI/CD Pipeline Summary: $PassedStages/$TotalStages stages verified." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
exit 0

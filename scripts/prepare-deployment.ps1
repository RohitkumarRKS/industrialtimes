# Industrial Times Deployment Packaging Script
# This script builds the React frontend and packages both backend and frontend into clean zips for aaPanel.

$ErrorActionPreference = "Stop"

# Get current script path and locate root directories
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = (Get-Item $ScriptDir).Parent.FullName
$FrontendDir = Join-Path $RootDir "frontend"
$BackendDir = Join-Path $RootDir "backend"
$OutputDir = Join-Path $RootDir "deployment-packages"

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "      Industrial Times - Packaging Deployment Zips       " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Build Frontend
Write-Host "`n[Step 1/3] Building frontend assets..." -ForegroundColor Yellow
Set-Location $FrontendDir
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Warning "Frontend compilation failed! Please fix errors before deploying."
    exit 1
}
Write-Host "[OK] Frontend compiled successfully." -ForegroundColor Green

# Ensure output directory exists and is empty
if (Test-Path $OutputDir) {
    Write-Host "Cleaning old packages directory..."
    Remove-Item -Recurse -Force $OutputDir
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

# 2. Package Frontend Build Files
Write-Host "`n[Step 2/3] Zipping compiled frontend..." -ForegroundColor Yellow
$FrontendZip = Join-Path $OutputDir "frontend-deploy.zip"
$DistFolder = Join-Path $FrontendDir "dist"

# Compress only the files inside dist folder
Set-Location $DistFolder
Compress-Archive -Path * -DestinationPath $FrontendZip
Write-Host "[OK] Created frontend-deploy.zip (Ready for your Website root)" -ForegroundColor Green

# 3. Package Backend Files (excluding node_modules and sqlite database)
Write-Host "`n[Step 3/3] Zipping backend server..." -ForegroundColor Yellow
$BackendZip = Join-Path $OutputDir "backend-deploy.zip"

# Create a clean temporary folder for backend staging
$StagingDir = Join-Path $OutputDir "backend-temp"
if (Test-Path $StagingDir) {
    Remove-Item -Recurse -Force $StagingDir -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $StagingDir | Out-Null

# Copy backend files and subfolders, excluding large and runtime folders
Get-ChildItem -Path $BackendDir -Exclude "node_modules", "database.sqlite", "data", "uploads" | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $StagingDir -Recurse
}

# Compress staging directory content
Set-Location $StagingDir
Compress-Archive -Path * -DestinationPath $BackendZip
Set-Location $RootDir

# Clean up temp folder
Remove-Item -Recurse -Force $StagingDir

Write-Host "=========================================================" -ForegroundColor Green
Write-Host "SUCCESS! Deployment packages are ready." -ForegroundColor Green
Write-Host "Location: $OutputDir" -ForegroundColor Green
Write-Host "  - File 1: frontend-deploy.zip  --> Upload to site root" -ForegroundColor Green
Write-Host "  - File 2: backend-deploy.zip   --> Upload to backend folder" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

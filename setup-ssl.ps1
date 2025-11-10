# Quick SSL Setup and Deploy Script
# Run this to setup HTTPS for your monitoring system

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Monitoring System - SSL Setup & Deploy" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if OpenSSL is available
Write-Host "[1/4] Checking OpenSSL..." -ForegroundColor Yellow
try {
    $opensslVersion = & openssl version 2>&1
    Write-Host "      ✓ OpenSSL found: $opensslVersion" -ForegroundColor Green
} catch {
    Write-Host "      ✗ OpenSSL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "      Please install OpenSSL:" -ForegroundColor Yellow
    Write-Host "      - Download: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    Write-Host "      - Or install via: choco install openssl" -ForegroundColor Yellow
    exit 1
}

# Step 2: Generate SSL Certificate
Write-Host ""
Write-Host "[2/4] Generating SSL certificate..." -ForegroundColor Yellow

if (Test-Path ".\nginx\ssl\fullchain.pem") {
    $response = Read-Host "      SSL certificate already exists. Regenerate? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        .\generate-ssl.ps1
    } else {
        Write-Host "      ✓ Using existing certificate" -ForegroundColor Green
    }
} else {
    .\generate-ssl.ps1
}

# Step 3: Stop existing containers
Write-Host ""
Write-Host "[3/4] Stopping existing containers..." -ForegroundColor Yellow
docker-compose down
Write-Host "      ✓ Containers stopped" -ForegroundColor Green

# Step 4: Start with SSL
Write-Host ""
Write-Host "[4/4] Starting containers with HTTPS..." -ForegroundColor Yellow
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "      ✓ Containers started successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  ✓ Deployment Complete!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Access your monitoring system at:" -ForegroundColor Cyan
    Write-Host "  → https://eyes.indoinfinite.com" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Browser will show security warning (self-signed cert)" -ForegroundColor Yellow
    Write-Host "   Click 'Advanced' → 'Proceed to site' to continue" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For production, use Let's Encrypt (see SSL-SETUP.md)" -ForegroundColor Cyan
    Write-Host ""
    
    # Show running containers
    Write-Host "Running containers:" -ForegroundColor Cyan
    docker-compose ps
} else {
    Write-Host ""
    Write-Host "✗ Failed to start containers!" -ForegroundColor Red
    Write-Host "  Check logs with: docker-compose logs" -ForegroundColor Yellow
}

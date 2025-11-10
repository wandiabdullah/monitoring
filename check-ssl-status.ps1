# SSL Certificate Status Checker

$DOMAIN = "eyes.indoinfinite.com"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  SSL Certificate Status" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if containers are running
Write-Host "[1/4] Checking Docker containers..." -ForegroundColor Yellow
$containers = docker-compose -f docker-compose.ssl.yml ps --services --filter "status=running"

if ($containers -match "nginx") {
    Write-Host "      ✓ Nginx: Running" -ForegroundColor Green
} else {
    Write-Host "      ✗ Nginx: Not Running" -ForegroundColor Red
}

if ($containers -match "certbot") {
    Write-Host "      ✓ Certbot: Running" -ForegroundColor Green
} else {
    Write-Host "      ✗ Certbot: Not Running" -ForegroundColor Red
}

if ($containers -match "monitoring-backend") {
    Write-Host "      ✓ Backend: Running" -ForegroundColor Green
} else {
    Write-Host "      ✗ Backend: Not Running" -ForegroundColor Red
}

# Check certificate
Write-Host ""
Write-Host "[2/4] Checking SSL certificate..." -ForegroundColor Yellow
$certInfo = docker-compose -f docker-compose.ssl.yml exec -T certbot certbot certificates 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host $certInfo
} else {
    Write-Host "      ✗ No certificate found or certbot not running" -ForegroundColor Red
}

# Check HTTPS endpoint
Write-Host ""
Write-Host "[3/4] Testing HTTPS connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$DOMAIN/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "      ✓ HTTPS is working (Status: $($response.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "      ✗ HTTPS connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check HTTP redirect
Write-Host ""
Write-Host "[4/4] Testing HTTP → HTTPS redirect..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$DOMAIN" -MaximumRedirection 0 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 301 -and $response.Headers.Location -match "https://") {
        Write-Host "      ✓ HTTP redirects to HTTPS" -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 'MovedPermanently') {
        Write-Host "      ✓ HTTP redirects to HTTPS" -ForegroundColor Green
    } else {
        Write-Host "      ✗ HTTP redirect not working" -ForegroundColor Red
    }
}

# Summary
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "  docker-compose -f docker-compose.ssl.yml logs -f" -ForegroundColor White
Write-Host ""
Write-Host "To manually renew certificate:" -ForegroundColor Cyan
Write-Host "  docker-compose -f docker-compose.ssl.yml exec certbot certbot renew" -ForegroundColor White
Write-Host ""
Write-Host "To test SSL security:" -ForegroundColor Cyan
Write-Host "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN" -ForegroundColor White
Write-Host ""

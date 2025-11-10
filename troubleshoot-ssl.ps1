# Let's Encrypt Troubleshooting Tool

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Let's Encrypt Troubleshooting" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$DOMAIN = "eyes.indoinfinite.com"

# Check 1: DNS
Write-Host "[1/6] DNS Resolution" -ForegroundColor Yellow
Write-Host "      Testing DNS for $DOMAIN..." -ForegroundColor Gray
try {
    $dns = Resolve-DnsName -Name $DOMAIN -ErrorAction Stop
    Write-Host "      ✓ DNS works: $($dns[0].IPAddress)" -ForegroundColor Green
} catch {
    Write-Host "      ✗ DNS failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check 2: Port 80
Write-Host ""
Write-Host "[2/6] Port 80 Status" -ForegroundColor Yellow
$port80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if ($port80) {
    Write-Host "      ✗ Port 80 in use by:" -ForegroundColor Red
    Get-Process -Id $port80.OwningProcess | Select-Object Id, ProcessName | ForEach-Object {
        Write-Host "         - $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Yellow
    }
} else {
    Write-Host "      ✓ Port 80 is free" -ForegroundColor Green
}

# Check 3: Port 443
Write-Host ""
Write-Host "[3/6] Port 443 Status" -ForegroundColor Yellow
$port443 = Get-NetTCPConnection -LocalPort 443 -ErrorAction SilentlyContinue
if ($port443) {
    Write-Host "      ✓ Port 443 in use (expected if services running)" -ForegroundColor Green
    Get-Process -Id $port443.OwningProcess | Select-Object Id, ProcessName | ForEach-Object {
        Write-Host "         - $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    }
} else {
    Write-Host "      ⚠ Port 443 is free (services not running?)" -ForegroundColor Yellow
}

# Check 4: Docker containers
Write-Host ""
Write-Host "[4/6] Docker Containers" -ForegroundColor Yellow
$containers = docker ps --format "{{.Names}} | {{.Status}}" 2>$null
if ($containers) {
    Write-Host "      Running containers:" -ForegroundColor Gray
    $containers | ForEach-Object {
        Write-Host "         $($_)" -ForegroundColor Cyan
    }
} else {
    Write-Host "      ✗ No containers running" -ForegroundColor Red
}

# Check 5: Certificate
Write-Host ""
Write-Host "[5/6] SSL Certificate" -ForegroundColor Yellow
$certCheck = docker run --rm `
    -v monitoring_letsencrypt-certs:/etc/letsencrypt `
    certbot/certbot `
    certificates 2>&1

if ($LASTEXITCODE -eq 0 -and $certCheck -match "Certificate Name") {
    Write-Host "      ✓ Certificate found" -ForegroundColor Green
    Write-Host ($certCheck | Select-String -Pattern "Expiry Date" | Select-Object -First 1) -ForegroundColor Cyan
} else {
    Write-Host "      ✗ No certificate found" -ForegroundColor Red
}

# Check 6: HTTPS connectivity
Write-Host ""
Write-Host "[6/6] HTTPS Connection Test" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$DOMAIN/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "      ✓ HTTPS works (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "      ✗ HTTPS failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary and recommendations
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Recommendations" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

if (!$dns) {
    Write-Host "❌ FIX DNS FIRST:" -ForegroundColor Red
    Write-Host "   Configure A record for $DOMAIN to point to this server" -ForegroundColor White
    Write-Host ""
}

if ($port80) {
    Write-Host "❌ FREE PORT 80:" -ForegroundColor Red
    Write-Host "   Stop the process using port 80:" -ForegroundColor White
    $process = Get-Process -Id $port80.OwningProcess
    Write-Host "   Stop-Process -Id $($process.Id) -Force" -ForegroundColor Yellow
    Write-Host ""
}

if (!$containers) {
    Write-Host "❌ START SERVICES:" -ForegroundColor Red
    Write-Host "   docker-compose -f docker-compose.ssl.yml up -d" -ForegroundColor Yellow
    Write-Host ""
}

if (!($certCheck -match "Certificate Name")) {
    Write-Host "❌ GET CERTIFICATE:" -ForegroundColor Red
    Write-Host "   Run: .\setup-letsencrypt-simple.ps1" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs:        docker-compose -f docker-compose.ssl.yml logs -f" -ForegroundColor White
Write-Host "  Check certbot:    docker-compose -f docker-compose.ssl.yml logs certbot" -ForegroundColor White
Write-Host "  Restart nginx:    docker-compose -f docker-compose.ssl.yml restart nginx" -ForegroundColor White
Write-Host "  Manual cert:      .\setup-letsencrypt-manual.ps1" -ForegroundColor White
Write-Host ""

Write-Host "Still stuck? Check:" -ForegroundColor Cyan
Write-Host "  LETSENCRYPT-GUIDE.md - Troubleshooting section" -ForegroundColor White
Write-Host "  certbot-logs\letsencrypt.log - Detailed error logs" -ForegroundColor White
Write-Host ""

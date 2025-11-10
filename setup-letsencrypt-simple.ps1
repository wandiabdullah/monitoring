# Simple Let's Encrypt Setup - Standalone Mode
# This uses certbot standalone (no nginx needed during cert generation)

$DOMAIN = "eyes.indoinfinite.com"
$EMAIL = "admin@indoinfinite.com"  # CHANGE THIS!

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Let's Encrypt SSL - Simple Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check email
if ($EMAIL -eq "admin@indoinfinite.com") {
    Write-Host "⚠️  Please change EMAIL in this script first!" -ForegroundColor Yellow
    $response = Read-Host "Continue anyway for testing? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        exit 1
    }
}

Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow

# Check DNS
Write-Host "      Checking DNS for $DOMAIN..." -ForegroundColor Gray
try {
    $dnsResult = Resolve-DnsName -Name $DOMAIN -ErrorAction Stop
    Write-Host "      ✓ DNS resolved to: $($dnsResult[0].IPAddress)" -ForegroundColor Green
} catch {
    Write-Host "      ✗ DNS not found for $DOMAIN" -ForegroundColor Red
    Write-Host "      Please configure DNS A record first!" -ForegroundColor Yellow
    exit 1
}

# Stop all existing containers to free ports
Write-Host ""
Write-Host "[2/6] Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null
docker-compose -f docker-compose.ssl.yml down 2>$null
Start-Sleep -Seconds 3
Write-Host "      ✓ Containers stopped" -ForegroundColor Green

# Test if port 80 is free
Write-Host ""
Write-Host "[3/6] Checking if port 80 is available..." -ForegroundColor Yellow
$port80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if ($port80) {
    Write-Host "      ✗ Port 80 is in use!" -ForegroundColor Red
    Write-Host "      Processes using port 80:" -ForegroundColor Yellow
    Get-Process -Id $port80.OwningProcess | Format-Table Id, ProcessName
    Write-Host ""
    Write-Host "      Please stop these processes first." -ForegroundColor Yellow
    exit 1
}
Write-Host "      ✓ Port 80 is available" -ForegroundColor Green

# Create necessary directories
if (!(Test-Path "certbot-logs")) {
    New-Item -ItemType Directory -Path "certbot-logs" | Out-Null
}

# Get certificate using standalone mode
Write-Host ""
Write-Host "[4/6] Obtaining SSL certificate from Let's Encrypt..." -ForegroundColor Yellow
Write-Host "      Using standalone mode (port 80 required)" -ForegroundColor Gray
Write-Host "      This will take 1-2 minutes..." -ForegroundColor Gray
Write-Host ""

# Run certbot with standalone mode
$certbotCmd = @(
    "run", "--rm"
    "-p", "80:80"
    "-v", "monitoring_letsencrypt-certs:/etc/letsencrypt"
    "-v", "monitoring_letsencrypt-lib:/var/lib/letsencrypt"
    "-v", "${PWD}/certbot-logs:/var/log/letsencrypt"
    "certbot/certbot"
    "certonly"
    "--standalone"
    "--preferred-challenges", "http"
    "--email", $EMAIL
    "--agree-tos"
    "--no-eff-email"
    "--force-renewal"
    "-d", $DOMAIN
)

Write-Host "      Running: docker $($certbotCmd -join ' ')" -ForegroundColor Gray
Write-Host ""

$result = docker $certbotCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "      ✓ Certificate obtained successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "      ✗ Failed to obtain certificate!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure port 80 is accessible from internet" -ForegroundColor White
    Write-Host "2. Check firewall: netsh advfirewall firewall show rule name=all | findstr 80" -ForegroundColor White
    Write-Host "3. Verify DNS: nslookup $DOMAIN" -ForegroundColor White
    Write-Host "4. Check logs: Get-Content certbot-logs\letsencrypt.log -Tail 50" -ForegroundColor White
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "- Port 80 blocked by firewall/router" -ForegroundColor White
    Write-Host "- DNS not pointing to this server" -ForegroundColor White
    Write-Host "- Behind NAT without port forwarding" -ForegroundColor White
    exit 1
}

# Copy nginx config
Write-Host ""
Write-Host "[5/6] Configuring Nginx..." -ForegroundColor Yellow
Copy-Item "nginx\nginx-letsencrypt.conf" "nginx\nginx.conf" -Force
Write-Host "      ✓ Nginx configuration updated" -ForegroundColor Green

# Start services with SSL
Write-Host ""
Write-Host "[6/6] Starting services with HTTPS..." -ForegroundColor Yellow
docker-compose -f docker-compose.ssl.yml up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "      ✓ Services started" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "      Waiting for services to be ready..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # Verify
    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  ✓ SSL Setup Complete!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your monitoring system is now secured with HTTPS:" -ForegroundColor White
    Write-Host "  → https://$DOMAIN" -ForegroundColor Green
    Write-Host ""
    
    # Check certificate
    Write-Host "Certificate information:" -ForegroundColor Cyan
    docker-compose -f docker-compose.ssl.yml exec -T certbot certbot certificates 2>$null
    
    Write-Host ""
    Write-Host "✓ Auto-renewal enabled (checks every 12 hours)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Test your SSL security:" -ForegroundColor Cyan
    Write-Host "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "      ✗ Failed to start services" -ForegroundColor Red
    Write-Host "      Check logs: docker-compose -f docker-compose.ssl.yml logs" -ForegroundColor Yellow
    exit 1
}

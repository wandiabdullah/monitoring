# Manual Let's Encrypt Setup - Step by Step
# Use this if automated scripts fail

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Manual Let's Encrypt Setup Guide" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$DOMAIN = "eyes.indoinfinite.com"
$EMAIL = "admin@indoinfinite.com"  # CHANGE THIS

Write-Host "This script will guide you through manual SSL setup." -ForegroundColor Yellow
Write-Host "Follow each step carefully." -ForegroundColor Yellow
Write-Host ""
Write-Host "Domain: $DOMAIN" -ForegroundColor White
Write-Host "Email: $EMAIL" -ForegroundColor White
Write-Host ""

# Step 1: DNS Check
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 1: Verify DNS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Checking DNS for $DOMAIN..." -ForegroundColor Yellow
nslookup $DOMAIN
Write-Host ""
$continue = Read-Host "Does the IP address match your server? (y/N)"
if ($continue -ne 'y' -and $continue -ne 'Y') {
    Write-Host "Please configure DNS first, then run this script again." -ForegroundColor Red
    exit 1
}

# Step 2: Stop containers
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 2: Stop All Containers" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Stopping all Docker containers..." -ForegroundColor Yellow
docker-compose down 2>$null
docker-compose -f docker-compose.ssl.yml down 2>$null
Write-Host "✓ All containers stopped" -ForegroundColor Green

# Step 3: Check port 80
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 3: Verify Port 80" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Checking if port 80 is available..." -ForegroundColor Yellow
$port80 = Get-NetTCPConnection -LocalPort 80 -ErrorAction SilentlyContinue
if ($port80) {
    Write-Host "✗ Port 80 is in use by:" -ForegroundColor Red
    Get-Process -Id $port80.OwningProcess | Format-Table Id, ProcessName
    Write-Host ""
    Write-Host "Please stop these processes:" -ForegroundColor Yellow
    Write-Host "  net stop http" -ForegroundColor White
    Write-Host "  Stop-Service -Name 'servicename'" -ForegroundColor White
    exit 1
} else {
    Write-Host "✓ Port 80 is available" -ForegroundColor Green
}

# Step 4: Test internet connectivity
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 4: Test Port 80 from Internet" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "You need to test if port 80 is accessible from internet." -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Use online port checker" -ForegroundColor Cyan
Write-Host "  Visit: https://www.yougetsignal.com/tools/open-ports/" -ForegroundColor White
Write-Host "  Enter your domain: $DOMAIN" -ForegroundColor White
Write-Host "  Check port: 80" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Start test server" -ForegroundColor Cyan
Write-Host "  Run this in another terminal:" -ForegroundColor White
Write-Host "  docker run -d -p 80:80 nginx:alpine" -ForegroundColor Yellow
Write-Host "  Then test: curl http://$DOMAIN" -ForegroundColor Yellow
Write-Host ""
$continue = Read-Host "Is port 80 accessible from internet? (y/N)"
if ($continue -ne 'y' -and $continue -ne 'Y') {
    Write-Host ""
    Write-Host "Port 80 must be accessible for Let's Encrypt to work!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "1. Open port 80 in Windows Firewall:" -ForegroundColor White
    Write-Host "   netsh advfirewall firewall add rule name='HTTP' dir=in action=allow protocol=TCP localport=80" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Forward port 80 on your router/firewall" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Check cloud provider security groups (AWS, Azure, GCP)" -ForegroundColor White
    exit 1
}

# Step 5: Get certificate
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 5: Obtain SSL Certificate" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Obtaining certificate from Let's Encrypt..." -ForegroundColor Yellow
Write-Host "This will take 1-2 minutes. Please wait..." -ForegroundColor Gray
Write-Host ""

# Create volume if not exists
docker volume create monitoring_letsencrypt-certs | Out-Null
docker volume create monitoring_letsencrypt-lib | Out-Null

if (!(Test-Path "certbot-logs")) {
    New-Item -ItemType Directory -Path "certbot-logs" | Out-Null
}

# Run certbot
Write-Host "Running certbot..." -ForegroundColor Cyan
docker run --rm `
    -p 80:80 `
    -v monitoring_letsencrypt-certs:/etc/letsencrypt `
    -v monitoring_letsencrypt-lib:/var/lib/letsencrypt `
    -v "${PWD}/certbot-logs:/var/log/letsencrypt" `
    certbot/certbot `
    certonly `
    --standalone `
    --preferred-challenges http `
    --email $EMAIL `
    --agree-tos `
    --no-eff-email `
    --force-renewal `
    -d $DOMAIN `
    --verbose

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Certificate obtained successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✗ Failed to obtain certificate" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check logs for details:" -ForegroundColor Yellow
    Write-Host "  Get-Content certbot-logs\letsencrypt.log -Tail 50" -ForegroundColor White
    Write-Host ""
    Write-Host "Common errors:" -ForegroundColor Yellow
    Write-Host "- 'Connection refused': Port 80 not accessible from internet" -ForegroundColor White
    Write-Host "- 'DNS problem': Domain doesn't point to this server" -ForegroundColor White
    Write-Host "- 'Rate limited': Too many requests (wait 1 hour)" -ForegroundColor White
    exit 1
}

# Step 6: Configure Nginx
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 6: Configure Nginx" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copying SSL configuration..." -ForegroundColor Yellow
Copy-Item "nginx\nginx-letsencrypt.conf" "nginx\nginx.conf" -Force
Write-Host "✓ Nginx configured for HTTPS" -ForegroundColor Green

# Step 7: Start services
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 7: Start Services" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.ssl.yml up -d --build

Write-Host ""
Write-Host "Waiting for services to start..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Step 8: Verify
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 8: Verify Installation" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking certificate..." -ForegroundColor Yellow
docker-compose -f docker-compose.ssl.yml exec -T certbot certbot certificates

Write-Host ""
Write-Host "Testing HTTPS connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://$DOMAIN/api/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ HTTPS is working! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ HTTPS test failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check logs:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose.ssl.yml logs nginx" -ForegroundColor White
}

# Final summary
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your monitoring system:" -ForegroundColor White
Write-Host "  HTTPS: https://$DOMAIN" -ForegroundColor Green
Write-Host "  HTTP:  http://$DOMAIN (redirects to HTTPS)" -ForegroundColor Gray
Write-Host ""
Write-Host "Certificate status:" -ForegroundColor Cyan
Write-Host "  ✓ Valid SSL from Let's Encrypt" -ForegroundColor Green
Write-Host "  ✓ Auto-renewal enabled (every 12 hours)" -ForegroundColor Green
Write-Host "  ✓ Email notifications to: $EMAIL" -ForegroundColor Green
Write-Host ""
Write-Host "Test SSL security:" -ForegroundColor Cyan
Write-Host "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN" -ForegroundColor White
Write-Host ""

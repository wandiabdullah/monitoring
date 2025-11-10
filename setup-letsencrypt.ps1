# Let's Encrypt SSL Setup Script for Windows
# This script will obtain and configure SSL certificates from Let's Encrypt

$DOMAIN = "eyes.indoinfinite.com"
$EMAIL = "admin@indoinfinite.com"  # Change this to your email
$STAGING = $false  # Set to $true for testing with Let's Encrypt staging server

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Let's Encrypt SSL Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Domain: $DOMAIN" -ForegroundColor White
Write-Host "Email: $EMAIL" -ForegroundColor White
Write-Host ""

# Check if email is still default
if ($EMAIL -eq "admin@indoinfinite.com") {
    Write-Host "⚠️  WARNING: Please change the EMAIL variable in this script to your actual email address" -ForegroundColor Yellow
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        exit 1
    }
}

# Create necessary directories
if (!(Test-Path "nginx\ssl")) {
    New-Item -ItemType Directory -Path "nginx\ssl" | Out-Null
}
if (!(Test-Path "certbot-logs")) {
    New-Item -ItemType Directory -Path "certbot-logs" | Out-Null
}

Write-Host "[1/5] Starting initial services..." -ForegroundColor Yellow

# Create temporary HTTP-only config
$tempConfig = @"
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name eyes.indoinfinite.com;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 200 'Let''s Encrypt validation server';
            add_header Content-Type text/plain;
        }
    }
}
"@

$tempConfig | Out-File -FilePath "nginx\nginx-temp.conf" -Encoding UTF8

# Update docker-compose to use temp config
Write-Host "      Starting Nginx with temporary configuration..." -ForegroundColor Gray
docker-compose -f docker-compose.ssl.yml up -d nginx

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[2/5] Obtaining SSL certificate from Let's Encrypt..." -ForegroundColor Yellow
Write-Host "      This may take a few minutes..." -ForegroundColor Gray

# Prepare certbot command
$certbotCmd = "certonly --webroot --webroot-path=/var/www/certbot " +
              "--email $EMAIL " +
              "--agree-tos " +
              "--no-eff-email " +
              "-d $DOMAIN"

if ($STAGING) {
    Write-Host "      (Using Let's Encrypt STAGING server for testing)" -ForegroundColor Yellow
    $certbotCmd += " --staging"
}

# Run certbot to get certificate
Write-Host "      Running certbot..." -ForegroundColor Gray
$result = docker-compose -f docker-compose.ssl.yml run --rm certbot $certbotCmd.Split(' ')

if ($LASTEXITCODE -eq 0) {
    Write-Host "      ✓ Certificate obtained successfully!" -ForegroundColor Green
} else {
    Write-Host "      ✗ Failed to obtain certificate!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure port 80 is accessible from the internet" -ForegroundColor White
    Write-Host "2. Verify DNS points to your server: nslookup $DOMAIN" -ForegroundColor White
    Write-Host "3. Check firewall settings" -ForegroundColor White
    Write-Host "4. View logs: docker-compose -f docker-compose.ssl.yml logs certbot" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "[3/5] Updating Nginx configuration..." -ForegroundColor Yellow
# Copy Let's Encrypt config
Copy-Item "nginx\nginx-letsencrypt.conf" "nginx\nginx.conf" -Force
Write-Host "      ✓ Configuration updated" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Restarting services with HTTPS..." -ForegroundColor Yellow
docker-compose -f docker-compose.ssl.yml down
docker-compose -f docker-compose.ssl.yml up -d --build

Write-Host ""
Write-Host "[5/5] Verifying SSL certificate..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$certCheck = docker-compose -f docker-compose.ssl.yml exec -T nginx test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "      ✓ SSL certificate installed" -ForegroundColor Green
} else {
    Write-Host "      ✗ SSL certificate not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ✓ Let's Encrypt SSL Setup Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your monitoring system is now secured with HTTPS:" -ForegroundColor White
Write-Host "  → https://$DOMAIN" -ForegroundColor Green
Write-Host ""
Write-Host "Certificate details:" -ForegroundColor Cyan
docker-compose -f docker-compose.ssl.yml exec certbot certbot certificates
Write-Host ""
Write-Host "Certificate auto-renewal is enabled." -ForegroundColor Green
Write-Host "Certbot will automatically renew certificates every 12 hours." -ForegroundColor White
Write-Host ""
Write-Host "To manually renew certificates:" -ForegroundColor Cyan
Write-Host "  docker-compose -f docker-compose.ssl.yml exec certbot certbot renew" -ForegroundColor White
Write-Host ""
Write-Host "View logs:" -ForegroundColor Cyan
Write-Host "  docker-compose -f docker-compose.ssl.yml logs -f" -ForegroundColor White
Write-Host ""

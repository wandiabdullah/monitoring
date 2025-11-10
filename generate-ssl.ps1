# Generate Self-Signed SSL Certificate for eyes.indoinfinite.com
# This script uses OpenSSL (must be installed)

$DOMAIN = "eyes.indoinfinite.com"
$DAYS = 365
$SSL_DIR = ".\nginx\ssl"

Write-Host "Generating self-signed SSL certificate for $DOMAIN..." -ForegroundColor Green

# Create SSL directory if not exists
if (!(Test-Path $SSL_DIR)) {
    New-Item -ItemType Directory -Path $SSL_DIR | Out-Null
}

# Generate private key and certificate using OpenSSL
$subject = "/C=ID/ST=Jakarta/L=Jakarta/O=IndoInfinite/OU=Monitoring/CN=$DOMAIN"
$altNames = "DNS:$DOMAIN,DNS:www.$DOMAIN"

& openssl req -x509 -nodes -days $DAYS -newkey rsa:2048 `
    -keyout "$SSL_DIR\privkey.pem" `
    -out "$SSL_DIR\fullchain.pem" `
    -subj $subject `
    -addext "subjectAltName=$altNames"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ SSL certificate generated successfully!" -ForegroundColor Green
    Write-Host "  Certificate: $SSL_DIR\fullchain.pem" -ForegroundColor Cyan
    Write-Host "  Private Key: $SSL_DIR\privkey.pem" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  NOTE: This is a self-signed certificate. Browsers will show a security warning." -ForegroundColor Yellow
    Write-Host "    For production, use Let's Encrypt: https://letsencrypt.org/" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "✗ Failed to generate SSL certificate!" -ForegroundColor Red
    Write-Host "  Make sure OpenSSL is installed:" -ForegroundColor Yellow
    Write-Host "  - Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    Write-Host "  - Or install via: choco install openssl" -ForegroundColor Yellow
}

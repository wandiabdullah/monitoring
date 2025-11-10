#!/bin/bash

# Let's Encrypt SSL Setup Script - Linux (Improved)
# This script will obtain and configure SSL certificates from Let's Encrypt

set -e

DOMAIN="eyes.indoinfinite.com"
EMAIL="admin@indoinfinite.com"  # Change this to your email
STAGING=0  # Set to 1 for testing with Let's Encrypt staging server

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo "=================================================="
echo "  Let's Encrypt SSL Setup"
echo "=================================================="
echo ""
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Check if email is still default
if [ "$EMAIL" = "admin@indoinfinite.com" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Please change the EMAIL variable in this script to your actual email address${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create necessary directories
mkdir -p nginx/ssl
mkdir -p certbot-logs

echo "[1/5] Starting initial services..."
# Start with temporary HTTP-only config
cat > nginx/nginx-temp.conf << 'EOF'
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
            return 200 'Let\'s Encrypt validation server';
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Start nginx with temporary config
docker-compose -f docker-compose.ssl.yml up -d nginx

echo ""
echo "[2/5] Obtaining SSL certificate from Let's Encrypt..."
echo "      This may take a few minutes..."

# Prepare certbot command
CERTBOT_CMD="certonly --webroot --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN"

if [ $STAGING -eq 1 ]; then
    echo "      (Using Let's Encrypt STAGING server for testing)"
    CERTBOT_CMD="$CERTBOT_CMD --staging"
fi

# Run certbot to get certificate
docker-compose -f docker-compose.ssl.yml run --rm certbot $CERTBOT_CMD

if [ $? -eq 0 ]; then
    echo "      ✓ Certificate obtained successfully!"
else
    echo "      ✗ Failed to obtain certificate!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure port 80 is accessible from the internet"
    echo "2. Verify DNS points to your server: nslookup $DOMAIN"
    echo "3. Check firewall settings"
    echo "4. View logs: docker-compose -f docker-compose.ssl.yml logs certbot"
    exit 1
fi

echo ""
echo "[3/5] Updating Nginx configuration..."
# Copy Let's Encrypt config
cp nginx/nginx-letsencrypt.conf nginx/nginx.conf

echo ""
echo "[4/5] Restarting services with HTTPS..."
docker-compose -f docker-compose.ssl.yml down
docker-compose -f docker-compose.ssl.yml up -d --build

echo ""
echo "[5/5] Verifying SSL certificate..."
sleep 5
if docker-compose -f docker-compose.ssl.yml exec -T nginx test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem; then
    echo "      ✓ SSL certificate installed"
else
    echo "      ✗ SSL certificate not found"
    exit 1
fi

echo ""
echo "=================================================="
echo "  ✓ Let's Encrypt SSL Setup Complete!"
echo "=================================================="
echo ""
echo "Your monitoring system is now secured with HTTPS:"
echo "  → https://$DOMAIN"
echo ""
echo "Certificate details:"
docker-compose -f docker-compose.ssl.yml exec certbot certbot certificates
echo ""
echo "Certificate auto-renewal is enabled."
echo "Certbot will automatically renew certificates every 12 hours."
echo ""
echo "To manually renew certificates:"
echo "  docker-compose -f docker-compose.ssl.yml exec certbot certbot renew"
echo ""
echo "View logs:"
echo "  docker-compose -f docker-compose.ssl.yml logs -f"
echo ""

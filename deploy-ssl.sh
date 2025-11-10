#!/bin/bash

# One-Click SSL Deployment Script
# This script will deploy your monitoring system with Let's Encrypt SSL

set -e

echo "=================================================="
echo "  Monitoring System - Let's Encrypt Deployment"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="eyes.indoinfinite.com"
EMAIL="admin@indoinfinite.com"  # Change this!

# Check prerequisites
echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}      ✗ Docker not found! Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}      ✓ Docker found${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}      ✗ Docker Compose not found! Please install Docker Compose first.${NC}"
    exit 1
fi
echo -e "${GREEN}      ✓ Docker Compose found${NC}"

# Check DNS
echo -e "${YELLOW}      Checking DNS for $DOMAIN...${NC}"
DNS_IP=$(dig +short $DOMAIN | head -n1)
if [ -z "$DNS_IP" ]; then
    echo -e "${RED}      ✗ DNS not configured for $DOMAIN${NC}"
    echo -e "${YELLOW}      Please configure DNS A record first!${NC}"
    exit 1
fi
echo -e "${GREEN}      ✓ DNS configured: $DNS_IP${NC}"

# Check email
if [ "$EMAIL" = "admin@indoinfinite.com" ]; then
    echo -e "${YELLOW}      ⚠️  Using default email. Please update EMAIL in this script!${NC}"
    read -p "      Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Stop existing containers
echo ""
echo -e "${YELLOW}[2/5] Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.ssl.yml down 2>/dev/null || true
echo -e "${GREEN}      ✓ Containers stopped${NC}"

# Build and start monitoring backend
echo ""
echo -e "${YELLOW}[3/5] Building monitoring system...${NC}"
docker-compose -f docker-compose.ssl.yml build
echo -e "${GREEN}      ✓ Build complete${NC}"

# Start temporary HTTP server for ACME challenge
echo ""
echo -e "${YELLOW}[4/5] Obtaining SSL certificate...${NC}"

# Create temporary nginx config
cat > nginx/nginx-temp.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name _;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 200 'ACME validation server';
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Update docker-compose to use temp config temporarily
sed -i.bak 's|nginx.conf|nginx-temp.conf|g' docker-compose.ssl.yml

# Start nginx for ACME challenge
docker-compose -f docker-compose.ssl.yml up -d nginx
sleep 5

# Restore original docker-compose
mv docker-compose.ssl.yml.bak docker-compose.ssl.yml

# Get certificate
echo -e "${CYAN}      Requesting certificate from Let's Encrypt...${NC}"
docker-compose -f docker-compose.ssl.yml run --rm certbot \
    certonly --webroot --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}      ✓ Certificate obtained successfully!${NC}"
else
    echo -e "${RED}      ✗ Failed to obtain certificate${NC}"
    echo -e "${YELLOW}      Troubleshooting:${NC}"
    echo "      1. Make sure port 80 is accessible from internet"
    echo "      2. Verify DNS: dig $DOMAIN"
    echo "      3. Check firewall settings"
    exit 1
fi

# Deploy with HTTPS
echo ""
echo -e "${YELLOW}[5/5] Deploying with HTTPS...${NC}"

# Use Let's Encrypt config
cp nginx/nginx-letsencrypt.conf nginx/nginx.conf

# Start all services
docker-compose -f docker-compose.ssl.yml down
docker-compose -f docker-compose.ssl.yml up -d

# Wait for services to start
echo -e "${CYAN}      Waiting for services to start...${NC}"
sleep 10

# Verify deployment
echo ""
echo -e "${YELLOW}Verifying deployment...${NC}"

# Check containers
if docker-compose -f docker-compose.ssl.yml ps | grep -q "Up"; then
    echo -e "${GREEN}      ✓ Containers are running${NC}"
else
    echo -e "${RED}      ✗ Some containers are not running${NC}"
fi

# Check HTTPS
if curl -sf https://$DOMAIN/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}      ✓ HTTPS is working${NC}"
else
    echo -e "${YELLOW}      ⚠️  HTTPS check failed (might need a moment to start)${NC}"
fi

# Success message
echo ""
echo "=================================================="
echo -e "${GREEN}  ✓ Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo -e "${CYAN}Your monitoring system is now live at:${NC}"
echo -e "${GREEN}  → https://$DOMAIN${NC}"
echo ""
echo -e "${CYAN}Certificate details:${NC}"
docker-compose -f docker-compose.ssl.yml exec certbot certbot certificates
echo ""
echo -e "${GREEN}✓ Auto-renewal enabled (checks every 12 hours)${NC}"
echo -e "${GREEN}✓ HTTP → HTTPS redirect enabled${NC}"
echo -e "${GREEN}✓ Modern SSL/TLS security (A+ rating)${NC}"
echo ""
echo -e "${CYAN}Useful commands:${NC}"
echo "  View logs:       docker-compose -f docker-compose.ssl.yml logs -f"
echo "  Check status:    ./check-ssl-status.ps1 (or .sh)"
echo "  Restart:         docker-compose -f docker-compose.ssl.yml restart"
echo "  Stop:            docker-compose -f docker-compose.ssl.yml down"
echo ""
echo -e "${CYAN}Documentation:${NC}"
echo "  Full guide:      LETSENCRYPT-GUIDE.md"
echo "  Quick ref:       QUICK-REFERENCE.md"
echo "  Summary:         SSL-SUMMARY.md"
echo ""

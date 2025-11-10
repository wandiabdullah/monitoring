#!/bin/bash

# Simple Let's Encrypt Setup for Linux - Standalone Mode
# This uses certbot standalone (no nginx needed during cert generation)

set -e

DOMAIN="eyes.indoinfinite.com"
EMAIL="admin@indoinfinite.com"  # CHANGE THIS!

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}==================================================${NC}"
echo -e "${CYAN}  Let's Encrypt SSL - Simple Setup (Linux)${NC}"
echo -e "${CYAN}==================================================${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}This script may need sudo for some operations.${NC}"
    echo -e "${YELLOW}If you see permission errors, run: sudo $0${NC}"
    echo ""
fi

# Check email
if [ "$EMAIL" = "admin@indoinfinite.com" ]; then
    echo -e "${YELLOW}⚠️  Please change EMAIL in this script first!${NC}"
    read -p "Continue anyway for testing? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}      ✗ Docker not found!${NC}"
    echo -e "${YELLOW}      Install: curl -fsSL https://get.docker.com | sh${NC}"
    exit 1
fi
echo -e "${GREEN}      ✓ Docker found${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}      ✗ Docker Compose not found!${NC}"
    echo -e "${YELLOW}      Install: sudo apt install docker-compose${NC}"
    exit 1
fi
echo -e "${GREEN}      ✓ Docker Compose found${NC}"

# Check DNS
echo -e "      Checking DNS for $DOMAIN..."
DNS_IP=$(dig +short $DOMAIN | head -n1)
if [ -z "$DNS_IP" ]; then
    echo -e "${RED}      ✗ DNS not configured for $DOMAIN${NC}"
    echo -e "${YELLOW}      Please configure DNS A record first!${NC}"
    exit 1
fi
echo -e "${GREEN}      ✓ DNS resolved to: $DNS_IP${NC}"

# Stop existing containers to free ports
echo ""
echo -e "${YELLOW}[2/6] Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.ssl.yml down 2>/dev/null || true
sleep 3
echo -e "${GREEN}      ✓ Containers stopped${NC}"

# Check if port 80 is free
echo ""
echo -e "${YELLOW}[3/6] Checking if port 80 is available...${NC}"
if ss -tlnp 2>/dev/null | grep -q ':80 '; then
    echo -e "${RED}      ✗ Port 80 is in use!${NC}"
    echo ""
    echo -e "${YELLOW}      Processes using port 80:${NC}"
    ss -tlnp | grep ':80 '
    echo ""
    echo -e "${YELLOW}      Please stop these processes first:${NC}"
    echo "      sudo systemctl stop apache2  # if Apache"
    echo "      sudo systemctl stop nginx    # if Nginx"
    echo "      sudo killall -9 nginx        # force kill"
    exit 1
fi
echo -e "${GREEN}      ✓ Port 80 is available${NC}"

# Create necessary directories
mkdir -p certbot-logs

# Get certificate using standalone mode
echo ""
echo -e "${YELLOW}[4/6] Obtaining SSL certificate from Let's Encrypt...${NC}"
echo -e "      Using standalone mode (port 80 required)"
echo -e "      This will take 1-2 minutes. Please wait..."
echo ""

# Run certbot with standalone mode
echo -e "${CYAN}      Running certbot in standalone mode...${NC}"
echo ""

docker run --rm \
    -p 80:80 \
    -v monitoring_letsencrypt-certs:/etc/letsencrypt \
    -v monitoring_letsencrypt-lib:/var/lib/letsencrypt \
    -v "$(pwd)/certbot-logs:/var/log/letsencrypt" \
    certbot/certbot \
    certonly \
    --standalone \
    --preferred-challenges http \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$DOMAIN" \
    --non-interactive

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}      ✓ Certificate obtained successfully!${NC}"
else
    echo ""
    echo -e "${RED}      ✗ Failed to obtain certificate!${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "1. Make sure port 80 is accessible from internet"
    echo "2. Check firewall: sudo ufw status"
    echo "3. Verify DNS: dig $DOMAIN"
    echo "4. Check logs: cat certbot-logs/letsencrypt.log"
    echo ""
    echo -e "${YELLOW}Common issues:${NC}"
    echo "- Port 80 blocked by firewall: sudo ufw allow 80"
    echo "- DNS not pointing to this server"
    echo "- Behind NAT without port forwarding"
    exit 1
fi

# Copy nginx config
echo ""
echo -e "${YELLOW}[5/6] Configuring Nginx...${NC}"
cp nginx/nginx-letsencrypt.conf nginx/nginx.conf
echo -e "${GREEN}      ✓ Nginx configuration updated${NC}"

# Start services with SSL
echo ""
echo -e "${YELLOW}[6/6] Starting services with HTTPS...${NC}"
docker-compose -f docker-compose.ssl.yml up -d --build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}      ✓ Services started${NC}"
    
    echo ""
    echo -e "      Waiting for services to be ready..."
    sleep 10
    
    # Verify
    echo ""
    echo -e "${CYAN}==================================================${NC}"
    echo -e "${GREEN}  ✓ SSL Setup Complete!${NC}"
    echo -e "${CYAN}==================================================${NC}"
    echo ""
    echo -e "Your monitoring system is now secured with HTTPS:"
    echo -e "${GREEN}  → https://$DOMAIN${NC}"
    echo ""
    
    # Check certificate
    echo -e "${CYAN}Certificate information:${NC}"
    docker-compose -f docker-compose.ssl.yml exec -T certbot certbot certificates 2>/dev/null || true
    
    echo ""
    echo -e "${GREEN}✓ Auto-renewal enabled (checks every 12 hours)${NC}"
    echo ""
    echo -e "${CYAN}Test your SSL security:${NC}"
    echo "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
    echo ""
    echo -e "${CYAN}View logs:${NC}"
    echo "  docker-compose -f docker-compose.ssl.yml logs -f"
    echo ""
    
else
    echo -e "${RED}      ✗ Failed to start services${NC}"
    echo "      Check logs: docker-compose -f docker-compose.ssl.yml logs"
    exit 1
fi

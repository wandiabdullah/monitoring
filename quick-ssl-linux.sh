#!/bin/bash

# One-Line SSL Deployment for Linux
# Quick and simple Let's Encrypt setup

DOMAIN="eyes.indoinfinite.com"
EMAIL="your-email@domain.com"  # CHANGE THIS BEFORE RUNNING!

# Colors
G='\033[0;32m'; Y='\033[1;33m'; R='\033[0;31m'; C='\033[0;36m'; NC='\033[0m'

echo -e "${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${C}  Quick SSL Deploy for $DOMAIN${NC}"
echo -e "${C}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Validate email
if [ "$EMAIL" = "your-email@domain.com" ]; then
    echo -e "${R}ERROR: Please edit this script and change EMAIL variable!${NC}"
    exit 1
fi

echo -e "${Y}⏳ Stopping existing services...${NC}"
docker-compose down 2>/dev/null
docker-compose -f docker-compose.ssl.yml down 2>/dev/null

echo -e "${Y}⏳ Getting certificate...${NC}"
docker run --rm -p 80:80 \
    -v monitoring_letsencrypt-certs:/etc/letsencrypt \
    -v monitoring_letsencrypt-lib:/var/lib/letsencrypt \
    certbot/certbot certonly --standalone \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$DOMAIN" --non-interactive

if [ $? -ne 0 ]; then
    echo -e "${R}✗ Failed! Check: tail -f certbot-logs/letsencrypt.log${NC}"
    exit 1
fi

echo -e "${Y}⏳ Configuring Nginx...${NC}"
cp nginx/nginx-letsencrypt.conf nginx/nginx.conf

echo -e "${Y}⏳ Starting services...${NC}"
docker-compose -f docker-compose.ssl.yml up -d --build

echo ""
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${G}✓ Done! Access: https://$DOMAIN${NC}"
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

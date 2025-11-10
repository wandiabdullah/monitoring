#!/bin/bash

# Let's Encrypt Troubleshooting Tool for Linux

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

DOMAIN="eyes.indoinfinite.com"

echo -e "${CYAN}==================================================${NC}"
echo -e "${CYAN}  Let's Encrypt Troubleshooting (Linux)${NC}"
echo -e "${CYAN}==================================================${NC}"
echo ""

# Check 1: DNS
echo -e "${YELLOW}[1/6] DNS Resolution${NC}"
echo "      Testing DNS for $DOMAIN..."
DNS_IP=$(dig +short $DOMAIN | head -n1)
if [ -n "$DNS_IP" ]; then
    echo -e "${GREEN}      ✓ DNS works: $DNS_IP${NC}"
else
    echo -e "${RED}      ✗ DNS failed${NC}"
fi

# Check 2: Port 80
echo ""
echo -e "${YELLOW}[2/6] Port 80 Status${NC}"
if ss -tlnp 2>/dev/null | grep -q ':80 '; then
    echo -e "${RED}      ✗ Port 80 is in use by:${NC}"
    ss -tlnp | grep ':80 ' | awk '{print "         " $0}'
else
    echo -e "${GREEN}      ✓ Port 80 is free${NC}"
fi

# Check 3: Port 443
echo ""
echo -e "${YELLOW}[3/6] Port 443 Status${NC}"
if ss -tlnp 2>/dev/null | grep -q ':443 '; then
    echo -e "${GREEN}      ✓ Port 443 in use (expected if services running)${NC}"
    ss -tlnp | grep ':443 ' | awk '{print "         " $0}'
else
    echo -e "${YELLOW}      ⚠ Port 443 is free (services not running?)${NC}"
fi

# Check 4: Docker containers
echo ""
echo -e "${YELLOW}[4/6] Docker Containers${NC}"
CONTAINERS=$(docker ps --format "{{.Names}} | {{.Status}}" 2>/dev/null)
if [ -n "$CONTAINERS" ]; then
    echo "      Running containers:"
    echo "$CONTAINERS" | awk '{print "         " $0}'
else
    echo -e "${RED}      ✗ No containers running${NC}"
fi

# Check 5: Certificate
echo ""
echo -e "${YELLOW}[5/6] SSL Certificate${NC}"
CERT_CHECK=$(docker run --rm \
    -v monitoring_letsencrypt-certs:/etc/letsencrypt \
    certbot/certbot \
    certificates 2>&1)

if echo "$CERT_CHECK" | grep -q "Certificate Name"; then
    echo -e "${GREEN}      ✓ Certificate found${NC}"
    echo "$CERT_CHECK" | grep "Expiry Date" | head -n1 | awk '{print "         " $0}'
else
    echo -e "${RED}      ✗ No certificate found${NC}"
fi

# Check 6: HTTPS connectivity
echo ""
echo -e "${YELLOW}[6/6] HTTPS Connection Test${NC}"
if curl -sf -m 5 "https://$DOMAIN/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}      ✓ HTTPS is working${NC}"
else
    echo -e "${RED}      ✗ HTTPS connection failed${NC}"
fi

# Check 7: Firewall
echo ""
echo -e "${YELLOW}[BONUS] Firewall Status${NC}"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null | grep -E "(80|443)")
    if [ -n "$UFW_STATUS" ]; then
        echo "      UFW rules for ports 80/443:"
        echo "$UFW_STATUS" | awk '{print "         " $0}'
    else
        echo -e "${YELLOW}      ⚠ No UFW rules found for ports 80/443${NC}"
        echo "         Run: sudo ufw allow 80"
        echo "         Run: sudo ufw allow 443"
    fi
else
    echo "      UFW not installed (checking iptables...)"
    if sudo iptables -L -n 2>/dev/null | grep -E "(80|443)" > /dev/null; then
        echo -e "${GREEN}      ✓ iptables rules found${NC}"
    else
        echo -e "${YELLOW}      ⚠ No iptables rules found${NC}"
    fi
fi

# Summary and recommendations
echo ""
echo -e "${CYAN}==================================================${NC}"
echo -e "${CYAN}  Recommendations${NC}"
echo -e "${CYAN}==================================================${NC}"
echo ""

if [ -z "$DNS_IP" ]; then
    echo -e "${RED}❌ FIX DNS FIRST:${NC}"
    echo "   Configure A record for $DOMAIN to point to this server"
    echo ""
fi

if ss -tlnp 2>/dev/null | grep -q ':80 '; then
    echo -e "${RED}❌ FREE PORT 80:${NC}"
    echo "   Stop the process using port 80:"
    echo "   sudo systemctl stop apache2  # if Apache"
    echo "   sudo systemctl stop nginx    # if Nginx"
    echo "   sudo killall -9 nginx        # force kill"
    echo ""
fi

if [ -z "$CONTAINERS" ]; then
    echo -e "${RED}❌ START SERVICES:${NC}"
    echo "   docker-compose -f docker-compose.ssl.yml up -d"
    echo ""
fi

if ! echo "$CERT_CHECK" | grep -q "Certificate Name"; then
    echo -e "${RED}❌ GET CERTIFICATE:${NC}"
    echo "   Run: ./setup-letsencrypt-simple-linux.sh"
    echo ""
fi

# Firewall recommendations
if command -v ufw &> /dev/null; then
    if ! sudo ufw status 2>/dev/null | grep -q "80.*ALLOW"; then
        echo -e "${YELLOW}⚠️  OPEN PORT 80 IN FIREWALL:${NC}"
        echo "   sudo ufw allow 80/tcp"
        echo "   sudo ufw allow 443/tcp"
        echo ""
    fi
fi

echo -e "${CYAN}Useful commands:${NC}"
echo "  View logs:        docker-compose -f docker-compose.ssl.yml logs -f"
echo "  Check certbot:    docker-compose -f docker-compose.ssl.yml logs certbot"
echo "  Restart nginx:    docker-compose -f docker-compose.ssl.yml restart nginx"
echo "  Test port 80:     curl -v http://$DOMAIN"
echo "  Test HTTPS:       curl -v https://$DOMAIN"
echo ""

echo -e "${CYAN}Check external accessibility:${NC}"
echo "  Online tool: https://www.yougetsignal.com/tools/open-ports/"
echo "  Enter domain: $DOMAIN"
echo "  Check port: 80"
echo ""

echo -e "${CYAN}Still stuck? Check:${NC}"
echo "  LETSENCRYPT-GUIDE.md - Troubleshooting section"
echo "  certbot-logs/letsencrypt.log - Detailed error logs"
echo "  tail -f certbot-logs/letsencrypt.log"
echo ""

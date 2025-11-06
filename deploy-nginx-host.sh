#!/bin/bash
# Deploy monitoring system with Nginx in host network mode

set -e

echo "=========================================="
echo "  Monitoring System - Nginx Host Mode"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root (needed for port 80/443)
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}[ERROR]${NC} This script must be run as root (for port 80/443 access)"
    echo "Please run: sudo $0"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Docker is not installed!"
    echo "Install Docker first: curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Docker Compose is not installed!"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Docker version: $(docker --version)"
echo -e "${GREEN}[OK]${NC} Docker Compose version: $(docker-compose --version)"
echo ""

# Check if ports 80 and 443 are available
check_port() {
    local port=$1
    if netstat -tuln | grep -q ":$port "; then
        echo -e "${YELLOW}[WARNING]${NC} Port $port is already in use!"
        netstat -tuln | grep ":$port "
        return 1
    else
        echo -e "${GREEN}[OK]${NC} Port $port is available"
        return 0
    fi
}

echo "Checking required ports..."
PORT_80_OK=true
PORT_443_OK=true

if ! check_port 80; then
    PORT_80_OK=false
    echo -e "${YELLOW}[INFO]${NC} To free port 80, you may need to stop Apache or Nginx:"
    echo "  sudo systemctl stop apache2 nginx"
fi

if ! check_port 443; then
    PORT_443_OK=false
fi

echo ""

if [ "$PORT_80_OK" = false ]; then
    read -p "Port 80 is in use. Continue anyway? (yes/no): " continue_anyway
    if [ "$continue_anyway" != "yes" ]; then
        echo "Deployment cancelled"
        exit 1
    fi
fi

# Function to show menu
show_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Deploy (start services)"
    echo "2) Stop services"
    echo "3) Restart services"
    echo "4) View logs"
    echo "5) Check status"
    echo "6) Setup SSL (self-signed)"
    echo "7) Setup SSL (Let's Encrypt)"
    echo "8) Enable HTTPS in Nginx"
    echo "9) Cleanup (remove all)"
    echo "10) Exit"
    echo ""
    read -p "Enter choice [1-10]: " choice
}

# Deploy services
deploy() {
    echo ""
    echo -e "${GREEN}[DEPLOY]${NC} Starting services..."
    docker-compose -f docker-compose.host.yml up -d --build
    echo ""
    echo -e "${GREEN}[SUCCESS]${NC} Services started!"
    echo ""
    echo "Dashboard available at:"
    echo "  HTTP:  http://$(hostname -I | awk '{print $1}')"
    echo "  Local: http://localhost"
    echo ""
    docker-compose -f docker-compose.host.yml ps
}

# Stop services
stop() {
    echo ""
    echo -e "${YELLOW}[STOP]${NC} Stopping services..."
    docker-compose -f docker-compose.host.yml down
    echo -e "${GREEN}[OK]${NC} Services stopped"
}

# Restart services
restart() {
    echo ""
    echo -e "${GREEN}[RESTART]${NC} Restarting services..."
    docker-compose -f docker-compose.host.yml restart
    echo -e "${GREEN}[OK]${NC} Services restarted"
    docker-compose -f docker-compose.host.yml ps
}

# View logs
view_logs() {
    echo ""
    echo -e "${GREEN}[LOGS]${NC} Viewing logs (Ctrl+C to exit)..."
    docker-compose -f docker-compose.host.yml logs -f
}

# Check status
check_status() {
    echo ""
    echo -e "${GREEN}[STATUS]${NC} Container Status:"
    docker-compose -f docker-compose.host.yml ps
    echo ""
    echo "Port Status:"
    netstat -tuln | grep -E ":(80|443|5000) "
    echo ""
    echo "Testing endpoints..."
    if curl -s http://localhost/api/health > /dev/null; then
        echo -e "${GREEN}[OK]${NC} Backend health check passed"
    else
        echo -e "${RED}[ERROR]${NC} Backend health check failed"
    fi
}

# Setup self-signed SSL
setup_ssl_self_signed() {
    echo ""
    echo -e "${GREEN}[SSL]${NC} Generating self-signed certificate..."
    
    mkdir -p nginx/ssl
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/privkey.pem \
        -out nginx/ssl/fullchain.pem \
        -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Monitoring/CN=$(hostname)"
    
    chmod 644 nginx/ssl/fullchain.pem
    chmod 600 nginx/ssl/privkey.pem
    
    echo -e "${GREEN}[OK]${NC} Self-signed certificate generated"
    echo "Certificate valid for 365 days"
    echo ""
    echo "Next step: Enable HTTPS in Nginx (option 8)"
}

# Setup Let's Encrypt SSL
setup_ssl_letsencrypt() {
    echo ""
    echo -e "${GREEN}[SSL]${NC} Setting up Let's Encrypt..."
    
    read -p "Enter your domain name: " domain
    read -p "Enter your email: " email
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        apt update
        apt install -y certbot
    fi
    
    # Stop nginx temporarily
    echo "Stopping nginx container..."
    docker-compose -f docker-compose.host.yml stop nginx
    
    # Generate certificate
    echo "Generating certificate for $domain..."
    certbot certonly --standalone -d "$domain" --email "$email" --agree-tos --non-interactive
    
    # Copy certificates
    mkdir -p nginx/ssl
    cp "/etc/letsencrypt/live/$domain/fullchain.pem" nginx/ssl/
    cp "/etc/letsencrypt/live/$domain/privkey.pem" nginx/ssl/
    chmod 644 nginx/ssl/fullchain.pem
    chmod 600 nginx/ssl/privkey.pem
    
    echo -e "${GREEN}[OK]${NC} Let's Encrypt certificate generated"
    echo ""
    echo "Next steps:"
    echo "1. Update server_name in nginx/nginx-host.conf to: $domain"
    echo "2. Enable HTTPS in Nginx (option 8)"
    echo "3. Restart services"
}

# Enable HTTPS in Nginx
enable_https() {
    echo ""
    echo -e "${GREEN}[HTTPS]${NC} Enabling HTTPS in Nginx configuration..."
    
    # Check if SSL files exist
    if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
        echo -e "${RED}[ERROR]${NC} SSL certificates not found!"
        echo "Please setup SSL first (option 6 or 7)"
        return 1
    fi
    
    # Backup original config
    cp nginx/nginx-host.conf nginx/nginx-host.conf.backup
    
    echo "Uncomment HTTPS server block in nginx/nginx-host.conf manually, or run:"
    echo ""
    echo "  sed -i 's/# *server {/server {/g' nginx/nginx-host.conf"
    echo "  sed -i 's/# *listen 443/listen 443/g' nginx/nginx-host.conf"
    echo "  sed -i 's/# *ssl_/ssl_/g' nginx/nginx-host.conf"
    echo ""
    read -p "Auto-enable HTTPS now? (yes/no): " auto_enable
    
    if [ "$auto_enable" = "yes" ]; then
        # This is a simple approach - you may need to edit manually for production
        sed -i 's/^    # server {/    server {/g' nginx/nginx-host.conf
        sed -i 's/^    #     /    /g' nginx/nginx-host.conf
        
        echo -e "${GREEN}[OK]${NC} HTTPS enabled"
        echo "Restarting nginx..."
        docker-compose -f docker-compose.host.yml restart nginx
        echo -e "${GREEN}[OK]${NC} Nginx restarted with HTTPS"
        echo ""
        echo "Dashboard available at:"
        echo "  HTTPS: https://$(hostname -I | awk '{print $1}')"
    else
        echo "Please edit nginx/nginx-host.conf manually"
    fi
}

# Cleanup
cleanup() {
    echo ""
    echo -e "${RED}[WARNING]${NC} This will remove all containers and data!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        echo "Cleaning up..."
        docker-compose -f docker-compose.host.yml down -v
        echo -e "${GREEN}[OK]${NC} Cleanup complete"
    else
        echo "Cleanup cancelled"
    fi
}

# Main loop
while true; do
    show_menu
    case $choice in
        1) deploy ;;
        2) stop ;;
        3) restart ;;
        4) view_logs ;;
        5) check_status ;;
        6) setup_ssl_self_signed ;;
        7) setup_ssl_letsencrypt ;;
        8) enable_https ;;
        9) cleanup ;;
        10) echo "Goodbye!"; exit 0 ;;
        *) echo -e "${RED}[ERROR]${NC} Invalid option!" ;;
    esac
    echo ""
    read -p "Press Enter to continue..."
done

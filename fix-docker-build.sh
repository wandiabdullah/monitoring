#!/bin/bash
# Docker Build Fix Script
# This script fixes common Docker build issues with IPv6 and network connectivity

set -e

echo "=========================================="
echo "Docker Build Fix Script"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Warning: This script may need sudo privileges${NC}"
fi

echo "1. Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

echo ""
echo "2. Checking Docker daemon status..."
if ! systemctl is-active --quiet docker 2>/dev/null; then
    echo -e "${YELLOW}Docker daemon is not running. Starting...${NC}"
    sudo systemctl start docker
fi
echo -e "${GREEN}✓ Docker daemon is running${NC}"

echo ""
echo "3. Checking current Docker daemon config..."
if [ -f /etc/docker/daemon.json ]; then
    echo "Current daemon.json:"
    cat /etc/docker/daemon.json
else
    echo "No daemon.json found"
fi

echo ""
echo "4. Creating optimized daemon.json..."
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "ipv6": false,
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
echo -e "${GREEN}✓ daemon.json created${NC}"

echo ""
echo "5. Restarting Docker daemon..."
sudo systemctl restart docker
sleep 3
echo -e "${GREEN}✓ Docker daemon restarted${NC}"

echo ""
echo "6. Testing Docker Hub connectivity..."
if curl -s -I https://registry-1.docker.io/v2/ | grep -q "401"; then
    echo -e "${GREEN}✓ Docker Hub is reachable${NC}"
else
    echo -e "${RED}✗ Docker Hub connectivity issue${NC}"
    echo "Trying alternative DNS..."
    sudo systemctl restart systemd-resolved 2>/dev/null || true
fi

echo ""
echo "7. Pulling base Python image..."
if docker pull python:3.11-slim; then
    echo -e "${GREEN}✓ Base image pulled successfully${NC}"
else
    echo -e "${YELLOW}Warning: Failed to pull python:3.11-slim${NC}"
    echo "Trying Alpine version..."
    if docker pull python:3.11-alpine; then
        echo -e "${GREEN}✓ Alpine image pulled successfully${NC}"
        echo -e "${YELLOW}Use Dockerfile.alpine for building${NC}"
    else
        echo -e "${RED}✗ Failed to pull images${NC}"
        echo "Please check your network connection"
    fi
fi

echo ""
echo "8. Cleaning up old images..."
docker image prune -f > /dev/null 2>&1 || true
echo -e "${GREEN}✓ Cleanup done${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}Docker fix completed!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. cd /path/to/monitoring"
echo "2. docker-compose build"
echo "3. docker-compose up -d"
echo ""
echo "If build still fails, try:"
echo "  docker-compose -f docker-compose.yml build --no-cache"
echo ""
echo "Or use Alpine version:"
echo "  docker build -f Dockerfile.alpine -t monitoring-backend ."
echo ""

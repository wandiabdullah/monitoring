#!/bin/bash
# Docker deployment script for monitoring system

set -e

echo "🐳 Monitoring System - Docker Deployment"
echo "========================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed!"
    echo "Please install Docker Compose first"
    exit 1
fi

echo "✅ Docker version: $(docker --version)"
echo "✅ Docker Compose version: $(docker-compose --version)"
echo ""

# Function to show menu
show_menu() {
    echo "Choose an option:"
    echo "1) Build and start containers"
    echo "2) Start existing containers"
    echo "3) Stop containers"
    echo "4) View logs"
    echo "5) Restart containers"
    echo "6) Clean up (remove containers and volumes)"
    echo "7) Rebuild (no cache)"
    echo "8) Show status"
    echo "9) Backup data"
    echo "10) Exit"
    echo ""
    read -p "Enter choice [1-10]: " choice
}

# Function to build and start
build_and_start() {
    echo "🔨 Building and starting containers..."
    docker-compose up -d --build
    echo ""
    echo "✅ Containers started successfully!"
    echo "📊 Dashboard: http://localhost:5000"
    echo ""
    docker-compose ps
}

# Function to start
start() {
    echo "▶️  Starting containers..."
    docker-compose start
    echo ""
    echo "✅ Containers started!"
    docker-compose ps
}

# Function to stop
stop() {
    echo "⏹️  Stopping containers..."
    docker-compose stop
    echo "✅ Containers stopped!"
}

# Function to view logs
view_logs() {
    echo "📋 Viewing logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

# Function to restart
restart() {
    echo "🔄 Restarting containers..."
    docker-compose restart
    echo "✅ Containers restarted!"
    docker-compose ps
}

# Function to clean up
cleanup() {
    echo "⚠️  WARNING: This will remove all containers and data!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        echo "🧹 Cleaning up..."
        docker-compose down -v
        echo "✅ Cleanup complete!"
    else
        echo "❌ Cleanup cancelled"
    fi
}

# Function to rebuild
rebuild() {
    echo "🔨 Rebuilding containers (no cache)..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo ""
    echo "✅ Rebuild complete!"
    echo "📊 Dashboard: http://localhost:5000"
    echo ""
    docker-compose ps
}

# Function to show status
show_status() {
    echo "📊 Container Status:"
    docker-compose ps
    echo ""
    echo "💾 Volumes:"
    docker volume ls | grep monitoring
    echo ""
    echo "🌐 Networks:"
    docker network ls | grep monitoring
}

# Function to backup
backup() {
    BACKUP_FILE="monitoring-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    echo "💾 Creating backup: $BACKUP_FILE"
    docker run --rm -v monitoring_monitoring-data:/data -v $(pwd):/backup alpine tar czf /backup/$BACKUP_FILE -C /data .
    echo "✅ Backup created: $BACKUP_FILE"
}

# Main loop
while true; do
    show_menu
    case $choice in
        1) build_and_start ;;
        2) start ;;
        3) stop ;;
        4) view_logs ;;
        5) restart ;;
        6) cleanup ;;
        7) rebuild ;;
        8) show_status ;;
        9) backup ;;
        10) echo "👋 Goodbye!"; exit 0 ;;
        *) echo "❌ Invalid option!" ;;
    esac
    echo ""
    read -p "Press Enter to continue..."
    clear
done

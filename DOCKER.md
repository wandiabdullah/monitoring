# 🐳 Docker Deployment Guide

Panduan lengkap untuk menjalankan sistem monitoring menggunakan Docker.

## 📋 Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

### Install Docker

**Windows:**
- Download Docker Desktop dari https://www.docker.com/products/docker-desktop
- Install dan restart

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Verify Installation:**
```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start

### 1. Build and Run with Docker Compose

```bash
# Clone or navigate to project directory
cd monitoring

# Build and start the container
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Dashboard akan tersedia di: **http://localhost:5000**

### 2. Stop and Remove

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (delete data)
docker-compose down -v
```

## 📊 Docker Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Docker Host                           │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  monitoring-backend Container                     │ │
│  │                                                   │ │
│  │  ┌─────────────────┐    ┌──────────────────┐   │ │
│  │  │  Flask Backend  │    │  Dashboard       │   │ │
│  │  │  (Port 5000)    │◄───┤  (HTML/JS)       │   │ │
│  │  └─────────────────┘    └──────────────────┘   │ │
│  │                                                   │ │
│  │  Volume: monitoring-data                         │ │
│  │  (/app/backend/data)                             │ │
│  └───────────────────┬───────────────────────────────┘ │
│                      │                                  │
│                      │ Port 5000                        │
│                      │                                  │
└──────────────────────┼──────────────────────────────────┘
                       │
                       ▼
                  Host Port 5000
                  (http://localhost:5000)
```

## 🔧 Configuration

### Environment Variables

Edit `docker-compose.yml` untuk customize environment variables:

```yaml
environment:
  - FLASK_APP=app.py
  - MONITORING_PORT=5000
  - FLASK_DEBUG=0  # Set to 1 for debug mode
```

### Port Mapping

Untuk menggunakan port berbeda, edit `docker-compose.yml`:

```yaml
ports:
  - "8080:5000"  # Host:Container
```

Akses via: http://localhost:8080

### Data Persistence

Data disimpan di Docker volume `monitoring-data`. Data akan persist meskipun container di-restart atau di-rebuild.

**Backup data:**
```bash
docker run --rm -v monitoring_monitoring-data:/data -v $(pwd):/backup alpine tar czf /backup/monitoring-backup.tar.gz -C /data .
```

**Restore data:**
```bash
docker run --rm -v monitoring_monitoring-data:/data -v $(pwd):/backup alpine tar xzf /backup/monitoring-backup.tar.gz -C /data
```

## 🛠️ Docker Commands

### Build & Run

```bash
# Build image
docker-compose build

# Build without cache
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Start and view logs
docker-compose up
```

### Management

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs

# Follow logs
docker-compose logs -f

# View logs for specific time
docker-compose logs --since 30m

# Restart containers
docker-compose restart

# Stop containers
docker-compose stop

# Start stopped containers
docker-compose start

# Remove containers
docker-compose down
```

### Debugging

```bash
# Execute command in running container
docker-compose exec monitoring-backend bash

# Check container health
docker inspect monitoring-backend --format='{{.State.Health.Status}}'

# View container resource usage
docker stats monitoring-backend
```

### Cleanup

```bash
# Remove stopped containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all

# Clean up all unused Docker resources
docker system prune -a
```

## 📦 Production Deployment

### Using Docker Compose (Recommended)

**1. Prepare server:**
```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Copy project files to server
scp -r monitoring/ user@server:/opt/
```

**2. Deploy:**
```bash
ssh user@server
cd /opt/monitoring

# Production docker-compose
docker-compose -f docker-compose.yml up -d

# Enable auto-start on boot
docker update --restart=always monitoring-backend
```

**3. Setup Nginx reverse proxy (optional but recommended):**

```bash
sudo apt install nginx

sudo nano /etc/nginx/sites-available/monitoring
```

Add:
```nginx
server {
    listen 80;
    server_name monitoring.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/monitoring /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Using Docker Swarm

**Init swarm:**
```bash
docker swarm init
```

**Deploy stack:**
```bash
docker stack deploy -c docker-compose.yml monitoring
```

**Scale services:**
```bash
docker service scale monitoring_monitoring-backend=3
```

## 🐳 Advanced Docker Configurations

### Multi-Stage Build (Optimized)

Create `Dockerfile.production`:

```dockerfile
# Build stage
FROM python:3.11-slim as builder

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim

WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY backend/ /app/backend/
COPY dashboard/ /app/dashboard/

ENV PATH=/root/.local/bin:$PATH
WORKDIR /app/backend
EXPOSE 5000

CMD ["python", "app.py"]
```

Build:
```bash
docker build -f Dockerfile.production -t monitoring:production .
```

### Docker Compose with Database

Create `docker-compose.db.yml`:

```yaml
version: '3.8'

services:
  monitoring-backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://monitoring:password@postgres:5432/monitoring
    depends_on:
      - postgres
    networks:
      - monitoring-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=monitoring
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=monitoring
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - monitoring-network

volumes:
  postgres-data:
  monitoring-data:

networks:
  monitoring-network:
    driver: bridge
```

Run:
```bash
docker-compose -f docker-compose.db.yml up -d
```

### Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
  interval: 30s      # Check every 30 seconds
  timeout: 10s       # Timeout after 10 seconds
  retries: 3         # Retry 3 times before marking unhealthy
  start_period: 10s  # Grace period on startup
```

## 🔍 Monitoring Docker Container

### Container Metrics

```bash
# CPU, Memory, Network usage
docker stats monitoring-backend

# Detailed inspection
docker inspect monitoring-backend

# Check logs
docker logs monitoring-backend -f --tail 100
```

### Integration with Monitoring System

Agents can send data to Docker container:

```bash
# From Linux server
python3 monitor_agent.py --server http://DOCKER_HOST_IP:5000
```

## 🚨 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs

# Check if port is already in use
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Linux/Mac

# Rebuild container
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Health check failing

```bash
# Check health status
docker inspect monitoring-backend --format='{{json .State.Health}}'

# Test manually
docker exec monitoring-backend curl http://localhost:5000/api/health

# Check Flask is running
docker exec monitoring-backend ps aux
```

### Permission issues

```bash
# Fix volume permissions
docker-compose down
docker volume rm monitoring_monitoring-data
docker-compose up -d
```

### Memory issues

```bash
# Limit container memory in docker-compose.yml
services:
  monitoring-backend:
    mem_limit: 512m
    mem_reservation: 256m
```

## 📊 Performance Tuning

### Resource Limits

```yaml
services:
  monitoring-backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'      # 50% of one CPU
          memory: 512M     # Max 512MB RAM
        reservations:
          cpus: '0.25'     # Reserve 25% of one CPU
          memory: 256M     # Reserve 256MB RAM
```

### Logging

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"     # Max log file size
    max-file: "3"       # Keep 3 log files
```

## 🔐 Security Best Practices

### Run as non-root user

Add to Dockerfile:
```dockerfile
RUN useradd -m -u 1000 monitoring && \
    chown -R monitoring:monitoring /app

USER monitoring
```

### Read-only root filesystem

```yaml
services:
  monitoring-backend:
    read_only: true
    tmpfs:
      - /tmp
      - /app/backend/data
```

### Security scanning

```bash
# Scan image for vulnerabilities
docker scan monitoring-backend

# Use Docker Bench for Security
docker run -it --net host --pid host --userns host --cap-add audit_control \
  -v /var/lib:/var/lib -v /var/run/docker.sock:/var/run/docker.sock \
  docker/docker-bench-security
```

## 📝 Cheat Sheet

```bash
# Quick Commands
docker-compose up -d              # Start
docker-compose down               # Stop
docker-compose logs -f            # View logs
docker-compose restart            # Restart
docker-compose ps                 # Status
docker-compose exec <service> sh  # Shell access

# Cleanup
docker system prune -a            # Remove all unused
docker volume prune               # Remove unused volumes
docker image prune -a             # Remove unused images

# Backup/Restore
docker-compose down               # Stop first
docker run --rm -v monitoring_monitoring-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .  # Backup
docker run --rm -v monitoring_monitoring-data:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar.gz -C /data   # Restore
```

## 🎯 Next Steps

1. ✅ Deploy dengan Docker Compose
2. ✅ Setup Nginx reverse proxy
3. ✅ Configure SSL/HTTPS
4. ✅ Setup monitoring untuk container
5. ✅ Implement backup strategy
6. ✅ Configure alerts

---

**Docker deployment ready! 🐳🚀**

Dashboard: http://localhost:5000

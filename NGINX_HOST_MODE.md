# 🌐 Nginx Host Network Mode - Deployment Guide

Panduan setup Nginx sebagai reverse proxy dalam Docker menggunakan **host network mode**, sehingga tidak perlu install Nginx di server fisik.

## 🎯 Keuntungan Host Network Mode

✅ **Tidak perlu install Nginx di server** - Semua dalam Docker  
✅ **Akses langsung ke port 80/443** - Tanpa port mapping  
✅ **Performance optimal** - Tidak ada overhead network bridge  
✅ **IP address preservation** - Real client IP langsung terlihat  
✅ **Simplified networking** - Tidak perlu expose ports  

## 🚀 Quick Start

### 1. Deploy dengan Host Network Mode

```bash
# Start services
docker-compose -f docker-compose.host.yml up -d

# Check status
docker-compose -f docker-compose.host.yml ps

# View logs
docker-compose -f docker-compose.host.yml logs -f
```

**Dashboard akan tersedia di:**
- HTTP: `http://YOUR_SERVER_IP` (port 80)
- Backend: `http://YOUR_SERVER_IP:5000` (jika diakses langsung)

### 2. Stop Services

```bash
docker-compose -f docker-compose.host.yml down
```

## 📊 Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Physical Server                         │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Nginx Container (Host Network Mode)                 │ │
│  │  - Listens on: 0.0.0.0:80, 0.0.0.0:443              │ │
│  │  - Proxies to: 127.0.0.1:5000                       │ │
│  └──────────────────┬───────────────────────────────────┘ │
│                     │                                      │
│                     │ Localhost                            │
│                     │                                      │
│  ┌──────────────────▼───────────────────────────────────┐ │
│  │  Backend Container (Host Network Mode)              │ │
│  │  - Listens on: 127.0.0.1:5000                       │ │
│  │  - Flask App + Dashboard                            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
         │                              │
         │ Port 80                      │ Port 443 (HTTPS)
         │                              │
         ▼                              ▼
    Users/Agents                    Users/Agents
```

## 🔧 Configuration

### docker-compose.host.yml

Sudah dikonfigurasi dengan:
- ✅ Host network mode untuk Nginx dan Backend
- ✅ Nginx proxy ke localhost:5000
- ✅ Volume persistence untuk data
- ✅ Auto-restart on failure
- ✅ Health checks
- ✅ Logging configuration

### nginx-host.conf

Features:
- ✅ HTTP server on port 80
- ✅ Proxy pass ke backend
- ✅ Gzip compression
- ✅ Static file caching
- ✅ Security headers
- ✅ SSL/HTTPS ready (commented out)

## 📝 Setup SSL/HTTPS

### Option 1: Self-Signed Certificate (Development/Testing)

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Generate certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Monitoring/CN=monitoring.local"

# Edit nginx/nginx-host.conf - uncomment HTTPS server block
# Restart nginx
docker-compose -f docker-compose.host.yml restart nginx
```

### Option 2: Let's Encrypt (Production)

```bash
# Install certbot on host (one-time)
sudo apt update
sudo apt install certbot -y

# Stop nginx container temporarily
docker-compose -f docker-compose.host.yml stop nginx

# Generate certificate (replace with your domain)
sudo certbot certonly --standalone -d monitoring.yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/monitoring.yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/monitoring.yourdomain.com/privkey.pem nginx/ssl/

# Set proper permissions
sudo chmod 644 nginx/ssl/fullchain.pem
sudo chmod 600 nginx/ssl/privkey.pem

# Edit nginx/nginx-host.conf - uncomment HTTPS server block
# Update server_name to your domain

# Restart services
docker-compose -f docker-compose.host.yml up -d
```

### Auto-Renewal Setup (Let's Encrypt)

Create renewal script `renew-ssl.sh`:

```bash
#!/bin/bash
# Stop nginx for renewal
docker-compose -f /path/to/monitoring/docker-compose.host.yml stop nginx

# Renew certificate
certbot renew --standalone

# Copy new certificates
cp /etc/letsencrypt/live/monitoring.yourdomain.com/fullchain.pem /path/to/monitoring/nginx/ssl/
cp /etc/letsencrypt/live/monitoring.yourdomain.com/privkey.pem /path/to/monitoring/nginx/ssl/

# Restart nginx
docker-compose -f /path/to/monitoring/docker-compose.host.yml start nginx
```

Add to crontab:
```bash
# Edit crontab
sudo crontab -e

# Add this line (renew every month)
0 0 1 * * /path/to/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1
```

## 🔍 Port Configuration

### Default Ports (Host Network Mode)

- **Port 80 (HTTP)**: Nginx listens, proxies to backend
- **Port 443 (HTTPS)**: Nginx listens (when SSL enabled)
- **Port 5000**: Backend Flask app (localhost only)

### Check Port Usage

```bash
# Check if port 80 is available
sudo netstat -tuln | grep :80

# Check if port 443 is available
sudo netstat -tuln | grep :443

# Check if port 5000 is available
sudo netstat -tuln | grep :5000
```

### Free Up Ports (if needed)

```bash
# Find process using port 80
sudo lsof -i :80

# Stop Apache (if running)
sudo systemctl stop apache2

# Stop system Nginx (if installed)
sudo systemctl stop nginx
sudo systemctl disable nginx
```

## 🛠️ Management Commands

### Start/Stop/Restart

```bash
# Start all services
docker-compose -f docker-compose.host.yml up -d

# Stop all services
docker-compose -f docker-compose.host.yml down

# Restart all services
docker-compose -f docker-compose.host.yml restart

# Restart only nginx
docker-compose -f docker-compose.host.yml restart nginx

# Restart only backend
docker-compose -f docker-compose.host.yml restart monitoring-backend
```

### View Logs

```bash
# All logs
docker-compose -f docker-compose.host.yml logs -f

# Nginx logs only
docker-compose -f docker-compose.host.yml logs -f nginx

# Backend logs only
docker-compose -f docker-compose.host.yml logs -f monitoring-backend

# Last 100 lines
docker-compose -f docker-compose.host.yml logs --tail=100
```

### Status & Health

```bash
# Container status
docker-compose -f docker-compose.host.yml ps

# Detailed status
docker ps --filter name=monitoring

# Check health
docker inspect monitoring-backend --format='{{.State.Health.Status}}'

# Test endpoints
curl http://localhost/api/health
curl http://localhost
```

## 🔐 Firewall Configuration

### Ubuntu/Debian (UFW)

```bash
# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### CentOS/RHEL (firewalld)

```bash
# Allow HTTP
sudo firewall-cmd --permanent --add-service=http

# Allow HTTPS
sudo firewall-cmd --permanent --add-service=https

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

## 📈 Performance Tuning

### Nginx Cache

Already configured in `nginx-host.conf`:
- Static files cached for 1 hour
- Cache size: 100MB
- No cache for API endpoints

### Backend Optimization

Edit `docker-compose.host.yml` to add resource limits:

```yaml
services:
  monitoring-backend:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 🐛 Troubleshooting

### Port 80 Already in Use

```bash
# Check what's using port 80
sudo lsof -i :80

# Stop Apache
sudo systemctl stop apache2
sudo systemctl disable apache2

# Or stop system Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Then restart containers
docker-compose -f docker-compose.host.yml restart
```

### Nginx Container Won't Start

```bash
# Check nginx config syntax
docker run --rm -v $(pwd)/nginx/nginx-host.conf:/etc/nginx/nginx.conf:ro nginx:alpine nginx -t

# View nginx logs
docker-compose -f docker-compose.host.yml logs nginx

# Rebuild and restart
docker-compose -f docker-compose.host.yml down
docker-compose -f docker-compose.host.yml up -d
```

### Cannot Access from Other Machines

```bash
# Check firewall
sudo ufw status

# Check container is running
docker ps | grep nginx

# Check nginx is listening
sudo netstat -tuln | grep :80

# Test from server
curl http://localhost
curl http://127.0.0.1
```

### SSL Certificate Issues

```bash
# Check certificate files exist
ls -la nginx/ssl/

# Check certificate validity
openssl x509 -in nginx/ssl/fullchain.pem -text -noout

# Check private key
openssl rsa -in nginx/ssl/privkey.pem -check
```

## 🔄 Agent Connection

Agents dari Linux servers bisa connect ke:

```bash
# HTTP
python3 monitor_agent.py --server http://YOUR_SERVER_IP

# HTTPS (jika SSL enabled)
python3 monitor_agent.py --server https://monitoring.yourdomain.com
```

**Note:** Karena menggunakan Nginx reverse proxy, agents tetap mengirim ke port 80/443, Nginx akan forward ke backend port 5000.

## 📊 Monitoring Nginx

### Access Logs

```bash
# Real-time access logs
docker exec monitoring-nginx tail -f /var/log/nginx/access.log

# Search for specific IP
docker exec monitoring-nginx grep "192.168.1.100" /var/log/nginx/access.log
```

### Error Logs

```bash
# Real-time error logs
docker exec monitoring-nginx tail -f /var/log/nginx/error.log
```

### Cache Status

Headers will show cache status:
- `X-Cache-Status: HIT` - Served from cache
- `X-Cache-Status: MISS` - Not in cache
- `X-Cache-Status: BYPASS` - Cache bypassed

## 🎯 Production Checklist

Before going to production:

- [ ] SSL certificates configured (Let's Encrypt)
- [ ] Firewall configured (ports 80, 443)
- [ ] Auto-renewal script setup for SSL
- [ ] Backup strategy in place
- [ ] Resource limits configured
- [ ] Logging reviewed
- [ ] Health checks working
- [ ] Test agent connections
- [ ] Monitor container resources
- [ ] Document server IP/domain

## 📚 Related Documentation

- [DOCKER.md](DOCKER.md) - Complete Docker guide
- [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) - Quick Docker setup
- [README.md](README.md) - Main documentation

---

## 🎉 Quick Commands Summary

```bash
# Deploy
docker-compose -f docker-compose.host.yml up -d

# Access Dashboard
http://YOUR_SERVER_IP

# View logs
docker-compose -f docker-compose.host.yml logs -f

# Restart
docker-compose -f docker-compose.host.yml restart

# Stop
docker-compose -f docker-compose.host.yml down
```

**Dashboard ready dengan Nginx reverse proxy! 🌐🚀**

No need to install Nginx on host - everything runs in Docker!

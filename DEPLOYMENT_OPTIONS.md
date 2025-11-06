# 📋 Docker Deployment Options - Quick Reference

Pilih deployment method yang sesuai dengan kebutuhan Anda.

## 🎯 Available Options

### 1. **Basic Docker (Development)**
📁 File: `docker-compose.yml`

```bash
docker-compose up -d
```

**Features:**
- ✅ Simple setup
- ✅ Port mapping (5000:5000)
- ✅ Good for testing/development
- ✅ In-memory storage

**Access:** http://localhost:5000

**Use Case:** Local development, testing

---

### 2. **Docker with PostgreSQL**
📁 File: `docker-compose.postgres.yml`

```bash
docker-compose -f docker-compose.postgres.yml up -d
```

**Features:**
- ✅ PostgreSQL database included
- ✅ Persistent storage
- ✅ Better for production
- ✅ Optional Redis cache

**Access:** http://localhost:5000

**Use Case:** Production with database persistence

---

### 3. **Docker with Nginx (Bridge Network)**
📁 File: `docker-compose.production.yml`

```bash
docker-compose -f docker-compose.production.yml up -d
```

**Features:**
- ✅ Nginx reverse proxy
- ✅ SSL/HTTPS ready
- ✅ Resource limits
- ✅ Production logging
- ✅ Cache configuration

**Access:** http://localhost (port 80)

**Use Case:** Production deployment with proxy

---

### 4. **Nginx Host Network Mode** ⭐ RECOMMENDED
📁 File: `docker-compose.host.yml`

```bash
sudo docker-compose -f docker-compose.host.yml up -d
```

**Features:**
- ✅ No need to install Nginx on host
- ✅ Direct access to port 80/443
- ✅ Best performance
- ✅ Real client IP preservation
- ✅ Simplified networking

**Access:** http://SERVER_IP (port 80)

**Use Case:** Production deployment, best performance

---

## 📊 Comparison Table

| Feature | Basic | PostgreSQL | Nginx Bridge | **Nginx Host** |
|---------|-------|-----------|--------------|----------------|
| Ease of Setup | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Performance | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Database | ❌ | ✅ PostgreSQL | ❌ | ❌ |
| Reverse Proxy | ❌ | ❌ | ✅ Nginx | ✅ Nginx |
| SSL/HTTPS | ❌ | ❌ | ✅ | ✅ |
| Port 80/443 | ❌ | ❌ | ✅ | ✅ |
| Nginx Install | N/A | N/A | In Docker | In Docker |
| Network Mode | Bridge | Bridge | Bridge | **Host** |
| Production Ready | ❌ | ✅ | ✅ | ✅✅ |

## 🚀 Quick Start Commands

### Basic Development
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f
```

### With PostgreSQL
```bash
# Start
docker-compose -f docker-compose.postgres.yml up -d

# Stop
docker-compose -f docker-compose.postgres.yml down

# Logs
docker-compose -f docker-compose.postgres.yml logs -f
```

### Nginx Bridge Mode
```bash
# Start
docker-compose -f docker-compose.production.yml up -d

# Stop
docker-compose -f docker-compose.production.yml down

# Logs
docker-compose -f docker-compose.production.yml logs -f
```

### Nginx Host Mode (Recommended)
```bash
# Start (requires sudo for port 80/443)
sudo docker-compose -f docker-compose.host.yml up -d

# Stop
sudo docker-compose -f docker-compose.host.yml down

# Logs
sudo docker-compose -f docker-compose.host.yml logs -f

# Or use interactive script
sudo chmod +x deploy-nginx-host.sh
sudo ./deploy-nginx-host.sh
```

## 🎯 Use Case Recommendations

### Scenario 1: Local Testing/Development
**Use:** `docker-compose.yml` (Basic)
```bash
docker-compose up -d
```
Access: http://localhost:5000

---

### Scenario 2: Need Persistent Database
**Use:** `docker-compose.postgres.yml`
```bash
docker-compose -f docker-compose.postgres.yml up -d
```
Access: http://localhost:5000

---

### Scenario 3: Production (Small Scale)
**Use:** `docker-compose.production.yml`
```bash
docker-compose -f docker-compose.production.yml up -d
```
Access: http://server-ip

---

### Scenario 4: Production (Best Performance) ⭐
**Use:** `docker-compose.host.yml`
```bash
sudo docker-compose -f docker-compose.host.yml up -d
```
Access: http://server-ip

**Why Host Mode?**
- No need to install Nginx on server
- Direct port 80/443 access
- Better performance (no network bridge overhead)
- Real client IP addresses
- Simplified configuration

---

## 📁 File Structure

```
monitoring/
├── docker-compose.yml              # Basic setup
├── docker-compose.postgres.yml     # With PostgreSQL
├── docker-compose.production.yml   # Nginx bridge mode
├── docker-compose.host.yml         # Nginx host mode ⭐
├── Dockerfile                      # Image definition
├── .dockerignore                   # Build optimization
├── nginx/
│   ├── nginx.conf                 # Nginx config (bridge mode)
│   ├── nginx-host.conf            # Nginx config (host mode)
│   ├── ssl/                       # SSL certificates
│   └── README.md
├── docker-deploy.sh               # Interactive deployment
├── docker-deploy.bat              # Windows deployment
└── deploy-nginx-host.sh           # Nginx host mode deployment ⭐
```

## 🔧 Port Configuration

### Basic Mode
- Container: 5000
- Host: 5000
- Access: http://localhost:5000

### PostgreSQL Mode
- Container: 5000
- Host: 5000
- Database: 5432 (internal)
- Access: http://localhost:5000

### Nginx Bridge Mode
- Nginx Container: 80, 443
- Backend Container: 5000 (internal)
- Host: 80, 443
- Access: http://localhost

### Nginx Host Mode
- Nginx: 80, 443 (direct on host)
- Backend: 5000 (localhost only)
- Access: http://server-ip

## 🔐 SSL/HTTPS Setup

All Nginx-based deployments support SSL:

### Self-Signed (Development)
```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem
```

### Let's Encrypt (Production)
```bash
# For host mode
sudo ./deploy-nginx-host.sh
# Choose option 7: Setup SSL (Let's Encrypt)

# Manual setup
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/*.pem nginx/ssl/
```

## 📚 Documentation

- 📖 [DOCKER.md](DOCKER.md) - Complete Docker guide
- 🚀 [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) - Quick start
- 🌐 [NGINX_HOST_MODE.md](NGINX_HOST_MODE.md) - Nginx host mode guide
- 📋 [README.md](README.md) - Main documentation

## 💡 Tips

### Development
- Use `docker-compose.yml` for quick testing
- Mount code volumes for live reload
- Use `docker-compose logs -f` to debug

### Production
- Use `docker-compose.host.yml` for best performance
- Setup SSL certificates (Let's Encrypt)
- Configure firewall (allow 80, 443)
- Setup monitoring and alerts
- Regular backups of volumes
- Use resource limits

### Migration Path
1. Start with basic (`docker-compose.yml`)
2. Test with PostgreSQL if needed
3. Deploy to production with host mode
4. Add SSL/HTTPS
5. Setup monitoring and backups

## 🎉 Recommended Deployment

For production deployment, we recommend:

**Nginx Host Network Mode** (`docker-compose.host.yml`)

```bash
# 1. Deploy
sudo docker-compose -f docker-compose.host.yml up -d

# 2. Setup SSL (Let's Encrypt)
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/*.pem nginx/ssl/

# 3. Enable HTTPS in nginx-host.conf
# Uncomment HTTPS server block

# 4. Restart
sudo docker-compose -f docker-compose.host.yml restart nginx

# Done! Access via https://yourdomain.com
```

**Or use the interactive script:**
```bash
sudo chmod +x deploy-nginx-host.sh
sudo ./deploy-nginx-host.sh
```

---

**Choose the deployment that fits your needs! 🚀**

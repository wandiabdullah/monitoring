# Docker Build Fix Guide

## Error: Network Unreachable for Docker Hub

Error yang Anda alami:
```
failed to resolve source metadata for docker.io/library/python:3.11-slim: 
dial tcp [2600:1f18:2148:bc02:a06a:ba27:be73:f0a3]:443: 
connect: network is unreachable
```

Ini adalah masalah **IPv6 connectivity**. Docker mencoba menggunakan IPv6 tapi gagal.

## ✅ Solusi Quick Fix

### Option 1: Disable IPv6 di Docker (Tercepat)

Edit atau buat file `/etc/docker/daemon.json`:

```bash
sudo nano /etc/docker/daemon.json
```

Tambahkan:
```json
{
  "ipv6": false,
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

Kemudian build lagi:
```bash
docker-compose build
```

### Option 2: Force IPv4 di Docker Daemon

Edit `/etc/docker/daemon.json`:
```json
{
  "registry-mirrors": [],
  "insecure-registries": [],
  "debug": false,
  "experimental": false,
  "ipv6": false,
  "ip": "0.0.0.0",
  "dns": ["8.8.8.8", "1.1.1.1"]
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

### Option 3: Use Docker Hub Mirror (Jika di China/restricted network)

Edit `/etc/docker/daemon.json`:
```json
{
  "registry-mirrors": [
    "https://mirror.gcr.io",
    "https://docker.mirrors.ustc.edu.cn"
  ],
  "ipv6": false
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

### Option 4: Download Image Manually

Download image terlebih dahulu:

```bash
# Force IPv4
docker pull --platform linux/amd64 python:3.11-slim

# Kemudian build
docker-compose build
```

### Option 5: Use Alternative Base Image

Jika masih gagal, gunakan Alpine (lebih kecil, lebih cepat):

**Edit Dockerfile:**
```dockerfile
FROM python:3.11-alpine

# Install build dependencies untuk Alpine
RUN apk add --no-cache gcc musl-dev linux-headers curl

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    FLASK_APP=app.py \
    MONITORING_PORT=5000

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY dashboard/ /app/backend/../dashboard/

RUN mkdir -p /app/backend/data

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

WORKDIR /app/backend

CMD ["python", "app.py"]
```

### Option 6: Check Network & Proxy

Jika di belakang proxy:

```bash
# Set proxy untuk Docker
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=localhost,127.0.0.1

# Build dengan proxy
docker-compose build --build-arg HTTP_PROXY=$HTTP_PROXY --build-arg HTTPS_PROXY=$HTTPS_PROXY
```

## 🔍 Diagnostic Steps

### 1. Check Docker Network
```bash
# Test Docker Hub connectivity
curl -I https://registry-1.docker.io/v2/

# Should return: HTTP/2 401 (authentication required, tapi connection OK)
```

### 2. Check IPv6
```bash
# Check if IPv6 is enabled
ip -6 addr show

# Test IPv6 connectivity
ping6 -c 3 google.com
```

### 3. Check Docker Daemon
```bash
# Check Docker daemon settings
docker info | grep -i ipv6

# View daemon config
cat /etc/docker/daemon.json
```

### 4. Check DNS Resolution
```bash
# Test Docker Hub resolution
nslookup registry-1.docker.io

# Test with Google DNS
nslookup registry-1.docker.io 8.8.8.8
```

## 🚀 Recommended Solution (Fastest)

**Saya sarankan Option 1 + Option 4:**

```bash
# 1. Edit daemon config
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "ipv6": false,
  "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"]
}
EOF

# 2. Restart Docker
sudo systemctl restart docker

# 3. Pull image manually
docker pull python:3.11-slim

# 4. Build project
cd /path/to/monitoring
docker-compose build

# 5. Start services
docker-compose up -d
```

## ✅ Verification

After fix, test:

```bash
# 1. Docker should pull images
docker pull hello-world

# 2. Check Docker info
docker info

# 3. Build your project
docker-compose build

# 4. Start services
docker-compose up -d

# 5. Check logs
docker-compose logs -f backend
```

## 🆘 If Still Failing

Try this emergency workaround:

```bash
# Use pre-built image or build locally
cd backend
pip install -r requirements.txt
python app.py

# Access at http://localhost:5000
```

Or use **alternative registry**:

```dockerfile
# Use GitHub Container Registry instead
FROM ghcr.io/python/python:3.11-slim

# Rest of Dockerfile same...
```

## 📝 Common Causes

1. **ISP blocking IPv6** ✅ Fixed by disabling IPv6
2. **Firewall blocking Docker Hub** ✅ Fixed by DNS change
3. **Corporate proxy** ✅ Fixed by proxy settings
4. **Network unreachable** ✅ Fixed by force IPv4
5. **Rate limiting** ✅ Fixed by mirror or auth

---

**Pick Option 1 (disable IPv6) for quickest fix!**

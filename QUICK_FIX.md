# Quick Fix: Docker Build Network Error

## Error
```
failed to resolve source metadata for docker.io/library/python:3.11-slim
dial tcp [2600:...]:443: connect: network is unreachable
```

## ⚡ Quick Fix (Pick One)

### Solution 1: Fix Docker IPv6 (Recommended)

```bash
# Create/edit Docker daemon config
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "ipv6": false,
  "dns": ["8.8.8.8", "8.8.4.4"]
}
EOF

# Restart Docker
sudo systemctl restart docker

# Pull image manually
docker pull python:3.11-slim

# Build project
docker-compose build
docker-compose up -d
```

### Solution 2: Use Alpine (Faster/Smaller)

```bash
# Use Alpine-based image
docker-compose -f docker-compose.alpine.yml build
docker-compose -f docker-compose.alpine.yml up -d
```

### Solution 3: Use Fix Script

```bash
# Make script executable
chmod +x fix-docker-build.sh

# Run fix script
sudo ./fix-docker-build.sh

# Build project
docker-compose build
docker-compose up -d
```

## 🔍 Verify Fix

```bash
# Test Docker Hub access
curl -I https://registry-1.docker.io/v2/
# Should return: HTTP/2 401

# Test image pull
docker pull hello-world

# Check Docker config
docker info | grep -i ipv6
# Should show: IPv6: false
```

## 📊 Build Options Comparison

| Method | Size | Build Time | Complexity |
|--------|------|------------|------------|
| Debian (python:3.11-slim) | ~180MB | Medium | Low |
| Alpine (python:3.11-alpine) | ~60MB | Fast | Low |
| Fix IPv6 + Debian | ~180MB | Medium | Medium |

## 🚀 Recommended: Use Alpine

**Fastest and smallest:**

```bash
docker-compose -f docker-compose.alpine.yml build
docker-compose -f docker-compose.alpine.yml up -d
```

## 📝 Files Created

- `DOCKER_BUILD_FIX.md` - Detailed troubleshooting guide
- `Dockerfile.alpine` - Alpine-based Dockerfile
- `docker-compose.alpine.yml` - Alpine compose file
- `fix-docker-build.sh` - Automated fix script

## ✅ After Fix

```bash
# Check container
docker ps

# View logs
docker logs monitoring-backend

# Test dashboard
curl http://localhost:5000/api/health

# Access dashboard
http://your-server:5000
```

---

**TL;DR: Run `docker-compose -f docker-compose.alpine.yml up -d` for fastest solution!**

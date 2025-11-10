# 🐧 Let's Encrypt SSL Setup - Linux Server

Complete guide untuk setup SSL dengan Let's Encrypt di Linux server.

---

## 🚀 Quick Setup (Recommended)

### Step 1: Edit Email
```bash
nano setup-letsencrypt-simple-linux.sh

# Ubah baris ini:
EMAIL="admin@indoinfinite.com"  # Ganti dengan email Anda
```

### Step 2: Make Executable & Run
```bash
chmod +x setup-letsencrypt-simple-linux.sh
./setup-letsencrypt-simple-linux.sh
```

### Step 3: Done!
Akses: `https://eyes.indoinfinite.com`

**Auto-renewal sudah enabled!** ✅

---

## 📋 Prerequisites

Sebelum setup, pastikan:

### 1. DNS Sudah Pointing
```bash
dig eyes.indoinfinite.com

# Output harus IP server Anda!
```

### 2. Port 80 & 443 Terbuka
```bash
# Check port
ss -tlnp | grep -E ':80|:443'

# Buka di firewall (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# Atau iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save
```

### 3. Docker & Docker Compose Installed
```bash
# Check
docker --version
docker-compose --version

# Install jika belum
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt install docker-compose -y
```

---

## 🔧 Troubleshooting

### Script Stuck atau Error?

**Run troubleshooting tool:**
```bash
chmod +x troubleshoot-ssl-linux.sh
./troubleshoot-ssl-linux.sh
```

Tool ini akan check:
- ✅ DNS resolution
- ✅ Port 80 & 443 status
- ✅ Docker containers
- ✅ SSL certificate
- ✅ HTTPS connectivity
- ✅ Firewall rules

---

### Common Issues

#### 1. Port 80 Already in Use

**Problem:**
```
✗ Port 80 is in use by nginx/apache
```

**Solution:**
```bash
# Stop Apache
sudo systemctl stop apache2
sudo systemctl disable apache2

# Stop Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Or force kill
sudo killall -9 nginx
sudo killall -9 apache2

# Verify port is free
ss -tlnp | grep ':80'
```

#### 2. DNS Not Configured

**Problem:**
```
✗ DNS not configured for eyes.indoinfinite.com
```

**Solution:**
Configure A record di DNS provider Anda:
```
Type: A
Name: eyes.indoinfinite.com
Value: YOUR_SERVER_IP
TTL: 300 (or default)
```

Wait 5-10 minutes, then verify:
```bash
dig eyes.indoinfinite.com
```

#### 3. Firewall Blocking Port 80

**Problem:**
```
Connection refused
```

**Solution:**
```bash
# Ubuntu/Debian (UFW)
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# Check from outside
curl -v http://eyes.indoinfinite.com
```

#### 4. Certificate Generation Failed

**Check logs:**
```bash
# View certbot logs
tail -f certbot-logs/letsencrypt.log

# Or docker logs
docker-compose -f docker-compose.ssl.yml logs certbot
```

**Common errors:**
- `Connection refused` → Port 80 not accessible
- `DNS problem` → Domain not pointing to server
- `Rate limited` → Too many attempts (wait 1 hour)

---

## 🔄 Managing SSL

### Check Certificate Status
```bash
docker-compose -f docker-compose.ssl.yml exec certbot certbot certificates
```

### Manual Renewal
```bash
# Test renewal (dry-run)
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --dry-run

# Force renewal
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --force-renewal

# Restart nginx
docker-compose -f docker-compose.ssl.yml restart nginx
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.ssl.yml logs -f

# Certbot only
docker-compose -f docker-compose.ssl.yml logs -f certbot

# Nginx only
docker-compose -f docker-compose.ssl.yml logs -f nginx
```

### Restart Services
```bash
# Restart all
docker-compose -f docker-compose.ssl.yml restart

# Restart nginx only
docker-compose -f docker-compose.ssl.yml restart nginx

# Stop all
docker-compose -f docker-compose.ssl.yml down

# Start all
docker-compose -f docker-compose.ssl.yml up -d
```

---

## 📊 Test SSL Security

### Online SSL Test
```
https://www.ssllabs.com/ssltest/analyze.html?d=eyes.indoinfinite.com
```

Expected grade: **A or A+** 🏆

### Command Line Test
```bash
# Test HTTPS
curl -v https://eyes.indoinfinite.com

# Check certificate details
openssl s_client -connect eyes.indoinfinite.com:443 -servername eyes.indoinfinite.com
```

---

## 🎯 Alternative Methods

### Method 1: Quick One-Liner (Advanced)
```bash
chmod +x quick-ssl-linux.sh
# Edit EMAIL in file first!
./quick-ssl-linux.sh
```

### Method 2: Manual Docker Command
```bash
# Stop all services
docker-compose down

# Get certificate
docker run --rm -p 80:80 \
  -v monitoring_letsencrypt-certs:/etc/letsencrypt \
  -v monitoring_letsencrypt-lib:/var/lib/letsencrypt \
  certbot/certbot certonly --standalone \
  --email your-email@domain.com \
  --agree-tos --no-eff-email \
  -d eyes.indoinfinite.com

# Configure nginx
cp nginx/nginx-letsencrypt.conf nginx/nginx.conf

# Start services
docker-compose -f docker-compose.ssl.yml up -d
```

---

## 🔐 Security Notes

### Certificate Files Location
```
Docker Volume: monitoring_letsencrypt-certs
Path inside container: /etc/letsencrypt/live/eyes.indoinfinite.com/
Files:
  - fullchain.pem (certificate)
  - privkey.pem (private key)
  - chain.pem (certificate chain)
```

### Backup Certificates
```bash
# Backup
docker run --rm \
  -v monitoring_letsencrypt-certs:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/letsencrypt-backup.tar.gz -C /source .

# Restore
docker run --rm \
  -v monitoring_letsencrypt-certs:/target \
  -v $(pwd):/backup \
  alpine tar xzf /backup/letsencrypt-backup.tar.gz -C /target
```

---

## 📝 Auto-Renewal Details

Certificate auto-renewal berjalan di container `certbot`:
- ✅ Checks every **12 hours**
- ✅ Renews **30 days** before expiry
- ✅ Certificate valid for **90 days**
- ✅ Email notification if renewal fails
- ✅ No manual intervention needed

Verify auto-renewal is working:
```bash
# Check certbot container status
docker ps | grep certbot

# View certbot logs
docker logs monitoring-certbot
```

---

## 🆘 Emergency Commands

### If HTTPS stops working:
```bash
# 1. Check containers
docker-compose -f docker-compose.ssl.yml ps

# 2. Restart nginx
docker-compose -f docker-compose.ssl.yml restart nginx

# 3. Check logs
docker-compose -f docker-compose.ssl.yml logs nginx --tail=50

# 4. Verify certificate
docker-compose -f docker-compose.ssl.yml exec certbot certbot certificates
```

### If certificate expired:
```bash
# Force renewal
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --force-renewal

# Restart nginx
docker-compose -f docker-compose.ssl.yml restart nginx
```

### Complete reset:
```bash
# Stop everything
docker-compose -f docker-compose.ssl.yml down

# Remove certificate
docker volume rm monitoring_letsencrypt-certs
docker volume rm monitoring_letsencrypt-lib

# Start fresh
./setup-letsencrypt-simple-linux.sh
```

---

## 📚 Files Reference

- `setup-letsencrypt-simple-linux.sh` - Main setup script (recommended)
- `troubleshoot-ssl-linux.sh` - Troubleshooting tool
- `quick-ssl-linux.sh` - One-liner quick deploy
- `docker-compose.ssl.yml` - Docker config with SSL
- `nginx/nginx-letsencrypt.conf` - Nginx SSL config
- `LETSENCRYPT-GUIDE.md` - Complete documentation
- `QUICK-REFERENCE.md` - Command cheat sheet

---

## ✅ Success Checklist

- [ ] DNS pointing to server (dig command)
- [ ] Port 80 & 443 open in firewall
- [ ] Docker & Docker Compose installed
- [ ] Email configured in script
- [ ] Script runs without errors
- [ ] HTTPS accessible: https://eyes.indoinfinite.com
- [ ] No browser warning
- [ ] Certificate auto-renewal enabled
- [ ] SSL Labs grade A or A+

---

## 🎉 You're Done!

Sistem monitoring Anda sekarang:
- 🔒 Secured dengan HTTPS
- 📜 Valid SSL dari Let's Encrypt
- 🔄 Auto-renewal (zero maintenance)
- 🛡️ Modern security (TLS 1.2/1.3)
- 🏆 Grade A or A+ security

**Access:** https://eyes.indoinfinite.com

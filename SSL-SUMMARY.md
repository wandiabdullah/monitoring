# 🔒 Let's Encrypt SSL - Setup Complete!

## ✅ Yang Sudah Dibuat:

### 1. Docker Compose dengan Let's Encrypt
- `docker-compose.ssl.yml` - Configuration dengan Nginx + Certbot
- Auto-renewal container yang berjalan 24/7
- Volume persistence untuk certificates

### 2. Nginx Configuration
- `nginx/nginx-letsencrypt.conf` - Production-ready config
- HTTP → HTTPS redirect
- Modern SSL/TLS security (TLS 1.2 + 1.3)
- Security headers (HSTS, X-Frame-Options, dll)
- OCSP stapling enabled

### 3. Setup Scripts
- `setup-letsencrypt.ps1` (Windows) - Automated setup
- `setup-letsencrypt.sh` (Linux/Mac) - Automated setup
- `check-ssl-status.ps1` - Status checker

### 4. Documentation
- `LETSENCRYPT-GUIDE.md` - Complete guide
- `QUICK-REFERENCE.md` - Command cheat sheet
- `README.md` - Updated dengan SSL info

---

## 🚀 Cara Deploy:

### Step 1: Edit Email
Buka `setup-letsencrypt.ps1` dan ubah:
```powershell
$EMAIL = "admin@indoinfinite.com"  # Ganti dengan email Anda
```

### Step 2: Run Setup
```powershell
.\setup-letsencrypt.ps1
```

### Step 3: Verify
```powershell
# Check status
.\check-ssl-status.ps1

# Test HTTPS
curl https://eyes.indoinfinite.com
```

**DONE!** ✅

---

## 🔄 Auto-Renewal

Certificate akan **otomatis di-renew** setiap 12 jam!

### Cara Kerja:
1. Certbot container berjalan 24/7
2. Check renewal setiap 12 jam
3. Certificate valid 90 hari
4. Auto-renew 30 hari sebelum expire
5. Email notification jika gagal

### Manual Check:
```powershell
# Lihat certificate info
docker-compose -f docker-compose.ssl.yml exec certbot certbot certificates

# Test renewal (dry-run)
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --dry-run

# Force renewal
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --force-renewal
```

---

## 📊 Monitoring

### Check Status:
```powershell
# Quick status check
.\check-ssl-status.ps1

# View logs
docker-compose -f docker-compose.ssl.yml logs -f certbot

# Container status
docker-compose -f docker-compose.ssl.yml ps
```

### SSL Security Test:
Visit: https://www.ssllabs.com/ssltest/analyze.html?d=eyes.indoinfinite.com

Expected: **Grade A or A+** 🏆

---

## 🛠️ Common Commands

```powershell
# Start services
docker-compose -f docker-compose.ssl.yml up -d

# Stop services
docker-compose -f docker-compose.ssl.yml down

# Restart nginx
docker-compose -f docker-compose.ssl.yml restart nginx

# View all logs
docker-compose -f docker-compose.ssl.yml logs -f

# View certbot logs only
docker-compose -f docker-compose.ssl.yml logs -f certbot
```

---

## 🔧 Prerequisites

### Before Running Setup:

1. **Domain DNS** harus sudah pointing ke server:
   ```powershell
   nslookup eyes.indoinfinite.com
   ```
   Output harus IP address server Anda!

2. **Port 80 dan 443** harus terbuka:
   ```powershell
   # Test dari luar
   Test-NetConnection -ComputerName eyes.indoinfinite.com -Port 80
   Test-NetConnection -ComputerName eyes.indoinfinite.com -Port 443
   ```

3. **Docker** sudah running:
   ```powershell
   docker --version
   docker-compose --version
   ```

---

## ❗ Important Notes

### Rate Limits
Let's Encrypt punya rate limit:
- **5 certificates per week** per domain
- Gunakan staging mode untuk testing:
  ```powershell
  # Edit script, set:
  $STAGING = $true
  ```

### Email Notifications
Let's Encrypt akan kirim email ke address yang didaftarkan jika:
- Certificate akan expire dalam 20 hari
- Renewal gagal

Pastikan email valid dan bisa diakses!

### Backup Certificates
```powershell
# Backup (optional tapi recommended)
docker run --rm -v monitoring_letsencrypt-certs:/source -v ${PWD}:/backup alpine tar czf /backup/letsencrypt-backup.tar.gz -C /source .
```

---

## 🎯 Expected Result

Setelah setup berhasil:

- ✅ **URL:** https://eyes.indoinfinite.com (HTTPS, no port needed)
- ✅ **HTTP redirect:** http://eyes.indoinfinite.com → auto redirect ke HTTPS
- ✅ **No browser warning:** Valid certificate dari Let's Encrypt
- ✅ **SSL Grade:** A or A+ (ssllabs.com test)
- ✅ **Auto-renewal:** Enabled, checks every 12 hours
- ✅ **Security headers:** HSTS, X-Frame-Options, dll
- ✅ **Modern encryption:** TLS 1.2 + 1.3 only

---

## 📞 Troubleshooting

Jika ada masalah, lihat:
- [LETSENCRYPT-GUIDE.md](LETSENCRYPT-GUIDE.md) - Section Troubleshooting
- [QUICK-REFERENCE.md](QUICK-REFERENCE.md) - Emergency commands

Atau check logs:
```powershell
docker-compose -f docker-compose.ssl.yml logs certbot
docker-compose -f docker-compose.ssl.yml logs nginx
```

---

## 🎉 Success!

Sistem monitoring Anda sekarang:
- 🔒 Secured dengan HTTPS
- 📜 Valid SSL certificate (trusted)
- 🔄 Auto-renewal (zero maintenance)
- 🛡️ Security best practices
- 📧 Email notifications

**No more browser warnings!** ✨

Access: **https://eyes.indoinfinite.com**

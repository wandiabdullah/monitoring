# Let's Encrypt SSL dengan Auto-Renewal

Sistem monitoring ini sudah dikonfigurasi dengan **Let's Encrypt** untuk SSL certificate yang valid dan **auto-renewal** otomatis.

## 🚀 Quick Start

### Prerequisites
1. Domain sudah pointing ke server (DNS A record)
2. Port 80 dan 443 terbuka dan accessible dari internet
3. Docker dan Docker Compose terinstall

### Setup SSL dengan Let's Encrypt

**PENTING:** Edit email Anda terlebih dahulu di script:

```powershell
# Buka file setup-letsencrypt.ps1
# Ubah baris ini:
$EMAIL = "admin@indoinfinite.com"  # Ganti dengan email Anda
```

Kemudian jalankan:

```powershell
# Windows PowerShell
.\setup-letsencrypt.ps1
```

Atau untuk Linux/Mac:
```bash
# Linux/Mac
chmod +x setup-letsencrypt.sh
./setup-letsencrypt.sh
```

Script akan otomatis:
1. ✅ Setup Nginx dengan konfigurasi sementara
2. ✅ Mendapatkan SSL certificate dari Let's Encrypt
3. ✅ Mengkonfigurasi Nginx dengan HTTPS
4. ✅ Setup auto-renewal (setiap 12 jam)
5. ✅ Restart semua services

---

## 📋 Manual Setup (Jika Script Gagal)

### 1. Edit Email di Script
```powershell
# setup-letsencrypt.ps1 atau setup-letsencrypt.sh
$EMAIL = "your-email@domain.com"
```

### 2. Verify DNS
```powershell
nslookup eyes.indoinfinite.com
```
Pastikan IP address sudah benar!

### 3. Check Port 80
```powershell
# Test dari luar server
curl http://eyes.indoinfinite.com
```

### 4. Run Setup
```powershell
.\setup-letsencrypt.ps1
```

### 5. Verify HTTPS
```powershell
curl https://eyes.indoinfinite.com
```

---

## 🔄 Auto-Renewal

Certificate akan **otomatis di-renew** setiap 12 jam oleh container `certbot`.

### Cara Kerja Auto-Renewal:
- Certbot container running 24/7
- Cek renewal setiap 12 jam
- Let's Encrypt certificate valid 90 hari
- Auto-renew 30 hari sebelum expire
- Nginx otomatis reload setelah renewal

### Manual Renewal (Jika Diperlukan):
```powershell
# Force renewal sekarang
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --force-renewal

# Restart nginx untuk load certificate baru
docker-compose -f docker-compose.ssl.yml restart nginx
```

### Check Certificate Status:
```powershell
# Lihat info certificate
docker-compose -f docker-compose.ssl.yml exec certbot certbot certificates

# Output akan menampilkan:
# - Certificate Name
# - Domains
# - Expiry Date
# - Certificate Path
```

---

## 📁 File Structure

```
monitoring/
├── docker-compose.ssl.yml          # Docker compose dengan Let's Encrypt
├── setup-letsencrypt.ps1           # Setup script (Windows)
├── setup-letsencrypt.sh            # Setup script (Linux/Mac)
├── nginx/
│   ├── nginx-letsencrypt.conf      # Nginx config untuk Let's Encrypt
│   └── nginx.conf                  # Active config (auto-copied)
├── certbot-logs/                   # Certbot logs
└── Docker volumes:
    ├── letsencrypt-certs/          # Certificate files
    ├── letsencrypt-lib/            # Certbot library
    └── certbot-webroot/            # ACME challenge files
```

---

## 🔧 Troubleshooting

### Certificate Gagal Digenerate

**Error:** `Failed to obtain certificate`

**Solusi:**
1. Pastikan DNS sudah pointing:
   ```powershell
   nslookup eyes.indoinfinite.com
   ```

2. Pastikan port 80 accessible:
   ```powershell
   Test-NetConnection -ComputerName eyes.indoinfinite.com -Port 80
   ```

3. Check firewall:
   ```powershell
   # Windows Firewall
   netsh advfirewall firewall show rule name=all | findstr 80
   
   # Linux iptables
   sudo iptables -L -n | grep 80
   ```

4. Test dengan staging server dulu:
   ```powershell
   # Edit script, set:
   $STAGING = $true
   # Lalu run lagi
   ```

### Rate Limit Error

Let's Encrypt punya rate limit: **5 certificates per week per domain**

**Solusi:**
1. Gunakan staging server untuk testing
2. Tunggu 1 minggu untuk reset limit
3. Lihat limits: https://letsencrypt.org/docs/rate-limits/

### Certificate Tidak Auto-Renew

**Check certbot container:**
```powershell
docker-compose -f docker-compose.ssl.yml logs certbot
```

**Restart certbot:**
```powershell
docker-compose -f docker-compose.ssl.yml restart certbot
```

**Manual renew test:**
```powershell
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --dry-run
```

### Nginx Error After Renewal

**Reload nginx config:**
```powershell
docker-compose -f docker-compose.ssl.yml exec nginx nginx -s reload
```

**Check nginx logs:**
```powershell
docker-compose -f docker-compose.ssl.yml logs nginx
```

---

## 🛡️ Security Features

### SSL/TLS Configuration
- ✅ TLS 1.2 and 1.3 only
- ✅ Modern cipher suites
- ✅ OCSP stapling enabled
- ✅ Perfect Forward Secrecy (PFS)

### Security Headers
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ X-Frame-Options: SAMEORIGIN
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection
- ✅ Referrer-Policy

### Test SSL Security
```powershell
# Online SSL test
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=eyes.indoinfinite.com
```

---

## 📊 Monitoring Certificate Expiry

### Check Expiry Date
```powershell
docker-compose -f docker-compose.ssl.yml exec certbot certbot certificates
```

### View Renewal Logs
```powershell
# Real-time logs
docker-compose -f docker-compose.ssl.yml logs -f certbot

# Last 100 lines
docker-compose -f docker-compose.ssl.yml logs --tail=100 certbot
```

### Setup Email Notifications (Optional)

Certbot akan otomatis kirim email ke address yang Anda daftarkan jika:
- Certificate akan expire dalam 20 hari
- Renewal gagal

---

## 🔄 Update/Maintenance

### Update Docker Images
```powershell
# Pull latest images
docker-compose -f docker-compose.ssl.yml pull

# Recreate containers
docker-compose -f docker-compose.ssl.yml up -d --force-recreate
```

### Backup Certificates
```powershell
# Backup volume
docker run --rm -v monitoring_letsencrypt-certs:/source -v ${PWD}:/backup alpine tar czf /backup/letsencrypt-backup.tar.gz -C /source .

# Restore (jika diperlukan)
docker run --rm -v monitoring_letsencrypt-certs:/target -v ${PWD}:/backup alpine tar xzf /backup/letsencrypt-backup.tar.gz -C /target
```

### Revoke Certificate (Jika Private Key Compromised)
```powershell
docker-compose -f docker-compose.ssl.yml exec certbot certbot revoke --cert-path /etc/letsencrypt/live/eyes.indoinfinite.com/cert.pem
```

---

## 📞 Support

### Let's Encrypt Documentation
- https://letsencrypt.org/docs/
- https://certbot.eff.org/docs/

### Rate Limits
- https://letsencrypt.org/docs/rate-limits/

### Status Page
- https://letsencrypt.status.io/

---

## ✅ Post-Setup Checklist

- [ ] SSL certificate generated successfully
- [ ] HTTPS accessible: https://eyes.indoinfinite.com
- [ ] HTTP redirects to HTTPS
- [ ] No browser security warnings
- [ ] Certificate expiry > 60 days
- [ ] Auto-renewal container running
- [ ] Email notifications configured
- [ ] Firewall allows ports 80 and 443
- [ ] DNS pointing correctly
- [ ] SSL Labs test grade A or A+

---

## 🎯 Summary

**Anda sekarang memiliki:**
- ✅ Valid SSL certificate dari Let's Encrypt (trusted)
- ✅ Auto-renewal setiap 12 jam
- ✅ HTTPS dengan security terbaik
- ✅ HTTP → HTTPS auto redirect
- ✅ Zero maintenance required

**Akses sistem:**
- 🌐 https://eyes.indoinfinite.com (HTTPS, port 443)
- 🔒 Certificate valid 90 hari, auto-renew 30 hari sebelum expire
- 📧 Email notification jika renewal gagal

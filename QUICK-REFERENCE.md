# 🚀 Let's Encrypt Quick Reference

## Initial Setup (One-Time)

```powershell
# 1. Edit email di setup-letsencrypt.ps1
$EMAIL = "your-email@domain.com"

# 2. Run setup
.\setup-letsencrypt.ps1

# 3. Verify
curl https://eyes.indoinfinite.com
```

**Done! Certificate auto-renews setiap 12 jam** ✅

---

## Common Commands

```powershell
# Start all services
docker-compose -f docker-compose.ssl.yml up -d

# Stop all services
docker-compose -f docker-compose.ssl.yml down

# View logs
docker-compose -f docker-compose.ssl.yml logs -f

# Check certificate info
docker-compose -f docker-compose.ssl.yml exec certbot certbot certificates

# Manual renewal
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew

# Restart nginx
docker-compose -f docker-compose.ssl.yml restart nginx

# View running containers
docker-compose -f docker-compose.ssl.yml ps
```

---

## Files

- `docker-compose.ssl.yml` - Main compose file
- `setup-letsencrypt.ps1` - Setup script
- `nginx/nginx-letsencrypt.conf` - Nginx config
- `LETSENCRYPT-GUIDE.md` - Full documentation

---

## URLs

- **Production:** https://eyes.indoinfinite.com
- **HTTP (redirects):** http://eyes.indoinfinite.com
- **SSL Test:** https://www.ssllabs.com/ssltest/

---

## Auto-Renewal

✅ **Automatic** - No action needed
- Checks every 12 hours
- Renews 30 days before expiry
- Email notification if fails

---

## Emergency

```powershell
# If HTTPS not working
docker-compose -f docker-compose.ssl.yml restart nginx

# If renewal fails
docker-compose -f docker-compose.ssl.yml exec certbot certbot renew --force-renewal
docker-compose -f docker-compose.ssl.yml restart nginx

# Check what's wrong
docker-compose -f docker-compose.ssl.yml logs certbot
docker-compose -f docker-compose.ssl.yml logs nginx
```

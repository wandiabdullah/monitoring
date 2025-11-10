# SSL/HTTPS Setup for Monitoring System

## Quick Start (Self-Signed Certificate)

### For Development/Testing:

1. **Generate self-signed certificate:**

   **Windows (PowerShell):**
   ```powershell
   .\generate-ssl.ps1
   ```

   **Linux/Mac:**
   ```bash
   chmod +x generate-ssl.sh
   ./generate-ssl.sh
   ```

2. **Start Docker with HTTPS:**
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

3. **Access your monitoring system:**
   - **HTTPS:** https://eyes.indoinfinite.com
   - **HTTP:** Will automatically redirect to HTTPS

4. **Browser Warning:**
   - Your browser will show a security warning because it's a self-signed certificate
   - Click "Advanced" → "Proceed to site" to continue

---

## Production Setup (Let's Encrypt - FREE)

### For Production with Valid SSL Certificate:

1. **Install Certbot:**
   ```bash
   # On Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install certbot

   # On CentOS/RHEL
   sudo yum install certbot
   ```

2. **Get SSL Certificate from Let's Encrypt:**
   ```bash
   sudo certbot certonly --standalone -d eyes.indoinfinite.com
   ```

3. **Copy certificates to nginx/ssl folder:**
   ```bash
   sudo cp /etc/letsencrypt/live/eyes.indoinfinite.com/fullchain.pem ./nginx/ssl/
   sudo cp /etc/letsencrypt/live/eyes.indoinfinite.com/privkey.pem ./nginx/ssl/
   sudo chmod 644 ./nginx/ssl/fullchain.pem
   sudo chmod 600 ./nginx/ssl/privkey.pem
   ```

4. **Setup auto-renewal:**
   ```bash
   # Add to crontab
   sudo crontab -e
   
   # Add this line to renew certificate every month
   0 0 1 * * certbot renew --quiet && docker-compose restart nginx
   ```

5. **Restart Docker:**
   ```bash
   docker-compose restart nginx
   ```

---

## SSL Files Location

```
monitoring/
├── nginx/
│   ├── ssl/
│   │   ├── fullchain.pem    # SSL Certificate
│   │   └── privkey.pem       # Private Key
│   └── nginx.conf            # Nginx configuration
├── generate-ssl.ps1          # Windows SSL generator
└── generate-ssl.sh           # Linux/Mac SSL generator
```

---

## Troubleshooting

### Certificate Not Found Error
```bash
# Check if certificates exist
ls -la ./nginx/ssl/

# Should see:
# fullchain.pem
# privkey.pem
```

### Permission Denied
```bash
# Fix permissions
chmod 644 ./nginx/ssl/fullchain.pem
chmod 600 ./nginx/ssl/privkey.pem
```

### Port Already in Use
```bash
# Check what's using port 443
sudo netstat -tulpn | grep :443

# Stop the service or change port in docker-compose.yml
```

### Browser Shows "Not Secure"
- **Self-signed certificate:** This is normal. Click "Advanced" → "Proceed"
- **Let's Encrypt:** Make sure certificate is valid and not expired

### Check Nginx Logs
```bash
# View nginx logs
docker logs monitoring-nginx

# Follow logs in real-time
docker logs -f monitoring-nginx
```

---

## Security Best Practices

1. **Use Let's Encrypt for production** - Free and trusted by all browsers
2. **Keep certificates secure** - Never commit private keys to git
3. **Enable HTTP → HTTPS redirect** - Already configured in nginx.conf
4. **Use strong SSL protocols** - TLS 1.2 and 1.3 only (already configured)
5. **Regular certificate renewal** - Let's Encrypt certificates expire every 90 days

---

## Accessing Your Monitoring System

After SSL is configured:

- **URL:** https://eyes.indoinfinite.com
- **Port 80:** Automatically redirects to HTTPS (port 443)
- **Port 443:** HTTPS with SSL encryption

**No need to specify port in URL!**

Before: `http://eyes.indoinfinite.com:5000`
After: `https://eyes.indoinfinite.com` ✓

---

## Notes

- Self-signed certificates are fine for internal use or testing
- For public-facing production, always use Let's Encrypt or trusted CA
- Nginx handles SSL termination, Flask runs on port 5000 internally
- All HTTP traffic is automatically redirected to HTTPS

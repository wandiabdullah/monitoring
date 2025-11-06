# Nginx Configuration for Monitoring System

This directory contains Nginx configuration files for production deployment.

## Files

- `nginx.conf` - Main Nginx configuration

## SSL Certificates

Place your SSL certificates in the `ssl/` directory:

```
nginx/
├── ssl/
│   ├── fullchain.pem
│   └── privkey.pem
└── nginx.conf
```

## Generate Self-Signed Certificate (Development)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Let's Encrypt (Production)

```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d monitoring.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/monitoring.yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/monitoring.yourdomain.com/privkey.pem nginx/ssl/
```

## Enable HTTPS

Uncomment the HTTPS server block in `nginx.conf` and restart:

```bash
docker-compose -f docker-compose.production.yml restart nginx
```

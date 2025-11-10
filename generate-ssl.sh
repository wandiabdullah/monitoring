#!/bin/bash

# Generate Self-Signed SSL Certificate for eyes.indoinfinite.com
# This is for development/testing. For production, use Let's Encrypt or a trusted CA.

DOMAIN="eyes.indoinfinite.com"
DAYS=365
SSL_DIR="./nginx/ssl"

echo "Generating self-signed SSL certificate for $DOMAIN..."

# Create SSL directory if not exists
mkdir -p "$SSL_DIR"

# Generate private key and certificate
openssl req -x509 -nodes -days $DAYS -newkey rsa:2048 \
    -keyout "$SSL_DIR/privkey.pem" \
    -out "$SSL_DIR/fullchain.pem" \
    -subj "/C=ID/ST=Jakarta/L=Jakarta/O=IndoInfinite/OU=Monitoring/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:www.$DOMAIN"

# Set proper permissions
chmod 600 "$SSL_DIR/privkey.pem"
chmod 644 "$SSL_DIR/fullchain.pem"

echo "✓ SSL certificate generated successfully!"
echo "  Certificate: $SSL_DIR/fullchain.pem"
echo "  Private Key: $SSL_DIR/privkey.pem"
echo ""
echo "⚠️  NOTE: This is a self-signed certificate. Browsers will show a security warning."
echo "    For production, use Let's Encrypt: https://letsencrypt.org/"

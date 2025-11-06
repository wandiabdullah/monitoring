# Authentication & Host Management Guide

## Overview

Dashboard monitoring sekarang dilengkapi dengan:
- **User Authentication**: Login system untuk mengakses dashboard
- **Host Management**: Kelola host yang akan dimonitor dari dashboard
- **API Key Authentication**: Setiap host memiliki API key unik untuk keamanan

## Default Admin User

Saat pertama kali menjalankan backend, user admin akan otomatis dibuat:

```
Username: admin
Password: admin123
```

**⚠️ PENTING**: Segera ganti password default ini setelah login pertama kali!

## Fitur Authentication

### 1. Login Page

- Akses dashboard akan otomatis redirect ke `/login` jika belum login
- Login menggunakan username dan password
- Session-based authentication dengan cookies
- Auto-logout setelah session expired

### 2. User Roles

**Admin User:**
- Dapat mengelola hosts (tambah, edit, hapus)
- Dapat regenerate API keys
- Akses penuh ke semua fitur dashboard

**Regular User** (untuk pengembangan selanjutnya):
- Hanya dapat melihat dashboard
- Tidak bisa mengelola hosts

## Host Management

### 1. Menambah Host Baru

**Via Dashboard (Admin Only):**
1. Login sebagai admin
2. Buka halaman "Hosts Management"
3. Klik "Add New Host"
4. Isi form:
   - **Hostname**: Nama host yang akan dimonitor (harus unik)
   - **IP Address**: IP address host (opsional)
   - **Description**: Deskripsi host (opsional)
5. Klik "Add Host"
6. **Simpan API Key** yang ditampilkan - key ini hanya ditampilkan sekali!

**Via API:**

```bash
curl -X POST http://localhost:5000/api/hosts \
  -H "Content-Type: application/json" \
  -b "session_cookie" \
  -d '{
    "hostname": "web-server-01",
    "ip_address": "192.168.1.100",
    "description": "Production Web Server"
  }'
```

Response:
```json
{
  "id": 1,
  "hostname": "web-server-01",
  "api_key": "xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG9eQ8wE3rT2y",
  "description": "Production Web Server",
  "ip_address": "192.168.1.100",
  "is_active": true
}
```

### 2. Melihat Daftar Host

**Via API:**
```bash
curl http://localhost:5000/api/hosts \
  -b "session_cookie"
```

Response:
```json
[
  {
    "id": 1,
    "hostname": "web-server-01",
    "api_key": "xR9kL3mP...",
    "description": "Production Web Server",
    "ip_address": "192.168.1.100",
    "is_active": true,
    "created_at": "2024-01-15 10:30:00",
    "last_seen": "2024-01-15 11:45:23"
  }
]
```

### 3. Update Host

**Via API:**
```bash
curl -X PUT http://localhost:5000/api/hosts/1 \
  -H "Content-Type: application/json" \
  -b "session_cookie" \
  -d '{
    "description": "Updated description",
    "ip_address": "192.168.1.101",
    "is_active": false
  }'
```

### 4. Hapus Host

**Via API:**
```bash
curl -X DELETE http://localhost:5000/api/hosts/1 \
  -b "session_cookie"
```

### 5. Regenerate API Key

Jika API key compromised atau hilang:

```bash
curl -X POST http://localhost:5000/api/hosts/1/regenerate-key \
  -b "session_cookie"
```

Response:
```json
{
  "api_key": "nEwK3yG3n3r4t3dT0k3nH3r3X1Y2Z3A4B5C6D7E8F9G"
}
```

**⚠️ PENTING**: API key lama akan langsung tidak valid!

## Setup Agent dengan API Key

### 1. Install Agent di Linux Server

```bash
# Copy agent file ke server
scp agent/monitor_agent.py user@server:/opt/monitoring/

# Install dependencies
pip3 install psutil requests

# Atau via requirements
pip3 install -r agent/requirements.txt
```

### 2. Jalankan Agent dengan API Key

**Cara Baru (dengan API Key):**

```bash
python3 /opt/monitoring/monitor_agent.py \
  --server http://monitoring-server:5000 \
  --api-key "xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG9eQ8wE3rT2y" \
  --interval 5
```

Parameter:
- `--server` / `-s`: URL monitoring server
- `--api-key` / `-k`: **REQUIRED** - API key dari host (didapat saat add host)
- `--hostname` / `-n`: Hostname (opsional, auto-detect jika tidak diisi)
- `--interval` / `-i`: Interval pengiriman metrics dalam detik (default: 5)

### 3. Setup Systemd Service

Buat file `/etc/systemd/system/monitoring-agent.service`:

```ini
[Unit]
Description=Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=monitoring
Environment="API_KEY=xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG9eQ8wE3rT2y"
ExecStart=/usr/bin/python3 /opt/monitoring/monitor_agent.py \
  --server http://monitoring-server:5000 \
  --api-key ${API_KEY} \
  --interval 5
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable dan start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
sudo systemctl status monitoring-agent
```

### 4. Setup dengan Docker

Buat file `docker-compose.yml` di server yang akan dimonitor:

```yaml
version: '3.8'

services:
  monitoring-agent:
    build: ./agent
    environment:
      - MONITORING_SERVER=http://monitoring-server:5000
      - API_KEY=xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG9eQ8wE3rT2y
      - HOSTNAME=web-server-01
      - INTERVAL=5
    restart: unless-stopped
    network_mode: host
```

## API Endpoints

### Authentication Endpoints

#### POST /api/login
Login ke dashboard.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "is_admin": true
  }
}
```

#### POST /api/logout
Logout dari dashboard.

**Response:**
```json
{
  "success": true
}
```

#### GET /api/current-user
Get current logged in user info.

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@monitoring.local",
  "is_admin": true
}
```

### Host Management Endpoints

#### GET /api/hosts
Get semua hosts (requires login).

#### POST /api/hosts
Add host baru (requires admin).

#### PUT /api/hosts/:id
Update host (requires admin).

#### DELETE /api/hosts/:id
Hapus host (requires admin).

#### POST /api/hosts/:id/regenerate-key
Regenerate API key untuk host (requires admin).

### Metrics Endpoint

#### POST /api/metrics
Send metrics dari agent (requires API key).

**Headers:**
```
Content-Type: application/json
X-API-Key: your-api-key-here
```

**Request:**
```json
{
  "timestamp": "2024-01-15T10:30:00",
  "cpu": { ... },
  "memory": { ... },
  "disk": { ... },
  "io": { ... }
}
```

**Note**: Hostname akan otomatis di-override dengan hostname dari API key.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Hosts Table
```sql
CREATE TABLE hosts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hostname TEXT UNIQUE NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    description TEXT,
    ip_address TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP
);
```

## Security Best Practices

1. **Ganti Default Password**
   ```bash
   # Via API atau database
   UPDATE users SET password_hash = 'new_hash' WHERE username = 'admin';
   ```

2. **Gunakan HTTPS**
   - Setup SSL certificate di Nginx
   - Redirect HTTP ke HTTPS

3. **Rotate API Keys Secara Berkala**
   - Regenerate API keys setiap 3-6 bulan
   - Atau jika ada indikasi compromise

4. **Restrict Admin Access**
   - Gunakan firewall untuk restrict akses ke dashboard
   - Hanya allow dari IP tertentu

5. **Backup Database**
   ```bash
   # Backup SQLite database
   cp data/monitoring.db data/monitoring.db.backup
   ```

6. **Monitor Failed Login Attempts**
   - Implement rate limiting (future enhancement)
   - Log failed login attempts

## Troubleshooting

### Agent tidak bisa connect

**Error: "API key required"**
- Pastikan menggunakan parameter `--api-key`
- Cek API key masih valid di database

**Error: "Invalid API key"**
- API key salah atau sudah di-regenerate
- Cek host masih active (`is_active = 1`)

### Tidak bisa login

**Error: "Invalid credentials"**
- Username atau password salah
- Cek di database: `SELECT * FROM users;`

**Session expired**
- Login ulang
- Cek `app.secret_key` tidak berubah

### Host tidak muncul di dashboard

1. Cek host ada di database:
   ```sql
   SELECT * FROM hosts WHERE hostname = 'your-host';
   ```

2. Cek agent running:
   ```bash
   systemctl status monitoring-agent
   ```

3. Cek logs agent:
   ```bash
   journalctl -u monitoring-agent -f
   ```

4. Cek metrics masuk:
   ```bash
   curl http://localhost:5000/api/servers
   ```

## Migration dari Setup Lama

Jika sebelumnya menggunakan setup tanpa authentication:

1. **Backup data lama**
   ```bash
   cp -r data data.backup
   ```

2. **Update backend**
   - Backend akan otomatis create database saat start

3. **Add existing hosts**
   - Login sebagai admin
   - Add semua host yang ada
   - Catat API keys

4. **Update agent di semua server**
   - Update command dengan `--api-key`
   - Restart service

5. **Verify**
   - Cek semua host muncul di dashboard
   - Cek metrics masuk

## Next Steps

Untuk pengembangan selanjutnya:

1. **User Management UI**
   - Halaman untuk manage users
   - Add/edit/delete users dari dashboard

2. **Password Change**
   - Form ganti password
   - Force password change untuk user baru

3. **User Permissions**
   - Role-based access control
   - Custom permissions per user

4. **Audit Log**
   - Log semua actions
   - Who did what and when

5. **API Rate Limiting**
   - Prevent brute force
   - Limit API calls per IP

6. **2FA (Two-Factor Authentication)**
   - TOTP support
   - Backup codes

# 📋 Panduan Instalasi Step-by-Step

Panduan lengkap instalasi sistem monitoring dari awal sampai berjalan.

## 🎯 Scenario 1: Development / Testing (1 PC)

Test sistem di satu komputer (Windows/Linux) sebelum deploy ke production.

### Step 1: Setup Backend

**Windows:**
```powershell
# Navigate ke folder monitoring
cd C:\Users\wandi\monitoring

# Install dependencies
pip install -r backend/requirements.txt

# Start backend
cd backend
python app.py
```

**Linux/Mac:**
```bash
cd ~/monitoring

# Install dependencies
pip3 install -r backend/requirements.txt

# Start backend
cd backend
python3 app.py
```

✅ Backend running di: http://localhost:5000

### Step 2: Test dengan Fake Data

Buka terminal baru:

```bash
# Install requests jika belum
pip install requests

# Run test agent
python test_agent.py --server http://localhost:5000 --hostname my-test-server

# Atau dengan custom interval
python test_agent.py --server http://localhost:5000 --hostname server-01 --interval 3
```

### Step 3: Akses Dashboard

1. Buka browser
2. Go to: http://localhost:5000
3. Tunggu beberapa detik untuk data muncul
4. Click pada server card untuk lihat detail

✅ **Done!** Dashboard sudah berjalan dengan fake data.

---

## 🎯 Scenario 2: Production (Multiple Linux Servers)

Deploy ke production dengan backend di satu server dan agent di multiple Linux servers.

### Architecture:
```
Backend Server (192.168.1.100)  ← Monitoring Server
    ↑           ↑           ↑
    |           |           |
Linux Server 1  Server 2    Server 3
(Web Server)    (DB Server) (App Server)
```

### Step 1: Setup Backend Server

Backend bisa di Windows atau Linux server.

**Jika Linux:**

```bash
# Install Python dan dependencies
sudo apt update
sudo apt install python3 python3-pip -y

# Clone/copy project files ke server
cd /opt
sudo mkdir monitoring
sudo chown $USER:$USER monitoring
cd monitoring

# Copy files (gunakan scp, git, atau cara lain)
# Struktur minimal yang dibutuhkan:
# /opt/monitoring/
#   ├── backend/
#   │   ├── app.py
#   │   └── requirements.txt
#   └── dashboard/
#       ├── index.html
#       └── app.js

# Install dependencies
cd /opt/monitoring
pip3 install -r backend/requirements.txt

# Create systemd service
sudo nano /etc/systemd/system/monitoring-backend.service
```

Paste ini:
```ini
[Unit]
Description=Server Monitoring Backend
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/opt/monitoring/backend
ExecStart=/usr/bin/python3 app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Ganti `YOUR_USERNAME` dengan username Anda, lalu:

```bash
# Enable dan start service
sudo systemctl daemon-reload
sudo systemctl enable monitoring-backend
sudo systemctl start monitoring-backend

# Check status
sudo systemctl status monitoring-backend

# View logs
sudo journalctl -u monitoring-backend -f
```

**Jika Windows:**

```powershell
cd C:\monitoring\backend
pip install -r requirements.txt
python app.py
# Atau double-click: start_backend.bat
```

### Step 2: Configure Firewall

**Linux (Ubuntu/Debian):**
```bash
sudo ufw allow 5000/tcp
sudo ufw reload
sudo ufw status
```

**Windows:**
```powershell
netsh advfirewall firewall add rule name="Monitoring Server" dir=in action=allow protocol=TCP localport=5000
```

### Step 3: Test Backend

Dari komputer lain di network:
```bash
curl http://192.168.1.100:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T10:00:00",
  "servers_count": 0
}
```

### Step 4: Install Agent di Linux Server 1

SSH ke Linux Server 1:

```bash
# Copy agent files ke server
scp -r agent/ user@192.168.1.101:/tmp/

# SSH ke server
ssh user@192.168.1.101

# Install
cd /tmp/agent
sudo chmod +x install.sh
sudo ./install.sh

# Edit service file
sudo nano /etc/systemd/system/monitoring-agent.service
```

Ubah baris:
```
ExecStart=/usr/bin/python3 /opt/monitoring-agent/monitor_agent.py --server http://YOUR_MONITORING_SERVER:5000
```

Menjadi:
```
ExecStart=/usr/bin/python3 /opt/monitoring-agent/monitor_agent.py --server http://192.168.1.100:5000 --hostname web-server-01
```

Save dan start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
sudo systemctl status monitoring-agent

# View logs
sudo journalctl -u monitoring-agent -f
```

Anda harus melihat output seperti:
```
Starting monitoring agent for web-server-01
Sending metrics to: http://192.168.1.100:5000
Collection interval: 5 seconds

[2025-11-06 10:00:00] Collected metrics:
  CPU: 25.3%
  Memory: 45.2%
  Network: ↑15.2 KB/s ↓125.3 KB/s
  ✓ Metrics sent successfully
```

### Step 5: Repeat untuk Server Lain

Untuk setiap Linux server:

```bash
# Manual install (alternatif dari install.sh)
ssh user@192.168.1.102

# Install dependencies
sudo apt update
sudo apt install python3 python3-pip -y
sudo pip3 install psutil requests

# Copy agent file
sudo mkdir -p /opt/monitoring-agent
# Copy monitor_agent.py ke /opt/monitoring-agent/

# Run agent
sudo python3 /opt/monitoring-agent/monitor_agent.py \
  --server http://192.168.1.100:5000 \
  --hostname db-server-01 \
  --interval 5
```

Atau setup sebagai systemd service seperti Step 4.

### Step 6: Access Dashboard

1. Buka browser
2. Go to: http://192.168.1.100:5000
3. Anda akan melihat semua server yang sudah mengirim data
4. Click server untuk lihat detail monitoring

---

## 🎯 Scenario 3: Production dengan Nginx (Recommended)

Setup dengan nginx reverse proxy untuk security dan scalability.

### Step 1: Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### Step 2: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/monitoring
```

Paste:
```nginx
server {
    listen 80;
    server_name monitoring.yourdomain.com;  # Atau gunakan IP

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/monitoring /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 3: Update Backend

Edit backend/app.py, ubah:
```python
app.run(host='127.0.0.1', port=5000, debug=False)  # Hanya listen di localhost
```

### Step 4: (Optional) Setup SSL dengan Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d monitoring.yourdomain.com
```

Now access via: https://monitoring.yourdomain.com

---

## 🎯 Scenario 4: Docker Deployment (Advanced)

Untuk yang prefer Docker.

### Step 1: Create Dockerfile untuk Backend

```dockerfile
# Dockerfile (simpan di folder monitoring/)
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY dashboard/ ./dashboard/

WORKDIR /app/backend

EXPOSE 5000

CMD ["python", "app.py"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  monitoring-backend:
    build: .
    ports:
      - "5000:5000"
    restart: always
    volumes:
      - ./backend/data:/app/backend/data
```

### Step 3: Run

```bash
docker-compose up -d
```

Dashboard available at: http://localhost:5000

---

## ✅ Verification Checklist

Setelah instalasi, pastikan:

- [ ] Backend accessible via browser
- [ ] `/api/health` endpoint returns JSON
- [ ] Agent successfully sending data (check logs)
- [ ] Dashboard shows server(s) in list
- [ ] Clicking server shows detail page
- [ ] Charts updating with new data
- [ ] No errors in browser console (F12)

---

## 🔧 Common Issues & Solutions

### Issue 1: "Connection refused" dari agent

**Cause:** Backend tidak running atau firewall blocking

**Solution:**
```bash
# Check backend running
curl http://BACKEND_IP:5000/api/health

# Check firewall
sudo ufw status
sudo ufw allow 5000/tcp

# Check backend logs
sudo journalctl -u monitoring-backend -f
```

### Issue 2: Agent permission denied

**Cause:** Agent perlu sudo untuk akses semua metrics

**Solution:**
```bash
# Run dengan sudo
sudo python3 monitor_agent.py --server http://SERVER:5000

# Atau install sebagai systemd service (runs as root)
sudo ./install.sh
```

### Issue 3: Dashboard shows no data

**Cause:** Agent belum mengirim data atau network issue

**Solution:**
```bash
# Check agent logs
sudo journalctl -u monitoring-agent -f

# Test manual
python3 monitor_agent.py --server http://SERVER:5000

# Check network
ping BACKEND_IP
curl http://BACKEND_IP:5000/api/health
```

### Issue 4: Flask warning "Do not use development server"

**Cause:** Flask development server di production

**Solution:**
```bash
# Use gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Atau setup nginx reverse proxy (recommended)
```

### Issue 5: Module not found errors

**Cause:** Dependencies tidak terinstall

**Solution:**
```bash
# Backend
cd backend
pip install -r requirements.txt

# Agent
cd agent
pip3 install -r requirements.txt
```

---

## 📚 Next Steps

Setelah instalasi berhasil:

1. **Setup Alerts**: Tambahkan email/Slack notifications
2. **Add Database**: Untuk persistent storage
3. **Customize Metrics**: Tambah metrics sesuai kebutuhan
4. **Security**: Add authentication, HTTPS
5. **Scaling**: Setup load balancing untuk banyak servers

Lihat [CONFIG_EXAMPLES.md](CONFIG_EXAMPLES.md) untuk customization ideas.

---

## 🆘 Need Help?

Jika masih ada masalah:

1. Check semua logs (backend & agent)
2. Test network connectivity
3. Verify all dependencies installed
4. Check firewall rules
5. Review error messages di browser console

Good luck! 🚀

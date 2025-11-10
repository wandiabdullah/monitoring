# Server Monitoring System

Sistem monitoring lengkap untuk server Linux dengan dashboard real-time monitoring CPU, RAM, Disk, dan I/O.

## 🚀 Quick Start

### Option 1: Production dengan HTTPS (Let's Encrypt)

**Recommended untuk production!**

#### Windows Server:
```powershell
# 1. Edit email di setup-letsencrypt-simple.ps1
$EMAIL = "your-email@domain.com"

# 2. Run setup (otomatis dapat SSL + auto-renewal)
.\setup-letsencrypt-simple.ps1

# 3. Akses via HTTPS
https://eyes.indoinfinite.com
```

#### Linux Server:
```bash
# 1. Edit email di setup-letsencrypt-simple-linux.sh
EMAIL="your-email@domain.com"

# 2. Run setup
chmod +x setup-letsencrypt-simple-linux.sh
./setup-letsencrypt-simple-linux.sh

# 3. Akses via HTTPS
https://eyes.indoinfinite.com
```

✅ SSL certificate valid dari Let's Encrypt  
✅ Auto-renewal setiap 12 jam  
✅ No browser warning

**Dokumentasi:**
- Windows: [LETSENCRYPT-GUIDE.md](LETSENCRYPT-GUIDE.md)
- Linux: [LINUX-SSL-GUIDE.md](LINUX-SSL-GUIDE.md)
- Quick Reference: [LINUX-QUICKSTART.txt](LINUX-QUICKSTART.txt)

---

### Option 2: Development (HTTP)

```bash
docker-compose up -d
```

Akses: `http://localhost:5000`

---

## 🔒 SSL/HTTPS Setup

Sistem ini support **Let's Encrypt** dengan auto-renewal:

- 📜 Valid SSL certificate (trusted oleh browser)
- 🔄 Auto-renewal setiap 12 jam
- 📧 Email notification jika renewal gagal
- 🛡️ Modern SSL/TLS security (A+ rating)

**Quick Setup:**
```powershell
.\setup-letsencrypt.ps1
```

Lihat [LETSENCRYPT-GUIDE.md](LETSENCRYPT-GUIDE.md) dan [QUICK-REFERENCE.md](QUICK-REFERENCE.md) untuk detail lengkap.

---

## 🔐 Login ke Dashboard

**Default credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Ganti password setelah login pertama!**

---

## 📋 Fitur

### 🚨 Alert System (NEW!)
- **Auto-detection**: Server down, high CPU, disk full, memory high
- **Multi-channel Notifications**:
  - ✉️ Email (Gmail, Office 365, custom SMTP)
  - 📱 Telegram Bot (real-time)
  - 💬 WhatsApp (Twilio atau Fonnte)
- **Configurable Thresholds**: CPU > 70%, Disk > 90%, Memory > 90%
- **Cooldown Protection**: Prevent notification spam
- **Alert History**: Track all alerts dengan resolve status
- **Test Notifications**: Verify channel configuration

**Quick Setup:** [ALERT-SETUP-GUIDE.md](ALERT-SETUP-GUIDE.md) | **Summary:** [ALERT-SYSTEM-SUMMARY.md](ALERT-SYSTEM-SUMMARY.md)

### 🎨 Modern Dashboard
- **Sidebar Navigation**: Professional UI dengan menu samping
- **Group Management**: Organize hosts berdasarkan kategori
  - Production, Development, Database, dll
  - Visual icons untuk setiap group
  - Collapsible group views
- **Key Mapping Security**: API key locked per hostname
  - Prevent key sharing antar hosts
  - Enhanced security untuk multi-tenant
- **Real-time Statistics**: Total hosts, online/offline, groups
- **Responsive Design**: Mobile-friendly interface
- **Collapsible Sidebar**: Toggle sidebar untuk monitoring space yang lebih besar

### 🔐 Authentication & Security
- � Login system untuk akses dashboard
- 👥 User management (Admin & Regular users)
- 🔑 Account settings (Change email & password)
- 🔑 API key authentication per host dengan key mapping
- 🛡️ Session-based security
- 📝 Audit trail (last_seen tracking)

### Agent (Linux)
- ✅ Monitoring CPU (usage per core, load average, frequency)
- ✅ Monitoring Memory (RAM dan Swap)
- ✅ Monitoring Disk (semua partisi)
- ✅ Monitoring I/O (Network dan Disk I/O rates)
- ✅ Auto-send metrics ke central server dengan API key
- ✅ Systemd service support

### Dashboard Web
- ✅ Login page dengan authentication
- ✅ Real-time monitoring multiple servers
- ✅ Dashboard overview semua server
- ✅ Detail view per server
- ✅ Grafik history CPU & Memory
- ✅ Grafik Network I/O real-time
- ✅ Informasi disk usage per partisi
- ✅ Host management (Add/Edit/Delete hosts)
- ✅ API key management & regeneration
- ✅ Auto-refresh setiap 5 detik

### Backend API
- ✅ REST API dengan authentication
- ✅ API key verification untuk agents
- ✅ User session management
- ✅ Host management endpoints
- ✅ SQLite database untuk users & hosts
- ✅ In-memory storage untuk metrics dengan history
- ✅ Multiple endpoints untuk berbagai data
- ✅ Support untuk multiple servers

## 🏗️ Struktur Project

```
monitoring/
├── agent/                  # Monitoring agent untuk Linux
│   ├── monitor_agent.py   # Main agent script
│   ├── requirements.txt   # Python dependencies
│   ├── install.sh         # Installation script
│   └── README.md          # Agent documentation
├── backend/               # API Backend
│   ├── app.py            # Flask application
│   ├── requirements.txt  # Python dependencies
│   └── data/             # Storage directory (auto-created)
├── dashboard/            # Web Dashboard
│   ├── index.html        # Dashboard UI
│   └── app.js            # Dashboard logic
├── nginx/                # Nginx configuration (production)
│   └── nginx.conf        # Nginx config
├── Dockerfile            # Docker image definition
├── docker-compose.yml    # Docker Compose (simple)
├── docker-compose.postgres.yml  # With PostgreSQL
└── docker-compose.production.yml # Production setup
```

## 🚀 Instalasi & Setup

### Metode 1: Docker (Recommended) 🐳

**Paling mudah dan cepat!**

```bash
# Start dengan Docker Compose
docker-compose up -d

# Dashboard: http://localhost:5000
```

✅ **Done!** Lihat [DOCKER_QUICKSTART.md](DOCKER_QUICKSTART.md) untuk detail.

📖 **Full Docker Guide:** [DOCKER.md](DOCKER.md)

---

### Metode 2: Manual Installation

#### 1. Setup Backend Server (Monitoring Server)

Backend server bisa di-install di server Windows atau Linux.

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend akan berjalan di `http://localhost:5000`

Dashboard bisa diakses di: `http://localhost:5000`

### 2. Install Agent di Linux Server

Di setiap Linux server yang ingin di-monitor:

```bash
cd agent

# Metode 1: Instalasi otomatis dengan systemd service
sudo chmod +x install.sh
sudo ./install.sh

# Edit konfigurasi server URL
sudo nano /etc/systemd/system/monitoring-agent.service
# Ganti YOUR_MONITORING_SERVER dengan IP/hostname monitoring server

# Start service
sudo systemctl daemon-reload
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
sudo systemctl status monitoring-agent

# Metode 2: Instalasi manual (untuk testing)
pip3 install -r requirements.txt
python3 monitor_agent.py --server http://MONITORING_SERVER_IP:5000
```

## 📊 Cara Penggunaan

### Akses Dashboard

**Development (HTTP):**
```
http://MONITORING_SERVER_IP:5000
```

**Production (HTTPS with SSL):**
```
https://eyes.indoinfinite.com
```

1. Login dengan credentials (default: admin/admin123)
2. Lihat list semua server yang termonitor
3. Klik pada server card untuk melihat detail
4. Dashboard auto-refresh setiap 5 detik

---

### ⚠️ PENTING: Update Agent Setelah SSL Aktif

Setelah mengaktifkan SSL/HTTPS, **SEMUA monitoring agent** di server yang termonitor **HARUS diupdate** untuk menggunakan HTTPS.

#### Quick Fix:

Di setiap server yang termonitor:

```bash
# 1. Stop agent yang running
ps aux | grep monitor_agent.py
kill <PID>

# 2. Start dengan URL HTTPS (tanpa port!)
python3 monitor_agent.py \
  --server https://eyes.indoinfinite.com \
  --api-key YOUR_API_KEY \
  --interval 5
```

**Perubahan URL:**
```bash
# ❌ LAMA (tidak berfungsi setelah SSL):
--server http://eyes.indoinfinite.com:5000

# ✅ BARU (gunakan ini):
--server https://eyes.indoinfinite.com
```

**📖 Dokumentasi Lengkap:**
- [UPDATE-AGENTS-FOR-SSL.md](UPDATE-AGENTS-FOR-SSL.md) - Panduan lengkap
- [AGENT-UPDATE-QUICKFIX.txt](AGENT-UPDATE-QUICKFIX.txt) - Quick reference

---

### Dashboard Features

**Server Overview:**
- Lihat semua server yang termonitor
- CPU dan Memory usage per server
- Status online/offline
- Last update timestamp

**Server Detail:**
- Current statistics (CPU, Memory, Cores, Total RAM)
- History graph CPU & Memory (5 menit terakhir)
- Network I/O graph dan current speed
- Disk usage semua partisi

### Customize Agent

Edit parameter saat menjalankan agent:

```bash
# ⚠️ SETELAH SSL AKTIF - gunakan HTTPS (tanpa port!)
python3 monitor_agent.py \
  --server https://eyes.indoinfinite.com \
  --api-key YOUR_API_KEY \
  --interval 5

# SEBELUM SSL / Development - gunakan HTTP dengan port
python3 monitor_agent.py \
  --server http://SERVER:5000 \
  --api-key YOUR_API_KEY \
  --interval 10

# Custom hostname (dengan --no-key-mapping)
python3 monitor_agent.py \
  --server https://eyes.indoinfinite.com \
  --api-key YOUR_API_KEY \
  --hostname web-server-prod-01 \
  --no-key-mapping
```

**Key Mapping (Default - Recommended):**
- Hostname ditentukan server berdasarkan API key
- Lebih aman, mencegah key sharing
- Agent tidak perlu kirim hostname

**No Key Mapping:**
- Agent mengirim hostname sendiri
- Untuk testing atau custom setup

## 🔧 Konfigurasi

### Backend Configuration

Edit `backend/app.py` untuk customize:

```python
# Port server (default: 5000)
app.run(host='0.0.0.0', port=5000, debug=True)

# Storage limit per server (default: 1000 metrics)
metrics_storage = defaultdict(lambda: deque(maxlen=1000))

# Enable persistent storage (uncomment in app.py)
# save_to_file(hostname, metrics)
```

### Agent Configuration

Edit `agent/monitor_agent.py` untuk customize:

```python
# Collection interval (default: 5 seconds)
interval: int = 5

# Timeout untuk sending metrics (default: 5 seconds)
timeout=5
```

### Dashboard Configuration

Edit `dashboard/app.js` untuk customize:

```javascript
// Auto-refresh interval (default: 5000ms = 5 detik)
const REFRESH_INTERVAL = 5000;

// History time range (dalam query)
// Default: 5 menit, 60 data points
minutes=5&limit=60
```

## 🌐 API Endpoints

### Health Check
```
GET /api/health
```

### Get All Servers
```
GET /api/servers
```

### Get Current Metrics
```
GET /api/servers/<hostname>/current
```

### Get History
```
GET /api/servers/<hostname>/history?minutes=60&limit=100
```

### Get Statistics
```
GET /api/servers/<hostname>/stats
```

### Get Disk Info
```
GET /api/servers/<hostname>/disk
```

### Get Network Info
```
GET /api/servers/<hostname>/network?minutes=5
```

### Send Metrics (dari agent)
```
POST /api/metrics
Content-Type: application/json

{
  "hostname": "server-name",
  "timestamp": "2025-11-06T10:00:00",
  "cpu": {...},
  "memory": {...},
  "disk": {...},
  "io": {...}
}
```

## 🔍 Troubleshooting

### Agent tidak mengirim data

1. Cek koneksi ke monitoring server:
```bash
curl http://MONITORING_SERVER:5000/api/health
```

2. Cek logs agent:
```bash
# Jika menggunakan systemd
sudo journalctl -u monitoring-agent -f

# Jika manual
# Lihat output di terminal
```

3. Cek firewall:
```bash
# Allow port 5000
sudo ufw allow 5000/tcp
```

### Dashboard tidak menampilkan data

1. Cek backend server berjalan:
```bash
curl http://localhost:5000/api/health
```

2. Cek console browser (F12) untuk errors
3. Pastikan agent sudah mengirim data minimal 1x

### Permission errors di agent

Agent perlu privilege untuk membaca beberapa metrics. Jalankan dengan sudo:
```bash
sudo python3 monitor_agent.py --server http://SERVER:5000
```

## 📈 Upgrade & Customization

### Menambah Metrics Baru

1. Edit `agent/monitor_agent.py`:
```python
def get_custom_metrics(self):
    # Add your custom metrics
    return {'custom_metric': value}

def collect_metrics(self):
    return {
        'hostname': self.hostname,
        'timestamp': datetime.utcnow().isoformat(),
        'cpu': self.get_cpu_metrics(),
        'memory': self.get_memory_metrics(),
        'disk': self.get_disk_metrics(),
        'io': self.get_io_metrics(),
        'custom': self.get_custom_metrics()  # Add here
    }
```

2. Update dashboard untuk display custom metrics

### Menambah Persistent Storage (Database)

Ganti in-memory storage di `backend/app.py` dengan database:
- SQLite untuk simple setup
- PostgreSQL/MySQL untuk production
- InfluxDB untuk time-series data

### Menambah Alerting

Tambahkan logic di `backend/app.py`:
```python
def check_alerts(metrics):
    if metrics['cpu']['cpu_percent_total'] > 90:
        send_alert('High CPU usage')
    if metrics['memory']['memory_percent'] > 90:
        send_alert('High Memory usage')
```

## 📝 Requirements

### Backend Server
- Python 3.7+
- Flask
- Flask-CORS

### Linux Agent
- Python 3.7+
- psutil
- requests

### Dashboard
- Modern web browser (Chrome, Firefox, Edge)
- JavaScript enabled

## 📄 License

MIT License - Feel free to use and modify

## 🤝 Contributing

Silakan untuk menambah features atau improvements!

## 📧 Support

Jika ada pertanyaan atau issues, silakan buat issue di repository ini.

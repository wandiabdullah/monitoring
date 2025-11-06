# Linux Monitoring Agent

Agent untuk monitoring server Linux yang mengumpulkan metrics CPU, RAM, Disk, dan I/O dengan authentication menggunakan API key.

## 🌟 Compatibility

✅ **Python Versions:**
- Python 2.7+ (CentOS 6/7, old systems)
- Python 3.x (recommended)

✅ **Operating Systems:**
- CentOS 6, 7, 8, Stream
- RHEL 6, 7, 8, 9
- Rocky Linux 8, 9
- AlmaLinux 8, 9
- Ubuntu 14.04+
- Debian 7+
- Any Linux with Python 2.7+

📖 **Full compatibility guide:** [CENTOS_COMPATIBILITY.md](../CENTOS_COMPATIBILITY.md)

---

## 🔑 Prerequisites

Sebelum install agent, Anda perlu:

1. **Login ke Dashboard** monitoring sebagai admin
2. **Add Host** baru di dashboard
3. **Enable/Disable Key Mapping** sesuai kebutuhan:
   - ✅ **Key Mapping Enabled** (Recommended): Hostname ditentukan oleh server dari API key (lebih aman)
   - ❌ **Key Mapping Disabled**: Agent mengirim hostname sendiri (lebih fleksibel)
4. **Copy API Key** yang ditampilkan (hanya muncul sekali!)

## 🔐 Apa itu Key Mapping?

**Key Mapping** adalah fitur keamanan yang memetakan API key dengan hostname di server:

### ✅ **Key Mapping Enabled** (Secure Mode - RECOMMENDED)
- Hostname **ditentukan oleh server** berdasarkan API key
- Agent **tidak bisa** mengirim hostname palsu
- Lebih aman, mencegah spoofing
- Cocok untuk production environment

### ❌ **Key Mapping Disabled** (Flexible Mode)
- Agent **mengirim hostname sendiri**
- Bisa override hostname dengan flag `--hostname`
- Lebih fleksibel untuk testing atau development
- Cocok untuk environment dinamis

## Fitur

- **CPU Monitoring**: Usage per core, load average, frequency
- **Memory Monitoring**: RAM dan Swap usage
- **Disk Monitoring**: Usage semua partisi
- **I/O Monitoring**: Network dan Disk I/O rates
- **System Information**: OS, kernel, architecture, uptime
- **Secure Authentication**: Menggunakan API key per host
- **Key Mapping Support**: Hostname mapping untuk keamanan ekstra
- **Auto-reconnect**: Otomatis reconnect jika koneksi terputus

## Instalasi

### Metode 1: Instalasi Otomatis (dengan systemd service) - RECOMMENDED

```bash
sudo chmod +x install.sh
sudo ./install.sh
```

Script akan menanyakan:
- **API Key**: Paste API key dari dashboard
- **Server URL**: URL monitoring server (default: http://monitoring-server:5000)
- **Hostname**: Opsional, auto-detect jika dikosongkan
- **Interval**: Interval pengiriman metrics dalam detik (default: 5)

Start service:
```bash
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
sudo systemctl status monitoring-agent
```

View logs:
```bash
sudo journalctl -u monitoring-agent -f
```

### Metode 2: Manual Installation

1. Install dependencies:
```bash
pip3 install -r requirements.txt
```

2. Jalankan agent dengan API key:
```bash
python3 monitor_agent.py \
  --server http://monitoring-server:5000 \
  --api-key "YOUR_API_KEY_HERE" \
  --interval 5
```

## Usage

```bash
python3 monitor_agent.py --server <SERVER_URL> --api-key <API_KEY> [OPTIONS]

Required Arguments:
  --server, -s        Monitoring server URL
  --api-key, -k       API key for authentication (get from dashboard)

Optional Arguments:
  --hostname, -n      Custom hostname (only works with --no-key-mapping)
  --interval, -i      Collection interval in seconds (default: 5)
  --no-key-mapping    Disable key mapping (send local hostname instead)
```

### Contoh:

#### ✅ **Mode 1: Key Mapping Enabled (Recommended)**

Hostname ditentukan oleh server dari API key:

```bash
# Basic usage - hostname dari server
python3 monitor_agent.py \
  --server http://192.168.1.100:5000 \
  --api-key "xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG9eQ8wE3rT2y"

# Dengan custom interval
python3 monitor_agent.py \
  --server http://monitoring.example.com:5000 \
  --api-key "xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG9eQ8wE3rT2y" \
  --interval 10
```

#### ❌ **Mode 2: Key Mapping Disabled (Flexible)**

Agent mengirim hostname sendiri:

```bash
# Auto-detect hostname
python3 monitor_agent.py \
  --server http://192.168.1.100:5000 \
  --api-key "xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG9eQ8wE3rT2y" \
  --no-key-mapping

# Custom hostname
python3 monitor_agent.py \
  --server http://192.168.1.100:5000 \
  --api-key "xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG9eQ8wE3rT2y" \
  --hostname production-db-01 \
  --no-key-mapping
```

### 📊 Output Example:

```
Starting monitoring agent for server1.example.com
Sending metrics to: http://192.168.1.100:5000
Collection interval: 5 seconds
Key mapping enabled: True
  → Hostname will be determined by server from API key (secure mode)

[2024-11-06 10:30:15] Collected metrics:
  CPU: 23.5%
  Memory: 45.2%
  Network: ↑12.3 KB/s ↓45.6 KB/s
  ✓ Metrics sent successfully
```

## Setup Systemd Service (Manual)

1. Create service file:
```bash
sudo nano /etc/systemd/system/monitoring-agent.service
```

2. Paste configuration:
```ini
[Unit]
Description=Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/monitoring-agent
Environment="API_KEY=YOUR_API_KEY_HERE"
ExecStart=/usr/bin/python3 /opt/monitoring-agent/monitor_agent.py \
  --server http://monitoring-server:5000 \
  --api-key ${API_KEY} \
  --interval 5
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. Enable dan start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
```

## Data yang Dikumpulkan

### CPU Metrics
- CPU usage total dan per core
- CPU frequency (current, min, max)
- Load average
- Physical dan logical core count

### Memory Metrics
- Total, used, available, free RAM
- Memory usage percentage
- Swap usage dan percentage

### Disk Metrics
- All mounted partitions
- Disk usage (total, used, free, percentage)
- Filesystem type

### I/O Metrics
- Network: bytes sent/received, packets, errors, drops
- Network transfer rates (bytes/sec)
- Disk I/O: read/write counts, bytes, time
- Disk I/O rates (bytes/sec)

## Troubleshooting

### Melihat logs (jika menggunakan systemd):
```bash
journalctl -u monitoring-agent -f
```

### Test koneksi ke server:
```bash
curl http://YOUR_MONITORING_SERVER:5000/api/health
```

### Permission errors:
Pastikan agent dijalankan dengan privilege yang cukup (biasanya root) untuk akses ke semua metrics.

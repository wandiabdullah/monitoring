# 🖥️ Server Monitoring System

Sistem monitoring lengkap untuk server Linux dengan dashboard real-time.

## ✨ Fitur Utama

- ✅ **Monitoring Real-time**: CPU, Memory, Disk, Network I/O
- ✅ **Multi-Server Support**: Monitor banyak server dari satu dashboard
- ✅ **Beautiful Dashboard**: UI modern dengan grafik interaktif
- ✅ **Easy Installation**: Script instalasi otomatis untuk agent
- ✅ **Systemd Integration**: Jalankan sebagai background service
- ✅ **RESTful API**: Akses data via API endpoints
- ✅ **Auto-refresh**: Dashboard update otomatis setiap 5 detik
- ✅ **Historical Data**: Lihat trend dan history metrics

## 🚀 Quick Start

### 1. Start Backend (Monitoring Server)

**Windows:**
```bash
start_backend.bat
```

**Linux/Mac:**
```bash
chmod +x start_backend.sh
./start_backend.sh
```

Dashboard akan tersedia di: **http://localhost:5000**

### 2. Install Agent di Linux Server

```bash
cd agent
sudo pip3 install -r requirements.txt
sudo python3 monitor_agent.py --server http://MONITORING_SERVER_IP:5000
```

### 3. Access Dashboard

Buka browser ke: `http://MONITORING_SERVER_IP:5000`

## 📁 Project Structure

```
monitoring/
├── agent/              # Linux monitoring agent
│   ├── monitor_agent.py
│   ├── install.sh
│   └── requirements.txt
├── backend/            # Flask API server
│   ├── app.py
│   └── requirements.txt
├── dashboard/          # Web UI
│   ├── index.html
│   └── app.js
├── README.md          # Full documentation
├── QUICKSTART.md      # Quick setup guide
├── ARCHITECTURE.md    # System design
└── CONFIG_EXAMPLES.md # Configuration samples
```

## 📖 Documentation

- **[README.md](README.md)** - Dokumentasi lengkap
- **[QUICKSTART.md](QUICKSTART.md)** - Panduan cepat
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Arsitektur sistem
- **[CONFIG_EXAMPLES.md](CONFIG_EXAMPLES.md)** - Contoh konfigurasi
- **[agent/README.md](agent/README.md)** - Dokumentasi agent

## 🧪 Testing

Untuk testing tanpa Linux server, gunakan test agent:

```bash
pip install requests
python test_agent.py --server http://localhost:5000 --hostname test-server-01
```

Ini akan mengirim fake data ke backend untuk testing dashboard.

## 📊 Dashboard Preview

Dashboard menampilkan:
- **Server List**: Overview semua server yang dimonitor
- **CPU & Memory Usage**: Real-time dengan grafik
- **Network I/O**: Upload/download speed
- **Disk Usage**: Semua partisi
- **History Charts**: Trend 5 menit terakhir

## 🔧 Requirements

### Backend Server
- Python 3.7+
- Flask
- Modern web browser

### Linux Agent
- Python 3.7+
- psutil
- requests

## 🌟 Features Detail

### Metrics yang Dikumpulkan

**CPU:**
- Usage total & per core
- Load average
- CPU frequency
- Core count (physical & logical)

**Memory:**
- RAM usage (total, used, free, available)
- Swap usage
- Percentage

**Disk:**
- All mounted partitions
- Usage (total, used, free, percentage)
- Filesystem type

**I/O:**
- Network: bytes sent/received, packets, errors
- Network rates: upload/download speed
- Disk I/O: read/write counts, bytes, time
- Disk I/O rates: read/write speed

## 🔐 Production Deployment

Untuk production, pertimbangkan:
- ✅ Setup HTTPS/SSL
- ✅ Add authentication
- ✅ Use database untuk persistent storage
- ✅ Setup nginx reverse proxy
- ✅ Configure firewall rules
- ✅ Setup alerts untuk high usage

Lihat [CONFIG_EXAMPLES.md](CONFIG_EXAMPLES.md) untuk detail.

## 💡 Customization

Sistem ini sangat mudah di-customize:
- Tambah metrics baru
- Ganti storage backend
- Tambah alerting
- Customize dashboard
- Add authentication

Lihat [ARCHITECTURE.md](ARCHITECTURE.md) untuk customization guide.

## 🐛 Troubleshooting

**Agent tidak connect:**
```bash
# Test koneksi
curl http://MONITORING_SERVER:5000/api/health

# Check firewall
sudo ufw allow 5000/tcp
```

**No data di dashboard:**
- Wait 5-10 detik untuk data pertama
- Check browser console (F12)
- Verify agent running: `systemctl status monitoring-agent`

**Permission errors:**
```bash
# Run agent dengan sudo
sudo python3 monitor_agent.py --server http://SERVER:5000
```

## 📝 License

MIT License - Free to use and modify

## 🤝 Support

Jika ada pertanyaan atau issues, buka issue di repository ini.

---

**Made with ❤️ for easy server monitoring**

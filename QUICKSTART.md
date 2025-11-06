# Quick Start Guide

## Setup Cepat (5 Menit)

### 1. Start Backend Server (Windows/Linux)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

✅ Backend running di: http://localhost:5000  
✅ Dashboard: http://localhost:5000

### 2. Install Agent di Linux Server

```bash
cd agent
pip3 install -r requirements.txt

# Jalankan agent (ganti IP_SERVER dengan IP monitoring server)
python3 monitor_agent.py --server http://IP_SERVER:5000
```

### 3. Akses Dashboard

Buka browser: `http://IP_SERVER:5000`

**Selesai!** Dashboard akan menampilkan server yang sudah mengirim data.

---

## Production Setup (dengan Systemd)

### Backend (Running as Service)

Create file `/etc/systemd/system/monitoring-backend.service`:

```ini
[Unit]
Description=Monitoring Backend Server
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/monitoring/backend
ExecStart=/usr/bin/python3 app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable & start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable monitoring-backend
sudo systemctl start monitoring-backend
```

### Agent (Automated Install)

```bash
cd agent
sudo ./install.sh
# Edit server URL in /etc/systemd/system/monitoring-agent.service
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
```

---

## Testing

### Test Backend Health
```bash
curl http://localhost:5000/api/health
```

### Test Agent Connection
```bash
# Manual test
python3 monitor_agent.py --server http://localhost:5000 --interval 5
```

### View Logs
```bash
# Agent logs
sudo journalctl -u monitoring-agent -f

# Backend logs (if systemd)
sudo journalctl -u monitoring-backend -f
```

---

## Firewall Configuration

### Backend Server
```bash
# Allow port 5000
sudo ufw allow 5000/tcp
sudo ufw reload
```

### Agent Server
No inbound ports needed (agent pushes data)

---

## Multiple Servers Setup

1. Install agent di setiap server dengan hostname berbeda
2. Semua agent pointing ke monitoring server yang sama
3. Dashboard otomatis show semua servers

Example:
```bash
# Server 1
python3 monitor_agent.py --server http://monitor.example.com:5000 --hostname web-server-01

# Server 2
python3 monitor_agent.py --server http://monitor.example.com:5000 --hostname db-server-01

# Server 3
python3 monitor_agent.py --server http://monitor.example.com:5000 --hostname app-server-01
```

---

## Common Issues

**Problem: Agent can't connect**
- Check firewall on monitoring server
- Verify server URL is correct
- Test with: `curl http://SERVER:5000/api/health`

**Problem: No data in dashboard**
- Wait 5-10 seconds for first metrics
- Check browser console (F12) for errors
- Verify agent is running: `systemctl status monitoring-agent`

**Problem: Permission denied errors**
- Run agent with sudo: `sudo python3 monitor_agent.py ...`
- Or install as systemd service (runs as root)

---

## Next Steps

- ✅ Setup alerting untuk high usage
- ✅ Add database untuk persistent storage
- ✅ Configure nginx reverse proxy untuk production
- ✅ Add HTTPS/SSL certificate
- ✅ Customize metrics sesuai kebutuhan

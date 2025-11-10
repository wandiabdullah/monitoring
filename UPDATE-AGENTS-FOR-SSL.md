# 🔄 UPDATE MONITORING AGENTS FOR HTTPS

Setelah SSL aktif, semua monitoring agent di server yang termonitor **HARUS** diupdate untuk menggunakan HTTPS.

---

## ⚠️ MASALAH

```
❌ LAMA (tidak akan berfungsi):
   http://eyes.indoinfinite.com:5000

✅ BARU (gunakan ini):
   https://eyes.indoinfinite.com
```

**Port 5000 tidak bisa diakses dari luar!** Nginx sekarang handle semua request di port 443 (HTTPS) dan forward ke backend internal.

---

## 🔧 CARA UPDATE AGENT

### Opsi 1: Stop dan Restart dengan URL Baru (RECOMMENDED)

Di setiap server yang termonitor, stop agent yang running dan restart dengan URL HTTPS:

```bash
# 1. Cari process agent yang running
ps aux | grep monitor_agent.py

# 2. Kill process (ganti PID dengan ID dari step 1)
kill <PID>

# 3. Start ulang dengan URL HTTPS (tanpa port!)
cd /path/to/monitoring/agent
python3 monitor_agent.py \
  --server https://eyes.indoinfinite.com \
  --api-key YOUR_API_KEY \
  --interval 5
```

### Opsi 2: Update systemd Service (jika pakai service)

Jika agent dijalankan sebagai systemd service:

```bash
# 1. Edit service file
sudo nano /etc/systemd/system/monitoring-agent.service

# 2. Update ExecStart line:
ExecStart=/usr/bin/python3 /path/to/monitor_agent.py \
  --server https://eyes.indoinfinite.com \
  --api-key YOUR_API_KEY \
  --interval 5

# 3. Reload dan restart
sudo systemctl daemon-reload
sudo systemctl restart monitoring-agent
sudo systemctl status monitoring-agent
```

---

## 📝 CONTOH LENGKAP

### Sebelum SSL (OLD):
```bash
python3 monitor_agent.py \
  --server http://eyes.indoinfinite.com:5000 \
  --api-key abc123def456 \
  --interval 5
```

### Setelah SSL (NEW):
```bash
python3 monitor_agent.py \
  --server https://eyes.indoinfinite.com \
  --api-key abc123def456 \
  --interval 5
```

**Perubahan:**
- `http://` → `https://`
- Hapus `:5000` (Nginx handle di port 443)

---

## 🔍 VERIFIKASI

### Cek di Server yang Termonitor:

```bash
# Cek agent running
ps aux | grep monitor_agent.py

# Cek log agent (lihat output)
# Pastikan ada "[OK] Metrics sent successfully"
```

### Cek di Dashboard:

1. Buka `https://eyes.indoinfinite.com` (HTTPS, no warning)
2. Login ke dashboard
3. Cek server list - status harus "Online" dengan badge hijau
4. Klik server untuk lihat detail metrics
5. Grafik harus update setiap 5 detik

---

## 🐛 TROUBLESHOOTING

### Agent Error: Connection Refused

**Penyebab:** Masih menggunakan port 5000 atau HTTP instead of HTTPS

**Solusi:**
```bash
# Stop agent
kill <PID>

# Start dengan HTTPS dan tanpa port
python3 monitor_agent.py \
  --server https://eyes.indoinfinite.com \
  --api-key YOUR_API_KEY
```

### Agent Error: SSL Certificate Verify Failed

**Penyebab:** Python requests tidak trust Let's Encrypt certificate (jarang terjadi)

**Solusi 1 - Update CA certificates:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ca-certificates
sudo update-ca-certificates

# CentOS/RHEL/Rocky
sudo yum install ca-certificates
sudo update-ca-trust
```

**Solusi 2 - Disable SSL verify (NOT RECOMMENDED for production):**
```python
# Edit monitor_agent.py line ~293
response = requests.post(
    "{0}/api/metrics".format(self.server_url),
    data=json_data,
    headers=headers,
    timeout=10,
    verify=False  # ⚠️ Only use if Solution 1 doesn't work
)
```

### Dashboard: Server Status "Offline"

**Kemungkinan penyebab:**

1. **Agent belum diupdate ke HTTPS**
   ```bash
   # Cek log agent
   ps aux | grep monitor_agent
   # Pastikan menggunakan https://eyes.indoinfinite.com
   ```

2. **Agent tidak running**
   ```bash
   ps aux | grep monitor_agent.py
   # Jika kosong, start agent
   ```

3. **Firewall block outbound HTTPS (port 443)**
   ```bash
   # Test connectivity
   curl -I https://eyes.indoinfinite.com/api/health
   # Harus return 200 OK
   ```

4. **API Key salah**
   - Generate API key baru di dashboard
   - Update agent dengan API key baru

---

## 📋 CHECKLIST UPDATE

Untuk setiap server yang termonitor:

- [ ] Stop agent yang running (kill process)
- [ ] Update command dengan HTTPS URL (tanpa :5000)
- [ ] Start agent dengan URL baru
- [ ] Verifikasi agent output: "[OK] Metrics sent successfully"
- [ ] Cek dashboard: server status "Online"
- [ ] Verifikasi grafik updating setiap 5 detik
- [ ] (Optional) Update systemd service jika menggunakan service
- [ ] (Optional) Update crontab jika menggunakan cron

---

## 🚀 SCRIPT AUTO-UPDATE (OPTIONAL)

Buat script untuk update semua agent sekaligus:

```bash
#!/bin/bash
# update-agents.sh

NEW_SERVER_URL="https://eyes.indoinfinite.com"
AGENT_PATH="/opt/monitoring/agent/monitor_agent.py"

echo "Stopping old agent..."
pkill -f monitor_agent.py

echo "Starting agent with new URL..."
nohup python3 $AGENT_PATH \
  --server $NEW_SERVER_URL \
  --api-key $(cat /opt/monitoring/.api-key) \
  --interval 5 \
  > /var/log/monitoring-agent.log 2>&1 &

echo "Agent updated! Check logs:"
tail -f /var/log/monitoring-agent.log
```

Jalankan:
```bash
chmod +x update-agents.sh
./update-agents.sh
```

---

## ✅ EXPECTED RESULT

Setelah update, di setiap server agent harus menampilkan:

```
Starting monitoring agent for server-hostname
Sending metrics to: https://eyes.indoinfinite.com
Collection interval: 5 seconds
Key mapping enabled: True
Python version: 3.x.x
psutil version: x.x.x
  >> Hostname will be determined by server from API key (secure mode)

[2025-11-10 10:30:00] Collected metrics:
  CPU: 25.3%
  Memory: 45.2%
  Network: UP 150.5 KB/s | DOWN 350.2 KB/s
  [OK] Metrics sent successfully  ✅

[2025-11-10 10:30:05] Collected metrics:
  CPU: 28.1%
  Memory: 45.5%
  Network: UP 145.2 KB/s | DOWN 380.5 KB/s
  [OK] Metrics sent successfully  ✅
```

**Dashboard menampilkan:**
- Server status: 🟢 **Online**
- Real-time metrics updating setiap 5 detik
- Grafik CPU, Memory, Network, Disk I/O berfungsi
- HTTPS dengan 🔒 icon di browser (no warning)

---

## 📞 SUPPORT

Jika masih ada masalah setelah update:

1. Cek troubleshooting di atas
2. Jalankan diagnostic: `./troubleshoot-ssl-linux.sh`
3. Cek logs:
   - Agent: output di terminal atau `/var/log/monitoring-agent.log`
   - Backend: `docker-compose -f docker-compose.ssl.yml logs monitoring-backend`
   - Nginx: `docker-compose -f docker-compose.ssl.yml logs nginx`

---

**PENTING:** Semua agent HARUS menggunakan HTTPS setelah SSL aktif. HTTP + port 5000 tidak akan berfungsi lagi karena port 5000 hanya accessible dari dalam Docker network, tidak dari internet.

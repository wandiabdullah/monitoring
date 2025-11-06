# 🔧 CentOS 7 Systemd Fix - "Executable path is not absolute"

## Problem

Error saat start service di CentOS 7:

```
systemd[1]: Executable path is not absolute, ignoring: python3 /opt/monitoring-agent/monitor_agent.py
systemd[1]: monitoring-agent.service lacks both ExecStart= and ExecStop= setting. Refusing.
```

## Root Cause

Systemd membutuhkan **absolute path** untuk `ExecStart`, tidak bisa menggunakan command name saja (seperti `python3`).

**❌ Wrong:**
```ini
ExecStart=python3 /opt/monitoring-agent/monitor_agent.py --server ...
```

**✅ Correct:**
```ini
ExecStart=/usr/bin/python3 /opt/monitoring-agent/monitor_agent.py --server ...
```

---

## Quick Fix

### Option 1: Automatic Fix Script (Recommended)

```bash
cd /opt/monitoring-agent
sudo chmod +x fix-service.sh
sudo ./fix-service.sh
```

Script akan:
1. ✅ Detect Python path otomatis
2. ✅ Backup service file lama
3. ✅ Update dengan absolute path
4. ✅ Reload systemd
5. ✅ Restart service

---

### Option 2: Manual Fix

#### Step 1: Find Python Absolute Path

```bash
# For Python 3
which python3
# Output example: /usr/bin/python3

# For Python 2.7
which python2.7
# Output example: /usr/bin/python2.7
```

#### Step 2: Edit Service File

```bash
sudo nano /etc/systemd/system/monitoring-agent.service
```

#### Step 3: Fix ExecStart Line

**Before:**
```ini
ExecStart=python3 /opt/monitoring-agent/monitor_agent.py --server http://eyes.indoinfinite.com:5000/ --api-key ${API_KEY} --interval 5
```

**After:**
```ini
ExecStart=/usr/bin/python3 /opt/monitoring-agent/monitor_agent.py --server http://eyes.indoinfinite.com:5000/ --api-key ${API_KEY} --interval 5
```

**Note:** Ganti `/usr/bin/python3` dengan output dari `which python3`

#### Step 4: Reload and Restart

```bash
# Reload systemd
sudo systemctl daemon-reload

# Restart service
sudo systemctl restart monitoring-agent

# Check status
sudo systemctl status monitoring-agent
```

---

## Verification

### Check Service Status

```bash
sudo systemctl status monitoring-agent
```

**Expected output:**
```
● monitoring-agent.service - Server Monitoring Agent
   Loaded: loaded (/etc/systemd/system/monitoring-agent.service; enabled; vendor preset: disabled)
   Active: active (running) since Wed 2024-11-06 14:55:00 WIB; 5s ago
 Main PID: 12345 (python3)
   CGroup: /system.slice/monitoring-agent.service
           └─12345 /usr/bin/python3 /opt/monitoring-agent/monitor_agent.py...
```

### View Live Logs

```bash
sudo journalctl -u monitoring-agent -f
```

**Expected output:**
```
Nov 06 14:55:00 server1 systemd[1]: Started Server Monitoring Agent.
Nov 06 14:55:01 server1 python3[12345]: Starting monitoring agent for server1.sumedangkab.go.id
Nov 06 14:55:01 server1 python3[12345]: Sending metrics to: http://eyes.indoinfinite.com:5000/
Nov 06 14:55:01 server1 python3[12345]: Collection interval: 5 seconds
Nov 06 14:55:01 server1 python3[12345]: Key mapping enabled: True
Nov 06 14:55:02 server1 python3[12345]: [2024-11-06 14:55:02] Collected metrics:
Nov 06 14:55:02 server1 python3[12345]:   CPU: 15.2%
Nov 06 14:55:02 server1 python3[12345]:   Memory: 42.3%
Nov 06 14:55:02 server1 python3[12345]:   Network: ↑5.2 KB/s ↓12.8 KB/s
Nov 06 14:55:02 server1 python3[12345]:   ✓ Metrics sent successfully
```

---

## Complete Service File Example

**Correct service file untuk CentOS 7:**

```ini
[Unit]
Description=Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/monitoring-agent
Environment="API_KEY=xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG"
ExecStart=/usr/bin/python3 /opt/monitoring-agent/monitor_agent.py --server http://eyes.indoinfinite.com:5000/ --api-key ${API_KEY} --interval 5
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Key points:**
1. ✅ `ExecStart=` uses **absolute path** `/usr/bin/python3`
2. ✅ Script path juga absolute: `/opt/monitoring-agent/monitor_agent.py`
3. ✅ `Environment=` untuk API key
4. ✅ `Restart=always` untuk auto-restart jika crash

---

## Common Python Paths by OS

| OS | Python 2.7 | Python 3 |
|----|-----------|----------|
| **CentOS 7** | `/usr/bin/python2.7` | `/usr/bin/python3` |
| **CentOS 8** | N/A | `/usr/bin/python3` |
| **Ubuntu 18.04** | `/usr/bin/python2.7` | `/usr/bin/python3` |
| **Ubuntu 20.04+** | N/A | `/usr/bin/python3` |
| **Debian 10+** | `/usr/bin/python2.7` | `/usr/bin/python3` |

**Note:** Always verify with `which python3` atau `which python2.7`

---

## Troubleshooting

### Error: "command not found: which"

```bash
# Install which command
sudo yum install -y which
```

### Error: Service still not starting

```bash
# Check detailed error
sudo journalctl -xe

# Verify file permissions
ls -l /opt/monitoring-agent/monitor_agent.py
# Should show: -rwxr-xr-x (executable)

# If not executable:
sudo chmod +x /opt/monitoring-agent/monitor_agent.py
```

### Error: "No such file or directory" for Python

```bash
# Verify Python is installed
python3 --version

# If not installed:
sudo yum install -y python3

# Then find path:
which python3
```

### Error: API_KEY not found

```bash
# Check environment variable syntax
grep "API_KEY" /etc/systemd/system/monitoring-agent.service

# Should show:
# Environment="API_KEY=your-actual-key-here"
# NOT: Environment="API_KEY=${API_KEY}"
```

---

## Prevention for Future Installs

Update `install.sh` sudah diperbaiki untuk otomatis menggunakan absolute path:

```bash
# Get absolute path to Python
PYTHON_PATH=$(which $PYTHON_CMD)

# Use in ExecStart
ExecStart=$PYTHON_PATH /opt/monitoring-agent/monitor_agent.py ...
```

Jika install ulang di server lain, gunakan `install.sh` versi terbaru.

---

## Quick Commands Reference

```bash
# Check service status
sudo systemctl status monitoring-agent

# Start service
sudo systemctl start monitoring-agent

# Stop service
sudo systemctl stop monitoring-agent

# Restart service
sudo systemctl restart monitoring-agent

# Enable auto-start on boot
sudo systemctl enable monitoring-agent

# View logs (live)
sudo journalctl -u monitoring-agent -f

# View last 50 lines
sudo journalctl -u monitoring-agent -n 50

# Check if service is enabled
sudo systemctl is-enabled monitoring-agent

# Reload systemd (after editing service file)
sudo systemctl daemon-reload
```

---

## Summary

**Problem:** Systemd requires absolute paths for `ExecStart`

**Solution:** Use `/usr/bin/python3` instead of `python3`

**Quick Fix:**
```bash
cd /opt/monitoring-agent
sudo chmod +x fix-service.sh
sudo ./fix-service.sh
```

**Verify:**
```bash
sudo systemctl status monitoring-agent
sudo journalctl -u monitoring-agent -f
```

✅ Done! Service should be running now.

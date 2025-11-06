# 🔧 Unicode Encoding Fix - CentOS 7

## Problem

Agent crashes dengan error:

```
UnicodeEncodeError: 'ascii' codec can't encode character '\u2192' in position 2: ordinal not in range(128)
```

**Root cause:** CentOS 7 default locale menggunakan ASCII encoding, tidak support Unicode characters seperti `→`, `✓`, `✗`

---

## Fix Applied

Semua Unicode characters diganti dengan ASCII equivalents:

| Before (Unicode) | After (ASCII) | Usage |
|-----------------|---------------|-------|
| `→` (arrow) | `>>` | Direction indicator |
| `↑` (up arrow) | `UP` | Upload speed |
| `↓` (down arrow) | `DOWN` | Download speed |
| `✓` (checkmark) | `[OK]` | Success message |
| `✗` (cross) | `[ERROR]` | Error message |

---

## Quick Update

### Method 1: Copy New File

```bash
# 1. Download or copy updated monitor_agent.py to server
scp monitor_agent.py user@server:/tmp/

# 2. SSH to server
ssh user@server

# 3. Backup and update
sudo cp /opt/monitoring-agent/monitor_agent.py /opt/monitoring-agent/monitor_agent.py.backup
sudo cp /tmp/monitor_agent.py /opt/monitoring-agent/
sudo chmod +x /opt/monitoring-agent/monitor_agent.py

# 4. Restart service
sudo systemctl restart monitoring-agent

# 5. Check logs
sudo journalctl -u monitoring-agent -f
```

---

### Method 2: Use Update Script

```bash
# From agent directory
cd /path/to/monitoring/agent
sudo chmod +x update-agent.sh
sudo ./update-agent.sh
```

---

## Expected Output (After Fix)

```
Starting monitoring agent for server1.sumedangkab.go.id
Sending metrics to: http://eyes.indoinfinite.com:5000/
Collection interval: 5 seconds
Key mapping enabled: True
Python version: 3.6.8
psutil version: 5.9.8
  >> Hostname will be determined by server from API key (secure mode)

[2024-11-06 15:00:00] Collected metrics:
  CPU: 15.2%
  Memory: 42.3%
  Network: UP 5.2 KB/s | DOWN 12.8 KB/s
  [OK] Metrics sent successfully
```

**All ASCII - No Unicode errors!** ✅

---

## Verification

```bash
# Check service is running
sudo systemctl status monitoring-agent

# Should show:
# Active: active (running)

# View logs
sudo journalctl -u monitoring-agent -f

# Should NOT see UnicodeEncodeError
# Should see: [OK] Metrics sent successfully
```

---

## Locale Information

### Check Current Locale

```bash
locale
```

**Typical CentOS 7 output:**
```
LANG=en_US.UTF-8
LC_CTYPE="en_US.UTF-8"
LC_NUMERIC="en_US.UTF-8"
...
```

### Set UTF-8 Locale (Optional)

```bash
# Export UTF-8 locale
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Make permanent (add to /etc/environment)
sudo bash -c 'echo "LANG=en_US.UTF-8" >> /etc/environment'
sudo bash -c 'echo "LC_ALL=en_US.UTF-8" >> /etc/environment'
```

**Note:** Agent sudah fix untuk ASCII, tidak perlu ubah locale.

---

## Alternative: Force UTF-8 in Service File

Jika ingin tetap gunakan Unicode characters, tambahkan environment variable:

```ini
[Service]
...
Environment="PYTHONIOENCODING=utf-8"
ExecStart=/usr/bin/python3 /opt/monitoring-agent/monitor_agent.py ...
```

**Tapi lebih baik gunakan ASCII** (compatible dengan semua sistem).

---

## Files Changed

- ✏️ `monitor_agent.py` - All Unicode replaced with ASCII
- ✨ `update-agent.sh` - Quick update script

---

## Quick Commands

```bash
# Stop agent
sudo systemctl stop monitoring-agent

# Update agent file
sudo cp /tmp/monitor_agent.py /opt/monitoring-agent/

# Start agent
sudo systemctl start monitoring-agent

# Check logs
sudo journalctl -u monitoring-agent -f
```

---

**Fixed and ready for CentOS 7!** 🚀

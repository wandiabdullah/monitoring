# 🔄 Agent Update Summary - Key Mapping Support

## 📋 Overview

Agent telah diupdate untuk mendukung fitur **Key Mapping** yang meningkatkan keamanan dengan memetakan API key ke hostname tertentu di server.

---

## ✅ Perubahan yang Dilakukan

### 1. **File: `monitor_agent.py`**

#### ✨ New Features:

**a) Parameter `use_key_mapping`:**
```python
def __init__(self, server_url, api_key, hostname=None, interval=5, use_key_mapping=True):
    self.use_key_mapping = use_key_mapping
```

**b) System Information Collection:**
```python
def get_system_info(self) -> Dict[str, Any]:
    """Collect OS, kernel, architecture, uptime"""
    return {
        'os': platform.system(),
        'os_version': platform.version(),
        'kernel': platform.release(),
        'architecture': platform.machine(),
        'hostname': socket.gethostname(),
        'boot_time': boot_time.strftime('%Y-%m-%d %H:%M:%S'),
        'uptime': uptime_str
    }
```

**c) Smart Metrics Sending:**
```python
def send_metrics(self, metrics):
    if self.use_key_mapping:
        # Don't send hostname, server will determine from API key
        metrics_to_send = {k: v for k, v in metrics.items() if k != 'hostname'}
    else:
        # Send hostname from agent
        metrics_to_send = metrics
```

**d) New Command Line Argument:**
```python
parser.add_argument('--no-key-mapping', action='store_true',
                   help='Disable key mapping (send local hostname)')
```

---

### 2. **File: `README.md`**

#### 📚 Updated Documentation:

- ✅ Penjelasan lengkap tentang Key Mapping
- ✅ Perbedaan mode Enabled vs Disabled
- ✅ Contoh penggunaan untuk kedua mode
- ✅ Best practices untuk production dan development
- ✅ Output examples dengan status key mapping

**Sections Added:**
```markdown
## 🔐 Apa itu Key Mapping?

### ✅ Key Mapping Enabled (Secure Mode - RECOMMENDED)
### ❌ Key Mapping Disabled (Flexible Mode)

## Usage Examples:
  - Mode 1: Key Mapping Enabled
  - Mode 2: Key Mapping Disabled
```

---

### 3. **File: `install.sh`**

#### 🔧 Enhanced Installation:

**Interactive Key Mapping Selection:**
```bash
echo "🔐 Key Mapping Configuration:"
echo "  ✅ Enabled: Hostname from server (secure)"
echo "  ❌ Disabled: Agent sends hostname (flexible)"
read -p "Enable Key Mapping? [Y/n]: " USE_KEY_MAPPING

if [[ "$USE_KEY_MAPPING" =~ ^[Nn]$ ]]; then
    EXEC_CMD="$EXEC_CMD --no-key-mapping"
    read -p "Enter Hostname: " HOSTNAME
fi
```

**Enhanced Configuration Summary:**
```bash
if [[ "$USE_KEY_MAPPING" =~ ^[Nn]$ ]]; then
    echo "Key Mapping: ❌ Disabled"
    echo "Hostname: ${HOSTNAME:-auto-detect}"
else
    echo "Key Mapping: ✅ Enabled (hostname from server)"
fi
```

---

### 4. **File: `KEY_MAPPING_GUIDE.md`** (NEW)

#### 📖 Comprehensive Security Guide:

**Content:**
- 🔒 Cara kerja Key Mapping (dengan diagram)
- 📋 Kapan menggunakan mode apa
- 🛠️ Setup guide untuk dashboard
- 🔍 Troubleshooting common issues
- 📊 Monitoring dan audit
- 🔐 Security best practices
- 🚀 Quick start examples
- 📊 Comparison table

---

## 🎯 Use Cases

### ✅ **Production Environment (Key Mapping Enabled)**

```bash
# Setup di Dashboard:
Add Host: prod-web-01
Enable Key Mapping: ✅ YES
Copy API Key: xR9kL3mP8qW2vN7j...

# Install Agent:
python3 monitor_agent.py \
  --server https://monitoring.company.com \
  --api-key "xR9kL3mP8qW2vN7j..."

# Result:
✅ Hostname = "prod-web-01" (dari server)
✅ Secure (tidak bisa di-spoof)
✅ Audit-friendly
```

---

### ❌ **Development Environment (Key Mapping Disabled)**

```bash
# Setup di Dashboard:
Add Host: dev-shared-key
Enable Key Mapping: ❌ NO
Copy API Key: dev-shared-123...

# Install Agent:
python3 monitor_agent.py \
  --server http://localhost:5000 \
  --api-key "dev-shared-123..." \
  --hostname "dev-$(hostname)" \
  --no-key-mapping

# Result:
✅ Hostname = "dev-mypc" (dari agent)
✅ Flexible untuk testing
✅ Bisa override hostname
```

---

## 📊 Feature Comparison

| Feature | Before | After |
|---------|--------|-------|
| **Security** | Basic API key | API key + Key Mapping |
| **Hostname Source** | Always from agent | Configurable (server/agent) |
| **Spoofing Protection** | ❌ No | ✅ Yes (with mapping) |
| **Flexibility** | 🟢 High | 🟢 High (with --no-key-mapping) |
| **System Info** | ❌ No | ✅ Yes (OS, kernel, uptime) |
| **Production Ready** | 🟡 Medium | 🟢 High |

---

## 🔄 Migration Guide

### Existing Agents (Before Update):

**Old Command:**
```bash
python3 monitor_agent.py \
  --server http://monitoring:5000 \
  --api-key "abc123"
```

**Behavior:**
- Agent mengirim hostname sendiri
- Server menerima hostname dari agent

---

### After Update (Backward Compatible):

**Option 1: Enable Key Mapping (Recommended)**
```bash
# Update host di dashboard: Enable Key Mapping
# Update agent command (sama, default sudah key mapping):
python3 monitor_agent.py \
  --server http://monitoring:5000 \
  --api-key "abc123"

# Result: Hostname dari server (secure)
```

**Option 2: Keep Old Behavior**
```bash
# Tetap kirim hostname dari agent:
python3 monitor_agent.py \
  --server http://monitoring:5000 \
  --api-key "abc123" \
  --no-key-mapping

# Result: Hostname dari agent (seperti sebelumnya)
```

---

## 🧪 Testing

### Test Key Mapping Enabled:

```bash
# 1. Add host "test-server" dengan key mapping enabled
# 2. Run agent:
python3 monitor_agent.py -s http://localhost:5000 -k "YOUR_KEY"

# Expected Output:
Starting monitoring agent for test-server
Key mapping enabled: True
  → Hostname will be determined by server from API key (secure mode)

[2024-11-06 10:30:15] Collected metrics:
  CPU: 23.5%
  Memory: 45.2%
  ✓ Metrics sent successfully
```

---

### Test Key Mapping Disabled:

```bash
# 1. Add host dengan key mapping disabled
# 2. Run agent:
python3 monitor_agent.py -s http://localhost:5000 -k "YOUR_KEY" --no-key-mapping -n custom-host

# Expected Output:
Starting monitoring agent for custom-host
Key mapping enabled: False
  → Using local hostname: custom-host

[2024-11-06 10:30:15] Collected metrics:
  CPU: 23.5%
  Memory: 45.2%
  ✓ Metrics sent successfully
```

---

## 📝 Files Modified

```
agent/
├── monitor_agent.py          ✏️  Updated with key mapping support
├── README.md                 ✏️  Updated documentation
├── install.sh                ✏️  Interactive key mapping setup
├── KEY_MAPPING_GUIDE.md      ✨  NEW - Comprehensive guide
└── requirements.txt          ✓  No changes needed
```

---

## 🚀 Deployment

### For New Servers:

```bash
# 1. Copy agent files to server
scp -r agent/ user@server:/tmp/

# 2. SSH to server
ssh user@server

# 3. Run interactive install
cd /tmp/agent
sudo chmod +x install.sh
sudo ./install.sh

# 4. Follow prompts:
Enter API Key: <paste from dashboard>
Monitoring Server URL: http://monitoring:5000
Enable Key Mapping? [Y/n]: Y  (recommended)
Collection interval: 5

# 5. Start service
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
```

---

### For Existing Servers:

```bash
# 1. Update agent files
cd /opt/monitoring-agent
sudo cp /tmp/agent/monitor_agent.py .

# 2. Update systemd service (if needed)
sudo nano /etc/systemd/system/monitoring-agent.service

# Add --no-key-mapping if you want old behavior
# Or keep as-is for secure mode

# 3. Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart monitoring-agent
```

---

## 🔍 Verification

### Check Agent Status:

```bash
# Service status
sudo systemctl status monitoring-agent

# Live logs
sudo journalctl -u monitoring-agent -f

# Should see:
# "Key mapping enabled: True" (secure mode)
# OR
# "Key mapping enabled: False" (flexible mode)
```

---

### Check Dashboard:

1. Login to dashboard
2. Go to **All Hosts**
3. Find your server
4. Check:
   - ✅ **Last Seen**: Should be recent (< 10 seconds)
   - ✅ **Status**: Online (green)
   - ✅ **Key Mapping Badge**: Shows enabled/disabled status

---

## 📞 Support

### Common Issues:

**1. "Invalid API key"**
```bash
# Solution: Regenerate API key di dashboard
# Update /etc/systemd/system/monitoring-agent.service
# Restart service
```

**2. "Metrics not showing"**
```bash
# Check logs: journalctl -u monitoring-agent -f
# Verify server URL: curl -I http://monitoring:5000
# Check API key: cat /etc/systemd/system/monitoring-agent.service
```

**3. "Hostname mismatch"**
```bash
# If key mapping enabled: Don't use --hostname flag
# If key mapping disabled: Use --no-key-mapping flag
```

---

## 🎉 Benefits

### Security Improvements:
- ✅ **Spoofing Protection**: API key memastikan hostname tidak bisa dipalsukan
- ✅ **Audit Trail**: Jelas siapa yang mengirim data berdasarkan API key
- ✅ **Centralized Control**: Hostname dikelola di server

### Operational Benefits:
- ✅ **Flexibility**: Support untuk dynamic environments
- ✅ **Backward Compatible**: Existing agents tetap jalan
- ✅ **Easy Migration**: Smooth transition path

### Monitoring Enhancements:
- ✅ **System Info**: OS, kernel, architecture, uptime
- ✅ **Better Visibility**: Status key mapping di dashboard
- ✅ **Comprehensive Docs**: Detailed guides and examples

---

**Ready to Deploy! 🚀**

Untuk pertanyaan lebih lanjut, lihat:
- `README.md` - Basic usage
- `KEY_MAPPING_GUIDE.md` - Security guide
- `install.sh` - Automated setup


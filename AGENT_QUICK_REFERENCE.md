# 🚀 Agent Quick Reference Card

## 📦 Installation

### One-Line Install (Recommended):
```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/monitoring/main/agent/install.sh | sudo bash
```

### Manual Install:
```bash
git clone https://github.com/your-repo/monitoring.git
cd monitoring/agent
sudo chmod +x install.sh
sudo ./install.sh
```

---

## 🔑 Quick Commands

### Start/Stop Service:
```bash
sudo systemctl start monitoring-agent    # Start
sudo systemctl stop monitoring-agent     # Stop
sudo systemctl restart monitoring-agent  # Restart
sudo systemctl status monitoring-agent   # Status
```

### View Logs:
```bash
sudo journalctl -u monitoring-agent -f           # Follow logs
sudo journalctl -u monitoring-agent --since today  # Today's logs
sudo journalctl -u monitoring-agent -n 100       # Last 100 lines
```

---

## 🎯 Usage Examples

### ✅ Secure Mode (Production - Key Mapping Enabled):
```bash
python3 monitor_agent.py \
  --server https://monitoring.company.com \
  --api-key "xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG"
```
**→ Hostname dari server (secure)**

---

### ❌ Flexible Mode (Development - Key Mapping Disabled):
```bash
# Auto-detect hostname
python3 monitor_agent.py \
  --server http://localhost:5000 \
  --api-key "dev-shared-key-123" \
  --no-key-mapping

# Custom hostname
python3 monitor_agent.py \
  --server http://localhost:5000 \
  --api-key "dev-shared-key-123" \
  --hostname "my-server" \
  --no-key-mapping
```
**→ Hostname dari agent (flexible)**

---

## 🛠️ Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--server` | `-s` | Monitoring server URL | Required |
| `--api-key` | `-k` | API key (from dashboard) | Required |
| `--hostname` | `-n` | Custom hostname | auto-detect |
| `--interval` | `-i` | Collection interval (sec) | 5 |
| `--no-key-mapping` | - | Disable key mapping | false |

---

## 📊 Configuration Files

### Systemd Service:
```bash
/etc/systemd/system/monitoring-agent.service
```

### Agent Location:
```bash
/opt/monitoring-agent/monitor_agent.py
/opt/monitoring-agent/requirements.txt
```

### Edit Configuration:
```bash
sudo nano /etc/systemd/system/monitoring-agent.service
sudo systemctl daemon-reload
sudo systemctl restart monitoring-agent
```

---

## 🔧 Common Tasks

### Update API Key:
```bash
# 1. Edit service file
sudo nano /etc/systemd/system/monitoring-agent.service

# 2. Find line: Environment="API_KEY=..."
# 3. Replace with new key

# 4. Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart monitoring-agent
```

---

### Change Server URL:
```bash
# 1. Edit service file
sudo nano /etc/systemd/system/monitoring-agent.service

# 2. Find line: ExecStart=...--server http://...
# 3. Replace server URL

# 4. Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart monitoring-agent
```

---

### Change Interval:
```bash
# 1. Edit service file
sudo nano /etc/systemd/system/monitoring-agent.service

# 2. Find line: ...--interval 5
# 3. Change to desired interval (in seconds)

# 4. Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart monitoring-agent
```

---

### Enable/Disable Key Mapping:
```bash
# 1. Edit service file
sudo nano /etc/systemd/system/monitoring-agent.service

# 2. To DISABLE key mapping, add flag:
ExecStart=...existing command... --no-key-mapping

# 3. To ENABLE key mapping, remove flag:
ExecStart=...existing command...  # (no --no-key-mapping)

# 4. Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart monitoring-agent
```

---

## 🔍 Troubleshooting

### Agent Not Starting:
```bash
# Check status
sudo systemctl status monitoring-agent

# Check logs
sudo journalctl -u monitoring-agent -n 50

# Common issues:
# - Invalid API key
# - Server not reachable
# - Missing Python packages
```

---

### Metrics Not Showing in Dashboard:
```bash
# 1. Check agent is running
sudo systemctl status monitoring-agent

# 2. Check logs for errors
sudo journalctl -u monitoring-agent -f

# 3. Test server connectivity
curl -I http://your-monitoring-server:5000

# 4. Verify API key
grep "API_KEY" /etc/systemd/system/monitoring-agent.service
```

---

### "Invalid API Key" Error:
```bash
# 1. Generate new API key in dashboard
# 2. Update service file
sudo nano /etc/systemd/system/monitoring-agent.service

# 3. Update Environment line:
Environment="API_KEY=NEW_API_KEY_HERE"

# 4. Reload
sudo systemctl daemon-reload
sudo systemctl restart monitoring-agent
```

---

### Hostname Mismatch:
```bash
# If Key Mapping ENABLED:
# - Don't use --hostname flag
# - Remove --hostname from ExecStart line

# If Key Mapping DISABLED:
# - Add --no-key-mapping flag
# - Optionally add --hostname "custom-name"
```

---

## 📈 Performance Tuning

### Low Resource Systems:
```bash
# Increase interval to reduce CPU usage
--interval 30  # Collect every 30 seconds
```

### High-Frequency Monitoring:
```bash
# Decrease interval for more granular data
--interval 1  # Collect every second (high overhead!)
```

### Network Optimization:
```bash
# If server is slow or far away
# Increase timeout in monitor_agent.py:
# Change: timeout=5 to timeout=10
```

---

## 🔐 Security Checklist

- ✅ Use HTTPS for production servers
- ✅ Enable Key Mapping for production
- ✅ Rotate API keys every 90 days
- ✅ One API key per server (production)
- ✅ Use firewall to restrict access
- ✅ Monitor agent logs regularly

---

## 📝 Quick Setup Checklist

### Initial Setup:
- [ ] Login to dashboard as admin
- [ ] Add host in dashboard
- [ ] Enable/disable key mapping as needed
- [ ] Copy API key (only shown once!)
- [ ] Install agent on server
- [ ] Configure with API key
- [ ] Start service
- [ ] Verify in dashboard

### Verification:
- [ ] Agent status: `systemctl status monitoring-agent`
- [ ] Logs: `journalctl -u monitoring-agent -f`
- [ ] Dashboard: Host shows "Online"
- [ ] Metrics: Charts updating
- [ ] Last seen: < 10 seconds

---

## 📞 Help & Resources

### Documentation:
```bash
agent/README.md              # Basic usage
agent/KEY_MAPPING_GUIDE.md   # Security guide
AGENT_UPDATE_SUMMARY.md      # Feature changelog
```

### Test Agent Manually:
```bash
cd /opt/monitoring-agent
python3 monitor_agent.py \
  --server http://your-server:5000 \
  --api-key "your-api-key" \
  --interval 5
```

### Uninstall:
```bash
sudo systemctl stop monitoring-agent
sudo systemctl disable monitoring-agent
sudo rm /etc/systemd/system/monitoring-agent.service
sudo rm -rf /opt/monitoring-agent
sudo systemctl daemon-reload
```

---

## 🎨 Dashboard Integration

### After Agent Running:

1. **Dashboard** → See overview of all hosts
2. **All Hosts** → Click your server
3. **Host Detail** → View real-time metrics:
   - CPU usage & history
   - Memory usage & history
   - Disk usage (all partitions)
   - Network I/O
   - System info (OS, kernel, uptime)

---

## 💡 Pro Tips

### Tip 1: Auto-start on Boot
```bash
sudo systemctl enable monitoring-agent
# Agent will start automatically after reboot
```

### Tip 2: Multiple Servers
```bash
# Use same API key for development (key mapping disabled)
# Use different API keys for production (key mapping enabled)
```

### Tip 3: Monitoring the Monitor
```bash
# Set up alert if agent stops sending data
# Dashboard shows "Last Seen" time
# Alerts if > 1 minute (configurable)
```

### Tip 4: Log Rotation
```bash
# Systemd journald handles rotation automatically
# Configure max size:
sudo nano /etc/systemd/journald.conf
# SystemMaxUse=100M
```

---

**🎉 Happy Monitoring!**

For detailed guides:
- Installation: `agent/README.md`
- Security: `agent/KEY_MAPPING_GUIDE.md`
- Updates: `AGENT_UPDATE_SUMMARY.md`

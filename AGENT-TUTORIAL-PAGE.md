# 📚 AGENT INSTALLATION TUTORIAL PAGE

## ✅ IMPLEMENTED

Halaman tutorial lengkap untuk instalasi monitoring agent telah ditambahkan ke dashboard!

---

## 🎯 FEATURES

### Menu Baru:
- **Agent Installation** - Menu khusus di sidebar bagian "Help"
- Icon: 📖 (fas fa-book)
- Lokasi: Antara "Management" dan "Settings"

### Tutorial Tabs:
1. **Windows** 🪟
   - Download via PowerShell
   - Install Python & dependencies
   - Configure server URL
   - Test agent
   - Run as Windows Service / Task Scheduler

2. **Linux** 🐧
   - Download via wget/curl
   - Install dependencies (Ubuntu/Debian & CentOS/RHEL)
   - Configure agent
   - Create systemd service
   - Enable & start service
   - Check logs with journalctl

3. **Docker** 🐳
   - Dockerfile template
   - Build image
   - Run container with proper network mode
   - Check logs

4. **Python Script** 🐍
   - Requirements
   - Install packages
   - Configure server URL
   - Run in background (Linux/Mac/Windows)

### Additional Sections:
- **Verification Steps** - 3 langkah untuk memverifikasi agent berjalan
- **Troubleshooting** - Solusi untuk masalah umum:
  - Server tidak muncul di dashboard
  - Permission errors
  - Import errors
- **Additional Resources** - Links ke GitHub, API docs, support

---

## 📂 FILES MODIFIED

### 1. `dashboard/dashboard.html`
**Added:**
- Menu item baru: "Agent Installation" (line ~1405)
- Complete tutorial view dengan 4 tabs (line ~2188-2630)
- CSS styles untuk tutorial page (line ~1370-1600+)

**Key Styles:**
```css
.tutorial-container
.tab-navigation
.tab-btn (active state)
.tutorial-tab
.tutorial-step
.step-number (numbered circles)
.code-block (dark theme code snippets)
.copy-btn (copy code button)
.verification-section
.troubleshooting-section
.resource-card
```

### 2. `dashboard/dashboard.js`
**Added:**
- `showAgentTutorialView()` - Function to show tutorial view
- `showTutorialTab(tabName)` - Switch between tutorial tabs
- `copyCode(button)` - Copy code snippets to clipboard
- View switching cases for 'agent-tutorial'
- Window function exports

**Modified Sections:**
- Line ~595: Added 'agent-tutorial' case in menu click handler
- Line ~125: Added 'agent-tutorial' case in restoreLastView()
- Line ~497: Added 'agent-tutorial' case in refreshCurrentView()
- Line ~1630: Added showAgentTutorialView() function
- Line ~2402: Exposed showTutorialTab and copyCode to window

**Cache Version:**
- Updated from `v=20251110016` to `v=20251110017`

---

## 🎨 DESIGN FEATURES

### Visual Elements:
- **Gradient Header** - Purple gradient dengan server URL
- **Tab Navigation** - Icon-based tabs dengan active state
- **Numbered Steps** - Circular step numbers dengan gradient
- **Code Blocks** - Dark theme dengan copy button
- **Copy Button** - Animasi saat berhasil copy
- **Verification Cards** - Numbered checklist cards
- **Troubleshooting Cards** - Yellow warning style
- **Resource Cards** - Hover animation

### Color Scheme:
- Primary: `#667eea` (Purple)
- Secondary: `#764ba2` (Darker purple)
- Success: `#28a745` (Green)
- Code background: `#1e1e1e` (Dark)
- Warning: `#fff3cd` (Light yellow)

### Responsive:
- Mobile-friendly tab navigation
- Responsive code blocks
- Stacked layout for small screens

---

## 🚀 HOW IT WORKS

### 1. User Flow:
```
Click "Agent Installation" menu
  → Shows tutorial view
  → Default tab: Windows
  → User clicks other tabs (Linux/Docker/Python)
  → Reads instructions
  → Copies code snippets
  → Follows step-by-step guide
```

### 2. Tab Switching:
```javascript
showTutorialTab('windows')
  → Hide all .tutorial-tab elements
  → Remove .active from all .tab-btn
  → Show #tutorial-windows
  → Add .active to #tab-windows
```

### 3. Copy Code:
```javascript
copyCode(button)
  → Get code from next sibling (pre/code)
  → Copy to clipboard via navigator.clipboard
  → Change button text to "Copied!"
  → Add .copied class (green background)
  → Restore after 2 seconds
```

### 4. View Persistence:
- Tutorial view saved to localStorage as 'agent-tutorial'
- Restored on page refresh
- Auto-refresh skips tutorial view (static content)

---

## 📋 USAGE EXAMPLES

### For Windows Users:
```powershell
# 1. Download agent
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/wandiabdullah/monitoring/main/agent/agent.py" -OutFile "agent.py"

# 2. Install dependencies
pip install requests psutil

# 3. Run agent
python agent.py
```

### For Linux Users:
```bash
# 1. Download agent
wget https://raw.githubusercontent.com/wandiabdullah/monitoring/main/agent/agent.py

# 2. Install dependencies
sudo apt install python3 python3-pip -y
pip3 install requests psutil

# 3. Create systemd service
sudo nano /etc/systemd/system/monitoring-agent.service

# 4. Enable and start
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
```

### For Docker Users:
```bash
# 1. Build image
docker build -t monitoring-agent .

# 2. Run container
docker run -d \
  --name monitoring-agent \
  --restart unless-stopped \
  --network host \
  monitoring-agent
```

---

## ✨ FEATURES HIGHLIGHT

### 1. Copy-Paste Ready
- All commands can be copied dengan 1 klik
- Pre-formatted untuk terminal
- No need to manually select text

### 2. Platform-Specific
- Separate instructions untuk setiap platform
- OS-specific commands (apt vs yum, PowerShell vs bash)
- Relevant configuration examples

### 3. Complete Guide
- From download to production deployment
- Service/daemon configuration included
- Troubleshooting section untuk common issues

### 4. Visual Feedback
- Copy button changes color saat berhasil
- Active tab clearly marked
- Step numbers untuk easy following

### 5. External Resources
- Link ke GitHub repository
- API documentation reference
- Support contact information

---

## 🔐 SECURITY NOTES

### Server URL Configuration:
```python
SERVER_URL = "https://eyes.indoinfinite.com/api/metrics"
```

- Uses HTTPS for secure transmission
- No authentication required (server validates by IP/hostname)
- Metrics sent every 30 seconds

### Permissions:
- **Windows**: Run as Administrator untuk full metrics
- **Linux**: Run as root atau dengan sudo
- **Docker**: Host network mode untuk accurate network stats

---

## 📊 TUTORIAL SECTIONS

### Windows Tab:
1. Download Agent
2. Install Python
3. Install Dependencies
4. Configure Agent
5. Test Agent
6. Run as Windows Service

### Linux Tab:
1. Download Agent
2. Install Dependencies (Ubuntu & CentOS)
3. Configure Agent
4. Test Agent
5. Create Systemd Service
6. Enable and Start Service
7. Check Logs

### Docker Tab:
1. Create Dockerfile
2. Download Agent
3. Update Server URL
4. Build Docker Image
5. Run Container
6. Check Logs

### Python Script Tab:
1. Requirements
2. Download Agent Script
3. Install Python Packages
4. Configure Server URL
5. Run Agent
6. Run in Background

---

## 🎯 VERIFICATION CHECKLIST

After installation, user can verify:

✅ **Check Dashboard**
- Server muncul di "All Hosts" dalam 30 detik
- Status: Online (green)

✅ **Check Metrics**
- Klik hostname → Lihat charts
- CPU, Memory, Disk, Network data terlihat

✅ **Check Agent Logs**
- Melihat message: "✓ Metrics sent successfully"
- No error messages

---

## 🐛 TROUBLESHOOTING GUIDE

### Problem: Server tidak muncul di dashboard
**Solutions:**
- Check agent is running: `ps aux | grep agent.py`
- Verify SERVER_URL is correct
- Check network connectivity: `curl -I https://eyes.indoinfinite.com`
- Check firewall allows outbound HTTPS (port 443)

### Problem: Permission errors
**Solutions:**
- Run agent dengan appropriate permissions
- Linux: `sudo python3 agent.py`
- Windows: Run PowerShell as Administrator

### Problem: Import errors
**Solutions:**
- Verify dependencies: `pip list | grep -E "requests|psutil"`
- Reinstall: `pip install --upgrade requests psutil`
- Check Python version: `python --version` (should be 3.8+)

---

## 📚 DOCUMENTATION STRUCTURE

```
Agent Installation Tutorial
├── Quick Start Card (Server URL)
├── Tab Navigation
│   ├── Windows
│   ├── Linux
│   ├── Docker
│   └── Python Script
├── Each Tab Contains:
│   ├── Numbered Steps
│   ├── Code Blocks with Copy Button
│   ├── Explanations
│   └── Platform-specific Notes
├── Verification Section
│   └── 3 Steps to Verify Success
├── Troubleshooting Section
│   └── Common Problems & Solutions
└── Additional Resources
    ├── GitHub Repository
    ├── API Documentation
    └── Support Contact
```

---

## 🎉 BENEFITS

### For Users:
✅ Self-service agent installation
✅ No need to contact support
✅ Multiple platform options
✅ Copy-paste ready commands
✅ Troubleshooting guide included

### For Admins:
✅ Reduced support tickets
✅ Standardized installation process
✅ Documentation always up-to-date
✅ Easy to maintain (single HTML page)

### For System:
✅ Consistent agent configuration
✅ Proper service/daemon setup
✅ Auto-restart on failure
✅ Correct network mode (Docker)

---

## 📞 NEXT STEPS

### To Access Tutorial:
1. Login to dashboard: https://eyes.indoinfinite.com
2. Click **"Agent Installation"** in sidebar (Help section)
3. Choose your platform tab (Windows/Linux/Docker/Python)
4. Follow step-by-step instructions
5. Copy commands with copy button
6. Verify installation dengan checklist

### To Update Tutorial:
1. Edit `dashboard/dashboard.html` (tutorial content section)
2. Modify code snippets atau instructions
3. Update cache version: `v=20251110017` → `v=20251110018`
4. Restart container: `docker-compose -f docker-compose.ssl.yml restart monitoring-backend`

---

## ✅ TESTING CHECKLIST

- [x] Menu "Agent Installation" terlihat di sidebar
- [x] Click menu → Shows tutorial view
- [x] 4 tabs (Windows, Linux, Docker, Python) visible
- [x] Tab switching works (click tab → content changes)
- [x] Copy button works (click → code copied to clipboard)
- [x] Copy button shows "Copied!" feedback
- [x] Code blocks scrollable horizontally
- [x] View persistence (refresh → stays on tutorial page)
- [x] Responsive design (mobile friendly)
- [x] External links work (GitHub, support)

---

## 🚀 STATUS

**COMPLETED** ✅

Tutorial page fully functional dan ready untuk digunakan!

**Cache Version:** `v=20251110017`

**Ready to Use:**
- Restart monitoring container
- Clear browser cache (Ctrl+Shift+R)
- Click "Agent Installation" menu
- Start guiding users!

---

**Next Enhancement Ideas:**
- [ ] Add video tutorial links
- [ ] Add screenshot examples
- [ ] Add FAQ section
- [ ] Add agent version check/update instructions
- [ ] Add uninstall instructions
- [ ] Add migration guide (from old agent to new)
- [ ] Add monitoring multiple servers dari single agent
- [ ] Add custom metrics configuration

---

**Documentation Generated:** November 10, 2025
**Version:** 1.0.0
**Status:** Production Ready ✅

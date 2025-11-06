# 📚 Documentation Index

Panduan lengkap untuk sistem monitoring server Linux.

## 🚀 Getting Started

Mulai dari sini jika Anda baru menggunakan sistem ini:

1. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** ⭐ START HERE
   - Overview sistem
   - Fitur utama
   - Quick start 3 langkah
   - Requirements

2. **[QUICKSTART.md](QUICKSTART.md)** 
   - Setup dalam 5 menit
   - Testing lokal
   - Production setup
   - Common commands

3. **[INSTALLATION.md](INSTALLATION.md)**
   - Step-by-step installation
   - Multiple deployment scenarios
   - Troubleshooting
   - Verification checklist

## 📖 Documentation

### Main Documentation

**[README.md](README.md)** - Dokumentasi utama lengkap
- Fitur lengkap
- Struktur project
- Instalasi detail
- API endpoints
- Configuration
- Troubleshooting

### Architecture & Design

**[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- System overview
- Data flow
- Component communication
- API specification
- Storage options
- Security considerations
- Scalability

**[VISUAL_GUIDE.md](VISUAL_GUIDE.md)** - Visual diagrams
- System flow diagram
- Data flow
- Component details
- User journey
- Security layers
- Scaling strategy

### Configuration & Examples

**[CONFIG_EXAMPLES.md](CONFIG_EXAMPLES.md)** - Configuration samples
- Environment variables
- Systemd services
- Nginx reverse proxy
- Alert thresholds
- Database configuration
- Security setup
- Logging

## 🔧 Component Documentation

### Agent (Linux Monitoring)

**[agent/README.md](agent/README.md)**
- Installation guide
- Usage examples
- Data collected
- Systemd setup
- Troubleshooting

**Files:**
- `agent/monitor_agent.py` - Main agent script
- `agent/install.sh` - Auto installer
- `agent/requirements.txt` - Dependencies

### Backend (API Server)

**Files:**
- `backend/app.py` - Flask application
- `backend/requirements.txt` - Dependencies

**API Documentation:** See [README.md](README.md#api-endpoints)

### Dashboard (Web UI)

**Files:**
- `dashboard/index.html` - Dashboard UI
- `dashboard/app.js` - Dashboard logic

## 🛠️ Tools & Utilities

**[test_agent.py](test_agent.py)** - Test tool
- Generate fake metrics
- Test dashboard without Linux
- Development & demo

**Start Scripts:**
- `start_backend.sh` - Linux/Mac
- `start_backend.bat` - Windows

## 📊 Quick Reference

### Installation Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py

# Agent
cd agent
sudo pip3 install -r requirements.txt
sudo python3 monitor_agent.py --server http://SERVER:5000

# Test
python test_agent.py --server http://localhost:5000
```

### API Endpoints

```
GET  /                                    # Dashboard
GET  /api/health                          # Health check
POST /api/metrics                         # Receive metrics
GET  /api/servers                         # List servers
GET  /api/servers/<hostname>/current      # Current metrics
GET  /api/servers/<hostname>/history      # Historical data
GET  /api/servers/<hostname>/stats        # Statistics
GET  /api/servers/<hostname>/disk         # Disk info
GET  /api/servers/<hostname>/network      # Network I/O
```

### Default Ports & URLs

- **Backend**: http://localhost:5000
- **Dashboard**: http://localhost:5000
- **Agent sends to**: http://BACKEND_IP:5000/api/metrics

### Key Files

```
monitoring/
├── agent/monitor_agent.py      # Agent script
├── backend/app.py              # Backend server
├── dashboard/index.html        # Dashboard UI
├── dashboard/app.js            # Dashboard logic
└── test_agent.py               # Test tool
```

## 📋 Documentation by Use Case

### For First-Time Users
1. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Overview
2. [QUICKSTART.md](QUICKSTART.md) - Quick setup
3. [INSTALLATION.md](INSTALLATION.md) - Detailed install

### For Developers
1. [ARCHITECTURE.md](ARCHITECTURE.md) - System design
2. [VISUAL_GUIDE.md](VISUAL_GUIDE.md) - Visual diagrams
3. [README.md](README.md) - API reference

### For System Administrators
1. [INSTALLATION.md](INSTALLATION.md) - Deployment
2. [CONFIG_EXAMPLES.md](CONFIG_EXAMPLES.md) - Configuration
3. [agent/README.md](agent/README.md) - Agent setup

### For Production Deployment
1. [INSTALLATION.md](INSTALLATION.md) - Production scenario
2. [CONFIG_EXAMPLES.md](CONFIG_EXAMPLES.md) - Nginx, SSL, etc.
3. [ARCHITECTURE.md](ARCHITECTURE.md) - Security & scaling

## 🎯 Common Tasks

### Initial Setup
→ [QUICKSTART.md](QUICKSTART.md)

### Add New Server
→ [agent/README.md](agent/README.md)

### Configure Alerts
→ [CONFIG_EXAMPLES.md](CONFIG_EXAMPLES.md#custom-alert-thresholds)

### Setup Database
→ [CONFIG_EXAMPLES.md](CONFIG_EXAMPLES.md#database-configuration-postgresql-example)

### Enable HTTPS
→ [CONFIG_EXAMPLES.md](CONFIG_EXAMPLES.md#httpssl-setup)

### Troubleshooting
→ [INSTALLATION.md](INSTALLATION.md#common-issues--solutions)

### Add Custom Metrics
→ [ARCHITECTURE.md](ARCHITECTURE.md#customization-points)

## 📞 Support & Help

### Getting Help

1. **Quick issues**: Check [INSTALLATION.md - Troubleshooting](INSTALLATION.md#common-issues--solutions)
2. **Configuration**: See [CONFIG_EXAMPLES.md](CONFIG_EXAMPLES.md)
3. **Understanding system**: Read [ARCHITECTURE.md](ARCHITECTURE.md)
4. **Visual learner**: See [VISUAL_GUIDE.md](VISUAL_GUIDE.md)

### Debugging

```bash
# Check backend
curl http://localhost:5000/api/health

# Check agent logs
sudo journalctl -u monitoring-agent -f

# Test agent manually
python3 monitor_agent.py --server http://SERVER:5000
```

## 🎓 Learning Path

### Beginner
1. Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
2. Follow [QUICKSTART.md](QUICKSTART.md)
3. Test with [test_agent.py](test_agent.py)

### Intermediate
1. Deploy using [INSTALLATION.md](INSTALLATION.md)
2. Customize with [CONFIG_EXAMPLES.md](CONFIG_EXAMPLES.md)
3. Understand [ARCHITECTURE.md](ARCHITECTURE.md)

### Advanced
1. Study [ARCHITECTURE.md](ARCHITECTURE.md) - Scaling
2. Implement custom features
3. Contribute improvements

## 📦 Project Files Summary

### Documentation (9 files)
- README.md - Main documentation
- QUICKSTART.md - Quick start guide
- INSTALLATION.md - Installation guide
- ARCHITECTURE.md - System architecture
- CONFIG_EXAMPLES.md - Configuration examples
- PROJECT_SUMMARY.md - Project overview
- PROJECT_COMPLETE.md - Completion summary
- VISUAL_GUIDE.md - Visual diagrams
- DOC_INDEX.md - This file

### Agent (4 files)
- agent/monitor_agent.py
- agent/install.sh
- agent/requirements.txt
- agent/README.md

### Backend (2 files)
- backend/app.py
- backend/requirements.txt

### Dashboard (2 files)
- dashboard/index.html
- dashboard/app.js

### Utilities (5 files)
- test_agent.py
- start_backend.sh
- start_backend.bat
- requirements.txt
- .gitignore

**Total: 22 files**

## 🔄 Update History

This documentation is current as of: **November 6, 2025**

### Version 1.0
- ✅ Complete monitoring system
- ✅ Full documentation
- ✅ Agent, Backend, Dashboard
- ✅ Installation scripts
- ✅ Test tools

---

## 🎉 Ready to Start!

**Recommended starting point for new users:**

👉 **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Start here!

Then follow:
1. [QUICKSTART.md](QUICKSTART.md) - Setup in 5 minutes
2. [INSTALLATION.md](INSTALLATION.md) - Full deployment guide

**Happy Monitoring! 🚀**

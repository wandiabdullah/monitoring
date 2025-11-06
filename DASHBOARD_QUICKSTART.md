# Quick Start - New Dashboard with Groups & Key Mapping

## 🚀 5-Minute Setup

### 1. Start Backend (Docker)

```bash
cd monitoring
docker-compose -f docker-compose.host.yml up -d
```

### 2. Access Dashboard

Open browser: `http://localhost` or `http://your-server-ip`

**Login credentials:**
```
Username: admin
Password: admin123
```

### 3. Create Your First Group

1. Click **"Add Group"** in sidebar
2. Fill in:
   - **Name**: Production Servers
   - **Icon**: fa-server
   - **Description**: Production environment
3. Click **"Create Group"**

### 4. Add Your First Host

1. Click **"Add Host"** in header
2. Fill in:
   - **Hostname**: web-server-01
   - **IP Address**: 192.168.1.100 (optional)
   - **Group**: Production Servers
   - **Description**: Production web server
   - ✅ **Enable Key Mapping**: Checked (recommended)
3. Click **"Add Host"**
4. **COPY THE API KEY** - You won't see it again!

### 5. Install Agent on Linux Server

SSH to your Linux server:

```bash
# Download agent
wget http://monitoring-server:5000/static/monitor_agent.py
wget http://monitoring-server:5000/static/requirements.txt

# Install dependencies
pip3 install -r requirements.txt

# Run agent with API key
python3 monitor_agent.py \
  --server http://monitoring-server:5000 \
  --api-key "YOUR_API_KEY_FROM_STEP_4" \
  --interval 5
```

### 6. Verify Host is Online

1. Go back to dashboard
2. Expand "Production Servers" group
3. Look for **green pulsing dot** next to web-server-01
4. Click on host card to see detailed metrics

**Done!** 🎉 Your first server is being monitored!

---

## 📊 Dashboard Tour

### Sidebar Menu

**Main Navigation:**
- 🏠 **Dashboard** - Overview with stats
- 🖥️ **All Hosts** - List view (future)
- 📁 **Groups** - Manage groups (future)

**Management:**
- ➕ **Add Host** - Quick add modal
- 📂 **Add Group** - Create new group

**User:**
- ⚙️ **Settings** - Configuration (future)
- 🚪 **Logout** - Sign out

### Statistics Cards

Top of dashboard shows:
- **Total Hosts**: All registered servers
- **Online**: Currently active (green)
- **Offline**: Not sending data (red)
- **Groups**: Total number of groups

### Group View

Each group card shows:
- **Group Icon & Name**
- **Host Count** and **Online Count**
- **Click header** to expand/collapse
- **Host cards** with live metrics

### Host Card

Each host displays:
- **Hostname** (bold)
- **Status Dot** (green = online, red = offline, pulsing)
- **IP Address** (if set)
- **Description**
- **CPU Usage** (real-time %)
- **Memory Usage** (real-time %)
- **Click card** for detailed view

---

## 🎯 Common Tasks

### Create a New Group

**Via Dashboard:**
1. Sidebar → **Add Group**
2. Name: `Database Servers`
3. Icon: `fa-database`
4. Description: `All database servers`
5. Click **Create Group**

**Via API:**
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -b "session_cookie" \
  -d '{
    "name": "Database Servers",
    "icon": "fa-database",
    "description": "All database servers"
  }'
```

### Add Host to Group

1. Click **Add Host**
2. **Hostname**: `db-master-01`
3. **IP**: `192.168.1.50`
4. **Group**: Select "Database Servers"
5. **Description**: `PostgreSQL Master`
6. ✅ **Key Mapping**: Enabled
7. Click **Add Host**
8. **Copy API Key!**

### Move Host Between Groups

Via API:
```bash
curl -X PUT http://localhost:5000/api/hosts/1 \
  -H "Content-Type: application/json" \
  -d '{"group_id": 2}'
```

### Setup Agent as Service

```bash
# Create service file
sudo nano /etc/systemd/system/monitoring-agent.service

# Paste:
[Unit]
Description=Server Monitoring Agent
After=network.target

[Service]
Type=simple
Environment="API_KEY=your-api-key-here"
ExecStart=/usr/bin/python3 /opt/monitoring/monitor_agent.py \
  --server http://monitoring-server:5000 \
  --api-key ${API_KEY}
Restart=always

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
sudo systemctl status monitoring-agent
```

---

## 🔒 Security Features

### Key Mapping (Recommended)

**What it does:**
- Locks API key to specific hostname
- Prevents key sharing between servers
- Hostname cannot be spoofed

**Example:**
```
Key "ABC123" → ONLY works for "web-server-01"
Key "XYZ789" → ONLY works for "web-server-02"
```

**Benefits:**
- ✅ Stolen key only affects 1 server
- ✅ Perfect for multi-tenant environments
- ✅ Better audit trail
- ✅ Compliance ready

### When to Enable?

**Always enable UNLESS:**
- You need multiple agents with same key (not recommended)
- Testing/development only
- Legacy compatibility required

**Default:** ✅ **Enabled** (recommended)

---

## 🗂️ Grouping Strategies

### 1. By Environment

```
Production
├── web-prod-01
├── api-prod-01
└── db-prod-01

Staging
├── web-staging-01
└── db-staging-01

Development
└── dev-server-01
```

### 2. By Function

```
Web Servers
├── nginx-01
├── nginx-02
└── apache-01

Database Servers
├── postgres-master
├── postgres-replica
└── mysql-01

Cache Servers
├── redis-01
└── memcached-01
```

### 3. By Location

```
US-East
├── web-us-east-01
└── db-us-east-01

EU-West
├── web-eu-west-01
└── db-eu-west-01

Asia-Pacific
├── web-ap-01
└── db-ap-01
```

### 4. By Customer (Multi-tenant)

```
Customer A
├── web-a-01
├── web-a-02
└── db-a-01

Customer B
├── web-b-01
└── db-b-01

Internal
├── monitoring
└── backup-server
```

---

## 🎨 Available Icons

Choose from Font Awesome icons:

**Common:**
- `fa-server` - Generic Server
- `fa-database` - Database
- `fa-cloud` - Cloud
- `fa-network-wired` - Network
- `fa-desktop` - Desktop
- `fa-hdd` - Storage
- `fa-code` - Development
- `fa-lock` - Security
- `fa-shield-alt` - Firewall
- `fa-globe` - Web

**Use icon name without `fa-` prefix in icon picker.**

---

## 📱 Mobile Access

Dashboard is fully responsive:

**Desktop (>1024px):**
- Full sidebar visible
- Grid layout for host cards
- 3-4 cards per row

**Tablet (768px-1024px):**
- Collapsible sidebar
- 2-3 cards per row
- Touch-friendly

**Mobile (<768px):**
- Hidden sidebar (toggle button)
- 1 card per row
- Optimized for touch

---

## 🔧 API Quick Reference

### Authentication
```bash
# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Groups
```bash
# List groups
GET /api/groups

# Create group
POST /api/groups
{"name":"Production","icon":"fa-server"}

# Delete group
DELETE /api/groups/{id}
```

### Hosts
```bash
# List hosts
GET /api/hosts

# Add host with group & key mapping
POST /api/hosts
{
  "hostname":"web-01",
  "group_id":1,
  "enable_key_mapping":true
}

# Update host group
PUT /api/hosts/{id}
{"group_id":2}
```

---

## 🐛 Troubleshooting

### Host shows offline

**Check:**
1. Agent is running: `systemctl status monitoring-agent`
2. Network connectivity: `ping monitoring-server`
3. API key is correct
4. Check agent logs: `journalctl -u monitoring-agent -f`

### Can't see new group

**Solution:**
1. Refresh page (F5)
2. Clear browser cache
3. Check browser console for errors
4. Verify group created: `curl http://localhost:5000/api/groups`

### API key not working

**Check:**
1. Key is correct (no extra spaces)
2. Host is active: `SELECT * FROM hosts WHERE hostname='your-host';`
3. Key mapping matches hostname
4. Regenerate if needed

### Groups not loading

**Fix:**
```bash
# Check database
sqlite3 data/monitoring.db "SELECT * FROM groups;"

# Create default group
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -d '{"name":"Default","icon":"fa-server"}'
```

---

## 📚 Learn More

- **Full Features**: [DASHBOARD_FEATURES.md](docs/DASHBOARD_FEATURES.md)
- **Authentication**: [AUTHENTICATION.md](docs/AUTHENTICATION.md)
- **Docker Setup**: [DOCKER.md](docs/DOCKER.md)
- **Quick Reference**: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

---

## 🎉 What's Next?

After basic setup:

1. **Add More Hosts**: Scale to dozens/hundreds
2. **Create Groups**: Organize by your needs
3. **Setup Alerts**: (Coming soon)
4. **Configure Users**: Add team members
5. **Enable HTTPS**: Secure your dashboard
6. **Auto-backups**: Protect your data

**Need Help?** Check the documentation or raise an issue!

---

**Dashboard URL**: `http://your-server:5000`  
**Old Dashboard**: `http://your-server:5000/old-dashboard`  
**API Docs**: `http://your-server:5000/api`

Happy Monitoring! 📊✨

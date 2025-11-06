# Quick Reference - Authentication & Host Management

## Login Credentials

**Default Admin:**
```
Username: admin
Password: admin123
```

## Agent Installation with API Key

### 1. Add Host di Dashboard
1. Login sebagai admin
2. Add new host
3. Copy API key yang ditampilkan

### 2. Install Agent

**Manual Run:**
```bash
python3 monitor_agent.py \
  --server http://monitoring-server:5000 \
  --api-key "YOUR_API_KEY_HERE" \
  --interval 5
```

**Systemd Service:**
```bash
# Edit /etc/systemd/system/monitoring-agent.service
sudo nano /etc/systemd/system/monitoring-agent.service

# Paste:
[Unit]
Description=Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=monitoring
Environment="API_KEY=YOUR_API_KEY_HERE"
ExecStart=/usr/bin/python3 /opt/monitoring/monitor_agent.py \
  --server http://monitoring-server:5000 \
  --api-key ${API_KEY} \
  --interval 5
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable & start
sudo systemctl daemon-reload
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
```

## API Endpoints Quick Reference

### Authentication
```bash
# Login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Logout
curl -X POST http://localhost:5000/api/logout

# Get current user
curl http://localhost:5000/api/current-user
```

### Host Management
```bash
# List all hosts
curl http://localhost:5000/api/hosts

# Add host
curl -X POST http://localhost:5000/api/hosts \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "web-server-01",
    "ip_address": "192.168.1.100",
    "description": "Production Web Server"
  }'

# Update host
curl -X PUT http://localhost:5000/api/hosts/1 \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'

# Delete host
curl -X DELETE http://localhost:5000/api/hosts/1

# Regenerate API key
curl -X POST http://localhost:5000/api/hosts/1/regenerate-key
```

### Send Metrics (from agent)
```bash
curl -X POST http://localhost:5000/api/metrics \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "timestamp": "2024-01-15T10:30:00",
    "cpu": {...},
    "memory": {...}
  }'
```

## Docker Commands

### Start Monitoring Server
```bash
# Basic
docker-compose up -d

# With Nginx (Host Network Mode) - RECOMMENDED
docker-compose -f docker-compose.host.yml up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Database Commands
```bash
# Access SQLite database
docker-compose exec backend sqlite3 /app/data/monitoring.db

# List users
SELECT * FROM users;

# List hosts
SELECT * FROM hosts;

# Backup database
docker cp monitoring-backend-1:/app/data/monitoring.db ./monitoring.db.backup
```

## Common Operations

### Change Admin Password
```sql
-- Via SQLite
UPDATE users 
SET password_hash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' 
WHERE username = 'admin';
-- Password hash above is for 'admin' (SHA256)
```

### Add New User
```sql
INSERT INTO users (username, password_hash, email, is_admin) 
VALUES ('user1', 'password_hash_here', 'user1@example.com', 0);
```

### Check Active Hosts
```sql
SELECT hostname, last_seen, is_active 
FROM hosts 
WHERE is_active = 1 
ORDER BY last_seen DESC;
```

### Deactivate Host
```sql
UPDATE hosts SET is_active = 0 WHERE hostname = 'old-server';
```

## Troubleshooting Quick Fixes

### Agent Can't Connect
```bash
# Check API key
curl -X POST http://monitoring-server:5000/api/metrics \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{}'

# Expected: 400 (Invalid data format) - means API key is valid
# Got 401: API key invalid or expired
```

### Can't Login
```bash
# Reset admin password to default (admin123)
docker-compose exec backend sqlite3 /app/data/monitoring.db \
  "UPDATE users SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9' WHERE username = 'admin';"
```

### View Backend Logs
```bash
# Docker
docker-compose logs -f backend

# Systemd (if installed manually)
journalctl -u monitoring-backend -f
```

### View Agent Logs
```bash
# Systemd
journalctl -u monitoring-agent -f

# If running manually
ps aux | grep monitor_agent.py
```

## File Locations

### Docker Deployment
- Database: `./data/monitoring.db` (volume mounted)
- Backend logs: `docker-compose logs backend`
- Nginx logs: `docker-compose logs nginx`

### Manual Installation
- Backend: `/opt/monitoring/backend/`
- Agent: `/opt/monitoring/agent/`
- Database: `/opt/monitoring/backend/data/monitoring.db`
- Systemd service: `/etc/systemd/system/monitoring-*.service`

## Ports

- **80**: Nginx (HTTP) - Production with host network
- **443**: Nginx (HTTPS) - If SSL configured
- **5000**: Backend API (direct access)

## URLs

### Docker with Host Network (Recommended)
- Dashboard: `http://your-server` or `http://your-server-ip`
- API: `http://your-server/api` or `http://your-server-ip/api`

### Docker without Nginx
- Dashboard: `http://localhost:5000`
- API: `http://localhost:5000/api`

### Manual Installation
- Dashboard: `http://localhost:5000`
- API: `http://localhost:5000/api`

## Security Checklist

- [ ] Change default admin password
- [ ] Use HTTPS in production
- [ ] Regenerate API keys regularly
- [ ] Backup database regularly
- [ ] Restrict dashboard access via firewall
- [ ] Monitor failed login attempts
- [ ] Keep API keys secure
- [ ] Use strong passwords

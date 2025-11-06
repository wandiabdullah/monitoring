# Monitoring System Configuration Examples

## Environment Variables

Anda bisa menggunakan environment variables untuk konfigurasi:

### Backend (app.py)
```bash
# Set port
export MONITORING_PORT=5000

# Set host
export MONITORING_HOST=0.0.0.0

# Enable debug mode
export FLASK_DEBUG=1
```

### Agent (monitor_agent.py)
```bash
# Set monitoring server
export MONITORING_SERVER=http://192.168.1.100:5000

# Set collection interval
export MONITORING_INTERVAL=10

# Set custom hostname
export MONITORING_HOSTNAME=my-server-01
```

## Config File Example (Optional Enhancement)

Anda bisa membuat config.ini untuk agent:

```ini
[server]
url = http://192.168.1.100:5000
timeout = 5

[agent]
hostname = auto
interval = 5

[metrics]
collect_cpu = true
collect_memory = true
collect_disk = true
collect_io = true
```

## Systemd Service Files

### Backend Service
Location: `/etc/systemd/system/monitoring-backend.service`

```ini
[Unit]
Description=Server Monitoring Backend
After=network.target

[Service]
Type=simple
User=monitoring
Group=monitoring
WorkingDirectory=/opt/monitoring/backend
Environment="FLASK_APP=app.py"
Environment="MONITORING_PORT=5000"
ExecStart=/usr/bin/python3 app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Agent Service
Location: `/etc/systemd/system/monitoring-agent.service`

```ini
[Unit]
Description=Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/monitoring-agent
Environment="MONITORING_SERVER=http://192.168.1.100:5000"
Environment="MONITORING_INTERVAL=5"
ExecStart=/usr/bin/python3 monitor_agent.py --server ${MONITORING_SERVER} --interval ${MONITORING_INTERVAL}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Nginx Reverse Proxy (Production)

```nginx
server {
    listen 80;
    server_name monitoring.example.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support (if needed in future)
    location /ws {
        proxy_pass http://127.0.0.1:5000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Custom Alert Thresholds

Edit di backend/app.py atau buat file terpisah:

```python
ALERT_THRESHOLDS = {
    'cpu_critical': 90,
    'cpu_warning': 75,
    'memory_critical': 90,
    'memory_warning': 75,
    'disk_critical': 90,
    'disk_warning': 80
}
```

## Database Configuration (PostgreSQL Example)

```python
# backend/app.py
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_CONFIG = {
    'host': 'localhost',
    'database': 'monitoring',
    'user': 'monitoring_user',
    'password': 'secure_password'
}

def get_db_connection():
    return psycopg2.connect(**DATABASE_CONFIG)
```

## Logging Configuration

```python
# backend/app.py
import logging
from logging.handlers import RotatingFileHandler

# Setup logging
handler = RotatingFileHandler('logs/monitoring.log', maxBytes=10000000, backupCount=5)
handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
handler.setLevel(logging.INFO)
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)
```

## Security Best Practices

### API Authentication (Example)

```python
# backend/app.py
from functools import wraps

API_KEY = 'your-secret-api-key'

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if api_key != API_KEY:
            return jsonify({'error': 'Invalid API key'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/metrics', methods=['POST'])
@require_api_key
def receive_metrics():
    # ...
```

### HTTPS/SSL Setup

```bash
# Generate self-signed certificate (development)
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# Update app.py
app.run(host='0.0.0.0', port=5000, ssl_context=('cert.pem', 'key.pem'))
```

## Monitoring Retention Policy

```python
# backend/app.py

# Keep metrics for different time periods
RETENTION_CONFIG = {
    'real_time': 1000,      # Last 1000 points in memory
    'hourly': 24 * 60,      # 24 hours at 1-minute resolution
    'daily': 30 * 24,       # 30 days at 1-hour resolution
    'monthly': 12 * 30      # 12 months at 1-day resolution
}
```

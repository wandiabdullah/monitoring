# System Architecture

## 🏗️ Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring System                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  Linux Server 1  │       │  Linux Server 2  │       │  Linux Server N  │
│                  │       │                  │       │                  │
│  ┌────────────┐  │       │  ┌────────────┐  │       │  ┌────────────┐  │
│  │   Agent    │  │       │  │   Agent    │  │       │  │   Agent    │  │
│  │ (Python)   │  │       │  │ (Python)   │  │       │  │ (Python)   │  │
│  │            │  │       │  │            │  │       │  │            │  │
│  │ - CPU      │  │       │  │ - CPU      │  │       │  │ - CPU      │  │
│  │ - Memory   │  │       │  │ - Memory   │  │       │  │ - Memory   │  │
│  │ - Disk     │  │       │  │ - Disk     │  │       │  │ - Disk     │  │
│  │ - I/O      │  │       │  │ - I/O      │  │       │  │ - I/O      │  │
│  └─────┬──────┘  │       │  └─────┬──────┘  │       │  └─────┬──────┘  │
└────────┼─────────┘       └────────┼─────────┘       └────────┼─────────┘
         │                          │                          │
         │  HTTP POST               │  HTTP POST               │  HTTP POST
         │  /api/metrics            │  /api/metrics            │  /api/metrics
         │  (JSON)                  │  (JSON)                  │  (JSON)
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Monitoring Server           │
                    │   (Windows/Linux)             │
                    │                               │
                    │  ┌─────────────────────────┐  │
                    │  │  Backend (Flask)        │  │
                    │  │  Port: 5000             │  │
                    │  │                         │  │
                    │  │  API Endpoints:         │  │
                    │  │  - POST /api/metrics    │  │
                    │  │  - GET  /api/servers    │  │
                    │  │  - GET  /api/servers/   │  │
                    │  │         <hostname>/*    │  │
                    │  │                         │  │
                    │  │  Storage:               │  │
                    │  │  - In-Memory (default)  │  │
                    │  │  - File (optional)      │  │
                    │  │  - Database (optional)  │  │
                    │  └────────┬────────────────┘  │
                    │           │                   │
                    │           │ Serve             │
                    │           ▼                   │
                    │  ┌─────────────────────────┐  │
                    │  │  Dashboard (Web UI)     │  │
                    │  │  HTML + JavaScript      │  │
                    │  │                         │  │
                    │  │  - Server List          │  │
                    │  │  - Real-time Charts     │  │
                    │  │  - History Graphs       │  │
                    │  │  - Disk Info            │  │
                    │  │  - Network Stats        │  │
                    │  └─────────────────────────┘  │
                    └───────────────┬───────────────┘
                                    │
                                    │ HTTP
                                    │
                                    ▼
                          ┌──────────────────┐
                          │  Web Browser     │
                          │  (User Access)   │
                          │                  │
                          │  http://server:  │
                          │       5000       │
                          └──────────────────┘
```

## 📊 Data Flow

### 1. Agent → Backend (Push Model)
```
1. Agent collects metrics (CPU, RAM, Disk, I/O)
2. Formats data as JSON
3. HTTP POST to backend /api/metrics
4. Backend stores in memory/database
5. Repeat every N seconds (default: 5)
```

### 2. Dashboard → Backend (Pull Model)
```
1. Browser loads dashboard
2. JavaScript fetches server list (GET /api/servers)
3. User selects server
4. Fetch detailed metrics (GET /api/servers/<hostname>/*)
5. Render charts and stats
6. Auto-refresh every 5 seconds
```

## 🔄 Component Communication

### Agent (monitor_agent.py)
- **Language**: Python 3
- **Dependencies**: psutil, requests
- **Runs on**: Each Linux server to be monitored
- **Function**: 
  - Collect system metrics
  - Send to backend via HTTP
  - Can run as systemd service

### Backend (app.py)
- **Language**: Python 3 (Flask)
- **Dependencies**: Flask, Flask-CORS
- **Runs on**: Central monitoring server
- **Function**:
  - Receive metrics via REST API
  - Store metrics (in-memory or persistent)
  - Serve dashboard files
  - Provide query APIs

### Dashboard (index.html + app.js)
- **Language**: HTML, CSS, JavaScript
- **Dependencies**: Chart.js
- **Runs on**: Web browser
- **Function**:
  - Display server list
  - Show real-time metrics
  - Render history charts
  - Auto-refresh data

## 📡 API Specification

### POST /api/metrics
**Request Body:**
```json
{
  "hostname": "server-name",
  "timestamp": "2025-11-06T10:00:00",
  "cpu": {
    "cpu_percent_total": 45.2,
    "cpu_percent_per_core": [40, 50, 43, 48],
    "cpu_count_logical": 4,
    "load_average": [1.5, 1.2, 1.0]
  },
  "memory": {
    "memory_total": 8589934592,
    "memory_used": 4294967296,
    "memory_percent": 50.0
  },
  "disk": {
    "partitions": [...]
  },
  "io": {
    "network": {...},
    "disk_io": {...}
  }
}
```

**Response:**
```json
{
  "status": "success",
  "hostname": "server-name"
}
```

## 🗄️ Data Storage

### Current (In-Memory)
- **Type**: Python deque
- **Capacity**: Last 1000 metrics per server
- **Pros**: Fast, no setup
- **Cons**: Lost on restart

### Optional (File-based)
- **Type**: JSON Lines (.jsonl)
- **Location**: backend/data/
- **Format**: One JSON per line
- **Pros**: Simple, persistent
- **Cons**: Limited query capability

### Future (Database)
- **Recommended**: InfluxDB, PostgreSQL
- **Benefits**: 
  - Persistent storage
  - Advanced queries
  - Data aggregation
  - Long-term retention

## 🔐 Security Considerations

### Current Implementation
- ✅ CORS enabled (for development)
- ❌ No authentication
- ❌ No encryption (HTTP)
- ❌ No input validation

### Production Recommendations
- ✅ Add API key authentication
- ✅ Use HTTPS/SSL
- ✅ Implement rate limiting
- ✅ Add input validation
- ✅ Use nginx reverse proxy
- ✅ Implement user authentication for dashboard

## 📈 Scalability

### Current Limitations
- In-memory storage (limited by RAM)
- Single server backend
- No load balancing

### Scale-up Recommendations

**For 10-50 servers:**
- Current architecture OK
- Add database for persistence
- Increase storage retention

**For 50-500 servers:**
- Use PostgreSQL/InfluxDB
- Add caching (Redis)
- Implement data aggregation

**For 500+ servers:**
- Distribute backend (load balancer)
- Use time-series database (InfluxDB)
- Implement data sampling/aggregation
- Add message queue (RabbitMQ/Kafka)

## 🛠️ Customization Points

### Add New Metrics
1. Modify agent: `get_custom_metrics()`
2. Update backend: handle new fields
3. Update dashboard: display new metrics

### Change Storage
1. Implement storage interface in backend
2. Replace in-memory storage
3. Update query methods

### Add Alerting
1. Add threshold configuration
2. Implement alert checking in backend
3. Add notification service (email, Slack, etc.)

### Multi-tenancy
1. Add organization/tenant field
2. Implement authentication
3. Filter data by tenant
4. Add role-based access control

## 🔍 Monitoring the Monitor

### Backend Health
- Endpoint: `/api/health`
- Monitor: Response time, error rate
- Alert: If backend is down

### Agent Health
- Check: Last update timestamp
- Alert: If no data for X minutes
- Auto-recovery: Systemd restart

### Data Quality
- Validate: Metrics within expected ranges
- Check: No missing fields
- Monitor: Data collection rate

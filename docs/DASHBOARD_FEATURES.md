# Dashboard Features - Groups & Key Mapping

## 📊 New Dashboard Overview

Dashboard monitoring baru dengan tampilan modern yang dilengkapi:

### ✨ Fitur Utama

1. **Sidebar Navigation**
   - Dashboard Overview
   - All Hosts
   - Groups Management
   - Add Host
   - Add Group
   - Settings
   - User Profile & Logout

2. **Statistics Cards**
   - Total Hosts
   - Online Hosts
   - Offline Hosts
   - Total Groups

3. **Group Management**
   - Organize hosts into logical groups
   - Collapsible group views
   - Visual icons for each group
   - Host count per group

4. **Key Mapping Security**
   - API key locked to specific hostname
   - Prevent key sharing between hosts
   - Enhanced security for multi-tenant environments

## 🗂️ Groups Feature

### What is Grouping?

Groups memungkinkan Anda mengorganisir server berdasarkan:
- **Environment**: Production, Development, Staging
- **Function**: Web Servers, Database Servers, Cache Servers
- **Location**: US-East, EU-West, Asia-Pacific
- **Department**: Engineering, Marketing, Sales
- **Customer**: Client A, Client B, Client C

### Benefits

✅ **Better Organization**: Lihat server berdasarkan kategori
✅ **Easier Management**: Kelola server dalam grup
✅ **Quick Overview**: Status grup secara sekilas
✅ **Scalability**: Mudah untuk ratusan server

### Create a Group

**Via Dashboard:**
1. Click "Add Group" di sidebar atau header
2. Isi form:
   - **Name**: Nama group (e.g., "Production Servers")
   - **Icon**: Pilih icon (server, database, cloud, etc.)
   - **Description**: Deskripsi grup (optional)
3. Click "Create Group"

**Via API:**
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -b "session_cookie" \
  -d '{
    "name": "Production Servers",
    "icon": "fa-server",
    "description": "Production environment servers",
    "color": "#667eea"
  }'
```

### Available Group Icons

- `fa-server` - Generic Server
- `fa-database` - Database
- `fa-cloud` - Cloud
- `fa-network-wired` - Network
- `fa-desktop` - Desktop/Workstation
- `fa-hdd` - Storage
- `fa-code` - Development
- `fa-lock` - Security

### Assign Host to Group

When adding a new host, select group from dropdown:

```bash
curl -X POST http://localhost:5000/api/hosts \
  -H "Content-Type: application/json" \
  -b "session_cookie" \
  -d '{
    "hostname": "web-server-01",
    "ip_address": "192.168.1.100",
    "description": "Production Web Server",
    "group_id": 1,
    "enable_key_mapping": true
  }'
```

### Move Host Between Groups

```bash
curl -X PUT http://localhost:5000/api/hosts/1 \
  -H "Content-Type: application/json" \
  -b "session_cookie" \
  -d '{
    "group_id": 2
  }'
```

### Delete Group

Hosts dalam group akan menjadi ungrouped:

```bash
curl -X DELETE http://localhost:5000/api/groups/1 \
  -b "session_cookie"
```

## 🔐 Key Mapping Feature

### What is Key Mapping?

Key Mapping adalah fitur keamanan yang **mengunci API key ke hostname tertentu**:

- ✅ 1 API Key = 1 Hostname (locked)
- ✅ Key tidak bisa digunakan di host lain
- ✅ Mencegah key sharing
- ✅ Audit trail per host

### Why Key Mapping?

**Tanpa Key Mapping:**
```
❌ Key "ABC123" bisa digunakan di:
   - web-server-01
   - web-server-02  
   - database-01
   - any-other-server
```

**Dengan Key Mapping:**
```
✅ Key "ABC123" HANYA bisa digunakan di:
   - web-server-01 (hostname terkunci)
   
✅ Key "XYZ789" HANYA bisa digunakan di:
   - web-server-02 (hostname terkunci)
```

### Benefits

1. **Security**
   - Stolen key hanya valid untuk 1 host
   - Tidak bisa digunakan untuk spoof hostname
   - Easier to revoke compromised keys

2. **Multi-Tenant Environments**
   - Perfect untuk managed hosting
   - Setiap customer punya isolated key
   - Prevent cross-contamination

3. **Compliance**
   - Better audit trail
   - Know exactly which host sent data
   - Regulatory compliance

### Enable Key Mapping

**Default: ENABLED** (recommended)

When adding host:
```javascript
{
  "hostname": "web-server-01",
  "enable_key_mapping": true  // ✅ Recommended
}
```

Disable only if you need key sharing (not recommended):
```javascript
{
  "hostname": "test-server",
  "enable_key_mapping": false  // ⚠️ Less secure
}
```

### How It Works

1. **Add Host dengan Key Mapping**
   ```
   POST /api/hosts
   {
     "hostname": "web-server-01",
     "enable_key_mapping": true
   }
   
   Response:
   {
     "api_key": "xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG9eQ8wE3rT2y",
     "hostname": "web-server-01"
   }
   ```

2. **Agent Send Metrics**
   ```
   POST /api/metrics
   Headers:
     X-API-Key: xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG9eQ8wE3rT2y
   
   Body:
   {
     "timestamp": "2024-01-15T10:30:00",
     "cpu": {...},
     "memory": {...}
   }
   ```

3. **Backend Verification**
   ```python
   # Backend automatically:
   1. Verify API key exists
   2. Get locked hostname from key
   3. Override any hostname in payload
   4. Store with verified hostname
   ```

4. **Result**
   ```
   ✅ Metrics stored with hostname: "web-server-01"
   ✅ Even if agent sends different hostname
   ✅ Hostname cannot be spoofed
   ```

## 🎨 Dashboard UI Components

### Sidebar Menu

**Main Navigation:**
- Dashboard (Overview with stats)
- All Hosts (List view)
- Groups (Group management)

**Management:**
- Add Host (Quick add modal)
- Add Group (Create new group)

**Settings:**
- Settings (Configuration)
- Logout

**User Section:**
- User avatar
- Username
- Role (Admin/User)

### Stats Cards

Real-time statistics:
- **Total Hosts**: All registered hosts
- **Online**: Currently sending metrics
- **Offline**: Not sending metrics
- **Groups**: Total number of groups

### Group Cards

Each group shows:
- Group icon and name
- Description
- Host count
- Online count
- Expandable/collapsible host list

### Host Cards

Each host displays:
- Hostname
- Online/Offline status (animated dot)
- IP Address
- Description
- CPU usage
- Memory usage
- Click to view detailed metrics

## 🔌 API Endpoints

### Groups

```bash
# List all groups
GET /api/groups

# Create group
POST /api/groups
{
  "name": "Production",
  "icon": "fa-server",
  "description": "Production servers",
  "color": "#667eea"
}

# Update group
PUT /api/groups/:id
{
  "name": "Updated Name",
  "icon": "fa-database"
}

# Delete group
DELETE /api/groups/:id
```

### Hosts (Updated)

```bash
# List all hosts (with group info)
GET /api/hosts

# Add host with group and key mapping
POST /api/hosts
{
  "hostname": "web-server-01",
  "ip_address": "192.168.1.100",
  "description": "Production Web Server",
  "group_id": 1,
  "enable_key_mapping": true
}

# Update host (change group)
PUT /api/hosts/:id
{
  "group_id": 2
}
```

## 📱 Responsive Design

Dashboard fully responsive:
- ✅ Desktop: Full sidebar + grid layout
- ✅ Tablet: Collapsible sidebar
- ✅ Mobile: Hidden sidebar (toggle button)

## 🎯 Best Practices

### Grouping Strategy

1. **By Environment**
   ```
   ├── Production
   ├── Staging
   ├── Development
   └── Testing
   ```

2. **By Function**
   ```
   ├── Web Servers
   ├── API Servers
   ├── Database Servers
   ├── Cache Servers
   └── Queue Workers
   ```

3. **By Location**
   ```
   ├── US-East-1
   ├── US-West-2
   ├── EU-West-1
   └── Asia-Southeast-1
   ```

4. **By Customer (Multi-tenant)**
   ```
   ├── Customer A
   ├── Customer B
   ├── Customer C
   └── Internal
   ```

### Security Recommendations

1. **Always Enable Key Mapping**
   - Unless you have specific reason not to
   - Default is enabled for a reason

2. **Use Groups for Access Control** (future feature)
   - Assign users to specific groups
   - Restrict access by group

3. **Regular Key Rotation**
   - Rotate API keys every 3-6 months
   - Use regenerate-key endpoint

4. **Monitor Ungrouped Hosts**
   - Review ungrouped hosts regularly
   - Assign to appropriate groups

## 🚀 Migration Guide

### From Old Dashboard

1. **Access New Dashboard**
   ```
   http://your-server:5000/
   ```

2. **Access Old Dashboard** (if needed)
   ```
   http://your-server:5000/old-dashboard
   ```

3. **Create Groups**
   - Add groups for your organization
   - Assign existing hosts to groups

4. **Key Mapping**
   - New hosts automatically have key mapping
   - Existing hosts continue to work
   - Regenerate keys to enable mapping

### Database Migration

Database automatically updated:
- New `groups` table created
- `hosts` table updated with `group_id` and `enable_key_mapping`
- Existing data preserved

## 📊 Example Scenarios

### Scenario 1: Web Hosting Company

```
Groups:
├── Client A - E-commerce
│   ├── web-01 (Frontend)
│   ├── web-02 (Frontend)
│   ├── api-01 (Backend)
│   └── db-01 (Database)
├── Client B - Blog
│   ├── web-01 (WordPress)
│   └── db-01 (MySQL)
└── Internal Infrastructure
    ├── monitoring (This server)
    ├── backup-server
    └── dns-server
```

**Benefits:**
- Each client isolated
- Key mapping prevents cross-client access
- Easy billing per client
- Clear resource allocation

### Scenario 2: Microservices Architecture

```
Groups:
├── Frontend Services
│   ├── nginx-01
│   ├── nginx-02
│   └── cdn-proxy
├── API Gateway
│   ├── api-gateway-01
│   └── api-gateway-02
├── Backend Services
│   ├── user-service-01
│   ├── payment-service-01
│   ├── notification-service-01
│   └── analytics-service-01
└── Data Layer
    ├── postgres-master
    ├── postgres-replica-01
    ├── redis-cache-01
    └── elasticsearch-01
```

**Benefits:**
- Service topology visible
- Easy to spot bottlenecks
- Monitor service groups
- Scalability planning

### Scenario 3: Development Pipeline

```
Groups:
├── Production
│   └── [production servers]
├── Staging
│   └── [staging servers]
├── Testing
│   └── [test servers]
└── Development
    └── [dev servers]
```

**Benefits:**
- Clear environment separation
- Prevent prod/dev confusion
- Deployment pipeline visibility
- Resource usage per environment

## 🎨 Customization

### Group Colors

Default colors available:
- `#667eea` - Purple (default)
- `#28a745` - Green
- `#17a2b8` - Blue
- `#ffc107` - Yellow
- `#dc3545` - Red
- `#6f42c1` - Violet

### Group Icons

Font Awesome 6 icons supported:
- All free icons available
- Use format: `fa-icon-name`
- Examples in icon picker

## 📈 Performance

- **Auto-refresh**: Every 10 seconds
- **Lazy loading**: Groups load on expand
- **Optimized queries**: JOIN queries cached
- **Minimal DOM updates**: Only changed data

## 🔧 Troubleshooting

### Groups not showing

```bash
# Check groups in database
sqlite3 data/monitoring.db "SELECT * FROM groups;"

# Create default groups
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -d '{"name":"Production","icon":"fa-server"}'
```

### Host not in correct group

```bash
# Check host group assignment
curl http://localhost:5000/api/hosts | jq '.[] | {hostname, group_id}'

# Update host group
curl -X PUT http://localhost:5000/api/hosts/1 \
  -H "Content-Type: application/json" \
  -d '{"group_id": 2}'
```

### Key mapping not working

```bash
# Check if key mapping enabled
sqlite3 data/monitoring.db \
  "SELECT hostname, enable_key_mapping FROM hosts;"

# Regenerate key with mapping
curl -X POST http://localhost:5000/api/hosts/1/regenerate-key
```

## 🎉 Summary

Dashboard baru memberikan:
- ✅ **Professional UI** dengan sidebar navigation
- ✅ **Group Management** untuk organize hosts
- ✅ **Key Mapping** untuk enhanced security
- ✅ **Better UX** dengan collapsible groups
- ✅ **Real-time Stats** dengan auto-refresh
- ✅ **Responsive Design** untuk semua device
- ✅ **Backward Compatible** dengan old dashboard

Semua fitur terintegrasi dan siap digunakan! 🚀

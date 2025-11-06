# 🔐 Key Mapping Security Guide

## Apa itu Key Mapping?

**Key Mapping** adalah fitur keamanan yang memetakan API Key dengan hostname tertentu di server. Ini memberikan lapisan keamanan ekstra dengan memastikan bahwa hostname tidak bisa di-spoof oleh agent.

## 🔒 Cara Kerja

### Mode 1: Key Mapping Enabled (Recommended - Secure)

```
┌─────────────┐                    ┌─────────────┐
│   Agent     │                    │   Server    │
│             │                    │             │
│ 1. Collect  │                    │ ┌─────────┐ │
│    Metrics  │                    │ │ API Key │ │
│             │                    │ │ Mapping │ │
│ 2. Send     │  ─────────────────>│ └─────────┘ │
│    + API Key│  Metrics (no host) │             │
│             │                    │ 3. Lookup   │
│             │                    │    hostname │
│             │                    │    from key │
│             │  <─────────────────│             │
│             │      200 OK        │ 4. Store    │
└─────────────┘                    └─────────────┘

✅ Hostname ditentukan oleh server
✅ Agent tidak bisa mengirim hostname palsu
✅ Lebih aman untuk production
```

**Flow:**
1. Agent mengumpulkan metrics
2. Agent mengirim metrics **tanpa hostname** + API key
3. Server lookup hostname berdasarkan API key dari database
4. Server menyimpan metrics dengan hostname yang benar

**Keuntungan:**
- ✅ **Secure**: Hostname tidak bisa di-spoof
- ✅ **Centralized**: Hostname dikelola di server
- ✅ **Audit**: Jelas siapa yang mengirim data (berdasarkan API key)

**Kekurangan:**
- ❌ Kurang fleksibel untuk development
- ❌ Harus add host di dashboard dulu sebelum agent jalan

---

### Mode 2: Key Mapping Disabled (Flexible)

```
┌─────────────┐                    ┌─────────────┐
│   Agent     │                    │   Server    │
│             │                    │             │
│ 1. Collect  │                    │             │
│    Metrics  │                    │             │
│             │                    │             │
│ 2. Send     │  ─────────────────>│             │
│    + API Key│  Metrics + hostname│             │
│    + hostname                    │             │
│             │                    │ 3. Verify   │
│             │                    │    API key  │
│             │  <─────────────────│             │
│             │      200 OK        │ 4. Store    │
└─────────────┘                    └─────────────┘

⚠️  Hostname dari agent
⚠️  Bisa override dengan --hostname
```

**Flow:**
1. Agent mengumpulkan metrics
2. Agent mengirim metrics **dengan hostname** + API key
3. Server hanya verify API key valid
4. Server menyimpan metrics dengan hostname dari agent

**Keuntungan:**
- ✅ **Flexible**: Agent bisa override hostname
- ✅ **Dynamic**: Bisa digunakan untuk container atau VM yang dinamis
- ✅ **Development**: Mudah untuk testing

**Kekurangan:**
- ⚠️ **Less Secure**: Agent bisa mengirim hostname palsu
- ⚠️ **Spoofing Risk**: Bisa ada multiple agent dengan hostname sama

---

## 📋 Kapan Menggunakan Mode Apa?

### ✅ Gunakan Key Mapping Enabled (Secure Mode) untuk:

- **Production servers** dengan hostname static
- **Security compliance** yang ketat
- **Multi-tenant environment** (SaaS)
- **Corporate infrastructure** dengan audit requirement
- Server yang **tidak boleh** di-spoof identitasnya

**Contoh Use Case:**
```bash
# Production web server
python3 monitor_agent.py \
  --server https://monitoring.company.com \
  --api-key "prod-web-01-xR9kL3mP8qW2vN7j"

# Database server
python3 monitor_agent.py \
  --server https://monitoring.company.com \
  --api-key "prod-db-master-T4hY6bF1cZ5sA0dG"
```

---

### ❌ Gunakan Key Mapping Disabled (Flexible Mode) untuk:

- **Development/Testing environment**
- **Docker containers** yang dinamis
- **Auto-scaling instances** (AWS EC2, GCP)
- **Kubernetes pods** dengan hostname dinamis
- **Lab environment** dengan banyak perubahan

**Contoh Use Case:**
```bash
# Development server dengan custom hostname
python3 monitor_agent.py \
  --server http://localhost:5000 \
  --api-key "dev-shared-key-123" \
  --hostname "dev-$(hostname)-$(date +%s)" \
  --no-key-mapping

# Docker container
python3 monitor_agent.py \
  --server http://monitoring:5000 \
  --api-key "docker-shared-key" \
  --hostname "container-$HOSTNAME" \
  --no-key-mapping
```

---

## 🛠️ Setup di Dashboard

### Setup dengan Key Mapping Enabled:

1. **Add Host** di dashboard:
   ```
   Hostname: server1.example.com
   Description: Production Web Server
   IP Address: 192.168.1.10
   Group: Production
   ✅ Enable Key Mapping: YES
   ```

2. **Copy API Key** yang muncul

3. **Install agent** di server `server1.example.com`:
   ```bash
   python3 monitor_agent.py \
     --server http://monitoring.company.com:5000 \
     --api-key "THE_COPIED_API_KEY"
   ```

4. **Hostname akan otomatis** menjadi `server1.example.com` (dari mapping)

---

### Setup dengan Key Mapping Disabled:

1. **Add Host** di dashboard:
   ```
   Hostname: shared-dev-key  (bisa apa saja)
   Description: Development Shared Key
   IP Address: -
   Group: Development
   ❌ Enable Key Mapping: NO
   ```

2. **Copy API Key** yang muncul

3. **Install agent** dengan hostname custom:
   ```bash
   python3 monitor_agent.py \
     --server http://monitoring.company.com:5000 \
     --api-key "THE_COPIED_API_KEY" \
     --hostname "my-custom-server-name" \
     --no-key-mapping
   ```

4. **Hostname akan menjadi** `my-custom-server-name` (dari agent)

---

## 🔍 Troubleshooting

### Error: "Invalid API key"

**Penyebab:**
- API key salah atau tidak ada di database
- API key untuk host yang di-disable

**Solusi:**
```bash
# Cek API key di dashboard
# Pastikan host status = Active
# Generate API key baru jika perlu
```

---

### Error: "Hostname mismatch" (Key Mapping Enabled)

**Penyebab:**
- Agent mencoba override hostname tapi key mapping enabled

**Solusi:**
```bash
# JANGAN gunakan --hostname dengan key mapping
# Hapus flag --hostname dari command

# ❌ Salah:
python3 monitor_agent.py --server http://... --api-key "..." --hostname custom

# ✅ Benar:
python3 monitor_agent.py --server http://... --api-key "..."
```

---

### Metrics tidak masuk (Key Mapping Disabled)

**Penyebab:**
- Hostname yang dikirim tidak match dengan yang di database

**Solusi:**
```bash
# Option 1: Update hostname di dashboard
# Sesuaikan dengan hostname yang dikirim agent

# Option 2: Override hostname di agent
python3 monitor_agent.py \
  --server http://... \
  --api-key "..." \
  --hostname "sesuai-dengan-dashboard" \
  --no-key-mapping
```

---

## 📊 Monitoring di Dashboard

### Melihat Status Key Mapping:

Di halaman **All Hosts**, akan terlihat badge:

```
┌────────────────────────────────┐
│ server1.example.com            │
│ ✅ Key Mapping Enabled         │
│ Last seen: 2 seconds ago       │
└────────────────────────────────┘

┌────────────────────────────────┐
│ shared-dev-key                 │
│ ❌ Key Mapping Disabled        │
│ Last seen: 1 minute ago        │
└────────────────────────────────┘
```

---

## 🔐 Security Best Practices

### 1. **Production**: Selalu gunakan Key Mapping Enabled
```bash
✅ Secure
✅ Traceable
✅ Audit-friendly
```

### 2. **Development**: Key Mapping Disabled untuk fleksibilitas
```bash
✅ Quick testing
✅ Dynamic hostname
✅ Shared keys
```

### 3. **API Key Rotation**:
```bash
# Rotate API key setiap 90 hari
# Generate new key di dashboard
# Update agent configuration
# Delete old key setelah transisi
```

### 4. **One API Key per Host** (Key Mapping Enabled):
```bash
# JANGAN share API key antar server
# Setiap server punya API key sendiri
# Mudah untuk audit dan revoke
```

### 5. **Shared API Key** (Key Mapping Disabled):
```bash
# Boleh share key untuk dev environment
# Hostname membedakan server
# Mudah untuk auto-scaling
```

---

## 📝 Summary

| Feature | Key Mapping Enabled | Key Mapping Disabled |
|---------|-------------------|---------------------|
| **Security** | 🟢 High | 🟡 Medium |
| **Flexibility** | 🟡 Medium | 🟢 High |
| **Use Case** | Production | Development |
| **Hostname Source** | Server (dari API key) | Agent (bisa override) |
| **Spoofing Risk** | 🟢 No | 🟡 Yes |
| **Setup Complexity** | 🟡 Medium | 🟢 Easy |
| **API Key Sharing** | ❌ Not recommended | ✅ OK for dev |

---

## 🚀 Quick Start Examples

### Production Setup (Secure):
```bash
# 1. Add host "prod-web-01" dengan key mapping enabled
# 2. Copy API key
# 3. Install agent:

python3 monitor_agent.py \
  --server https://monitoring.company.com \
  --api-key "xR9kL3mP8qW2vN7jT4hY6bF1cZ5sA0dG"
  
# Hostname otomatis = "prod-web-01"
```

### Development Setup (Flexible):
```bash
# 1. Add host "dev-shared" dengan key mapping disabled
# 2. Copy API key
# 3. Install agent dengan custom hostname:

python3 monitor_agent.py \
  --server http://localhost:5000 \
  --api-key "dev-shared-key-123" \
  --hostname "dev-server-$(hostname)" \
  --no-key-mapping
  
# Hostname = "dev-server-mypc"
```

---

## 📞 Support

Jika ada pertanyaan atau issue terkait key mapping:

1. Cek dokumentasi ini
2. Lihat logs: `journalctl -u monitoring-agent -f`
3. Cek dashboard: Status host dan last seen
4. Test koneksi: `curl -H "X-API-Key: YOUR_KEY" http://server:5000/api/metrics`

---

**Happy Monitoring! 🎉**

# Debugging Host Detail Loading Issue

## Problem
Host detail page stuck on "Loading monitoring data..." dan tidak menampilkan data.

## Changes Made

### 1. Enhanced JavaScript Logging
Ditambahkan console logging yang lengkap di `dashboard/static/host-detail.js`:
- `[DEBUG]` prefix untuk informasi debug
- `[ERROR]` prefix untuk error
- Logging di setiap tahap: init, fetch requests, responses, data processing

### 2. Improved Error Handling
- Changed `Promise.all()` to `Promise.allSettled()` untuk mencegah satu error menghentikan semua fetch
- Added try-catch di init() function
- Better error messages

## Debugging Steps

### 1. Buka Browser Developer Console
1. Buka halaman: http://localhost/host-detail?host=server1.sumedangkab.go.id
2. Tekan **F12** untuk membuka Developer Tools
3. Pilih tab **Console**

### 2. Perhatikan Console Output
Anda akan melihat log seperti:
```
[DEBUG] Starting initialization...
[DEBUG] Hostname from URL: server1.sumedangkab.go.id
[DEBUG] Initializing charts...
[DEBUG] Fetching initial data...
[DEBUG] Fetching current data for: server1.sumedangkab.go.id
[DEBUG] Current data response status: 200
[DEBUG] Current data received: {...}
[DEBUG] Fetching history data for: server1.sumedangkab.go.id
[DEBUG] History data response status: 200
[DEBUG] History data received, items: 50
...
[DEBUG] All fetch operations completed
[DEBUG] Showing content...
[DEBUG] Initialization complete
```

### 3. Cek Error di Console
Jika ada error, akan muncul dengan prefix `[ERROR]`:
```
[ERROR] Error fetching current data: HTTP error! status: 404
[ERROR] Error during initialization: ...
```

### 4. Cek Network Tab
1. Buka tab **Network** di Developer Tools
2. Refresh halaman
3. Filter by "XHR" atau "Fetch"
4. Cek request ke:
   - `/api/servers/server1.sumedangkab.go.id/current`
   - `/api/servers/server1.sumedangkab.go.id/history`
   - `/api/servers/server1.sumedangkab.go.id/disk`
   - `/api/servers/server1.sumedangkab.go.id/network`

5. Status code yang diharapkan: **200 OK**
6. Jika ada 404/500, klik request tersebut untuk lihat detail error

### 5. Cek Backend Logs
Di terminal backend (docker logs monitoring-backend):
```bash
docker logs monitoring-backend -f
```

Cari error seperti:
```
ERROR in get_current_metrics: ...
KeyError: 'server1.sumedangkab.go.id'
```

## Common Issues & Solutions

### Issue 1: API Returns 404
**Symptom:** `[ERROR] Error fetching current data: HTTP error! status: 404`

**Solution:** 
- Agent mungkin belum mengirim data
- Cek hostname di URL sama dengan hostname yang dikirim agent
- Cek backend logs: `docker logs monitoring-backend | grep server1.sumedangkab.go.id`

### Issue 2: No Data in Response
**Symptom:** Status 200 tapi data kosong

**Solution:**
- Cek agent status: `systemctl status monitor-agent`
- Cek agent logs: `journalctl -u monitor-agent -n 50`
- Pastikan agent berjalan dan mengirim data

### Issue 3: Chart.js Error
**Symptom:** Error tentang Chart atau ctx

**Solution:**
- Cek apakah Chart.js loaded: di console ketik `Chart`
- Jika undefined, cek network tab untuk Chart.js CDN
- Internet connection mungkin terputus

### Issue 4: CORS Error
**Symptom:** `Access to fetch at ... has been blocked by CORS policy`

**Solution:**
- Buka halaman dari same origin sebagai backend
- Gunakan http://localhost bukan http://127.0.0.1 atau IP address

### Issue 5: JavaScript Syntax Error
**Symptom:** `Uncaught SyntaxError: ...`

**Solution:**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Pastikan file host-detail.js ter-update

## Verification Commands

### Cek Agent Running
```bash
# Di server yang di-monitor
systemctl status monitor-agent
journalctl -u monitor-agent -n 20
```

### Cek Backend Receiving Data
```bash
# Di server backend
docker logs monitoring-backend | grep "Metrics received from"
```

### Test API Endpoint Manual
```bash
# Test dari command line
curl http://localhost/api/servers/server1.sumedangkab.go.id/current

# Atau dari browser
http://localhost/api/servers/server1.sumedangkab.go.id/current
```

### Cek Database
```bash
docker exec -it monitoring-backend python3 -c "
from app import current_metrics, metrics_storage
import json
print('Current metrics keys:', list(current_metrics.keys()))
print('Storage keys:', list(metrics_storage.keys()))
if 'server1.sumedangkab.go.id' in current_metrics:
    print(json.dumps(current_metrics['server1.sumedangkab.go.id'], indent=2))
"
```

## Expected Results

### Successful Load
Console output:
```
[DEBUG] Starting initialization...
[DEBUG] Hostname from URL: server1.sumedangkab.go.id
[DEBUG] Initializing charts...
[DEBUG] Fetching initial data...
[DEBUG] Fetching current data for: server1.sumedangkab.go.id
[DEBUG] Current data response status: 200
[DEBUG] Current data received: {hostname: "server1.sumedangkab.go.id", ...}
[DEBUG] Fetching history data for: server1.sumedangkab.go.id
[DEBUG] History data response status: 200
[DEBUG] History data received, items: 60
[DEBUG] Fetching disk data for: server1.sumedangkab.go.id
[DEBUG] Disk data response status: 200
[DEBUG] Disk data received, partitions: 3
[DEBUG] Fetching network data for: server1.sumedangkab.go.id
[DEBUG] Network data response status: 200
[DEBUG] Network data received, items: 30
[DEBUG] All fetch operations completed
[DEBUG] Showing content...
[DEBUG] Initialization complete
```

Network tab: All 4 API requests show **200 OK**

Page: Shows CPU, Memory, Disk charts and host information

## Next Steps

1. **Kumpulkan informasi:**
   - Screenshot console errors
   - Screenshot network tab showing failed requests
   - Copy paste backend logs

2. **Berikan informasi:**
   - Apa yang muncul di console log?
   - Status code apa yang muncul di network tab?
   - Apakah agent berjalan di server yang di-monitor?

3. **Temporary workaround:**
   - Coba akses langsung API endpoint di browser
   - Jika API works, masalahnya di frontend
   - Jika API tidak works, masalahnya di backend/agent

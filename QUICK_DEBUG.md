# Quick Fix: Host Detail Loading Issue

## Perubahan yang Sudah Dilakukan

### 1. Enhanced Logging
File `dashboard/static/host-detail.js` sudah ditambahkan logging lengkap:
- `[DEBUG]` untuk tracking flow
- `[ERROR]` untuk error messages
- Setiap fetch operation di-log dengan detail

### 2. Error Handling Improvements
- Changed `Promise.all()` to `Promise.allSettled()` - tidak akan crash jika satu endpoint gagal
- Added try-catch di semua critical functions
- Better error messages dengan stack trace

## Cara Debug - LANGKAH CEPAT

### Langkah 1: Test API Endpoints
Jalankan di PowerShell:
```powershell
cd c:\Users\wandi\monitoring
.\test-api.ps1 server1.sumedangkab.go.id
```

**Yang Harus Dicek:**
- ✓ Semua endpoint return status 200 OK
- ✓ Data tidak kosong (ada items count)
- ✓ Hostname ditemukan di system

**Jika ada 404 Error:**
- Agent belum kirim data ATAU
- Hostname tidak match

### Langkah 2: Cek Browser Console
1. Buka: http://localhost/host-detail?host=server1.sumedangkab.go.id
2. Tekan **F12**
3. Tab **Console**

**Yang Harus Terlihat:**
```
[DEBUG] Starting initialization...
[DEBUG] Hostname from URL: server1.sumedangkab.go.id
[DEBUG] Initializing charts...
[DEBUG] Fetching initial data...
[DEBUG] Fetching current data for: server1.sumedangkab.go.id
[DEBUG] Current data response status: 200
[DEBUG] Current data received: {hostname: ...}
...
[DEBUG] Showing content...
```

**Jika Stuck:**
- Cari baris yang tidak muncul setelah log terakhir
- Lihat error message merah `[ERROR]`

### Langkah 3: Cek Network Tab
Di F12 Developer Tools:
1. Tab **Network**
2. Refresh halaman (F5)
3. Filter: "XHR" atau "Fetch"

**Yang Harus Dicek:**
| Endpoint | Status | Response |
|----------|--------|----------|
| `/api/servers/.../current` | 200 | JSON data |
| `/api/servers/.../history` | 200 | Array |
| `/api/servers/.../disk` | 200 | Array |
| `/api/servers/.../network` | 200 | Array |

**Klik request yang FAILED** untuk lihat detail error.

## Common Problems & Solutions

### Problem 1: "Server not found" (404)
```
[ERROR] Error fetching current data: HTTP error! status: 404
```

**Penyebab:**
- Agent belum mengirim data
- Hostname salah

**Solusi:**
```bash
# Cek agent di server yang di-monitor
ssh root@server1.sumedangkab.go.id
systemctl status monitor-agent
journalctl -u monitor-agent -n 20

# Harus lihat: "[OK] Metrics sent successfully"
```

### Problem 2: Chart.js tidak load
```
[ERROR] Cannot read property 'Chart' of undefined
```

**Penyebab:**
- Internet connection issue
- Chart.js CDN blocked

**Solusi:**
- Cek network tab untuk Chart.js request
- Clear cache: Ctrl+Shift+Delete
- Hard refresh: Ctrl+F5

### Problem 3: Page masih stuck setelah semua API OK
```
[DEBUG] All fetch operations completed
(tapi tidak ada "[DEBUG] Showing content...")
```

**Penyebab:**
- JavaScript error sebelum showing content
- Try-catch menangkap error tapi tidak log

**Solusi:**
1. Lihat full console log
2. Cek apakah ada error lain
3. Test di browser lain (Chrome vs Firefox)

### Problem 4: Data kosong tapi API return 200
```
[DEBUG] Current data received: {}
```

**Penyebab:**
- Agent kirim data format salah
- Backend parsing error

**Solusi:**
```bash
# Cek raw API response
curl http://localhost/api/servers/server1.sumedangkab.go.id/current

# Harus ada:
{
  "hostname": "server1.sumedangkab.go.id",
  "cpu": {...},
  "memory": {...},
  "disk": {...}
}
```

## Manual Testing

### Test 1: API Endpoints
```powershell
# PowerShell
.\test-api.ps1 server1.sumedangkab.go.id
```

Expected output:
```
Testing API endpoints for: server1.sumedangkab.go.id
========================================

1. Testing /api/servers (list all servers)...
✓ Success

2. Testing /api/servers/server1.sumedangkab.go.id/current...
✓ Status: 200 OK

3. Testing /api/servers/server1.sumedangkab.go.id/history...
✓ Status: 200 OK
Items count: 5

4. Testing /api/servers/server1.sumedangkab.go.id/disk...
✓ Status: 200 OK

5. Testing /api/servers/server1.sumedangkab.go.id/network...
✓ Status: 200 OK
Items count: 30
```

### Test 2: Check Backend Logs
```bash
docker logs monitoring-backend -f
```

Should see:
```
INFO:werkzeug:GET /api/servers/server1.sumedangkab.go.id/current - 200
INFO:werkzeug:GET /api/servers/server1.sumedangkab.go.id/history - 200
...
```

### Test 3: Check Agent
```bash
# Di server yang di-monitor
systemctl status monitor-agent

# Should show:
# Active: active (running)
```

```bash
journalctl -u monitor-agent -n 20

# Should show:
# [OK] Metrics sent successfully
```

## Quick Verification Checklist

- [ ] Backend running: `docker ps | grep monitoring`
- [ ] Agent running: `systemctl status monitor-agent`
- [ ] API returns 200: `curl http://localhost/api/servers/server1.sumedangkab.go.id/current`
- [ ] Browser console shows `[DEBUG]` logs
- [ ] Network tab shows 200 for all 4 requests
- [ ] No JavaScript errors in console
- [ ] Chart.js loaded: Type `Chart` in console, should not be undefined

## Next Steps

1. **Jalankan test-api.ps1** terlebih dahulu
2. **Screenshot hasil** jika ada error
3. **Buka browser console** dan screenshot log
4. **Check network tab** untuk failed requests
5. **Report back** dengan:
   - Output dari test-api.ps1
   - Screenshot console log
   - Screenshot network tab

## Emergency Fallback

Jika masih stuck, coba **old dashboard** dulu:
```
http://localhost/old-dashboard?host=server1.sumedangkab.go.id
```

Jika old-dashboard works tapi host-detail tidak:
- Masalah di JavaScript host-detail.js
- Bukan masalah di backend/agent

Jika old-dashboard juga tidak works:
- Masalah di backend API atau agent
- Perlu fix backend terlebih dahulu

# 🔧 Alert UI Troubleshooting Guide

## Masalah: Menu "Alert Settings" tidak tampil ketika diklik

### Langkah Troubleshooting

#### 1. **CLEAR BROWSER CACHE** (Paling Sering Jadi Masalah!)

**Chrome/Edge:**
```
1. Tekan: Ctrl + Shift + Delete
2. Pilih: "Cached images and files"
3. Time range: "All time"
4. Click: "Clear data"
5. Refresh page: Ctrl + F5 (hard refresh)
```

**Firefox:**
```
1. Tekan: Ctrl + Shift + Delete
2. Pilih: "Cache"
3. Time range: "Everything"
4. Click: "Clear Now"
5. Refresh: Ctrl + F5
```

---

#### 2. **CHECK BROWSER CONSOLE**

**Buka DevTools:**
```
1. Tekan F12
2. Klik tab "Console"
3. Refresh halaman (Ctrl + F5)
4. Klik menu "Alert Settings"
5. Lihat apakah ada error merah
```

**Jika Muncul Error:**

**❌ "showAlertsView is not defined"**
```
Solution:
- Browser cache belum di-clear
- Tekan Ctrl + Shift + Delete → Clear cache
- Refresh dengan Ctrl + F5
```

**❌ "Failed to fetch /api/alerts/config"**
```
Solution:
- Backend container mungkin tidak running
- Check: docker-compose -f docker-compose.ssl.yml ps
- Start: docker-compose -f docker-compose.ssl.yml up -d
```

**❌ "alertsView element NOT FOUND!"**
```
Solution:
- dashboard.html belum ter-update
- Restart container untuk reload HTML
- docker-compose -f docker-compose.ssl.yml restart
```

---

#### 3. **TEST UI COMPONENTS**

**Akses Test Page:**
```
1. Buka: https://eyes.indoinfinite.com/static/alert-ui-test.html
   ATAU
   http://localhost:5000/static/alert-ui-test.html (jika local)

2. Click semua tombol test:
   - Check dashboard.js Loading
   - Check dashboard.html
   - Check Functions Exist
   - Test Alert APIs
   - Check Alert View Elements

3. Lihat hasil:
   - Semua harus ✅ (hijau)
   - Jika ada ❌ (merah), ikuti instruksi di bawah
```

**Hasil Test:**

✅ **Semua hijau** = UI siap, masalahnya cache browser
   → Clear cache dan hard refresh

❌ **dashboard.js functions NOT found** = File JS belum ter-update
   → Restart container

❌ **alertsView element NOT FOUND** = HTML belum ter-update
   → Restart container

❌ **API endpoints failed** = Backend tidak running
   → Start container

---

#### 4. **RESTART CONTAINER**

```bash
# Stop container
docker-compose -f docker-compose.ssl.yml down

# Start container (fresh)
docker-compose -f docker-compose.ssl.yml up -d

# Check logs
docker-compose -f docker-compose.ssl.yml logs -f backend
```

**Tunggu sampai muncul:**
```
 * Running on https://0.0.0.0:5000
 * Running on https://127.0.0.1:5000
```

---

#### 5. **VERIFY FILES LOADED**

**Check di Browser Network Tab:**
```
1. Tekan F12 → Tab "Network"
2. Refresh halaman (Ctrl + F5)
3. Cari file: dashboard.js?v=20251110003
4. Click file → Tab "Response"
5. Search (Ctrl+F): "showAlertsView"
   - Jika FOUND = File OK
   - Jika NOT FOUND = Clear cache belum berhasil
```

---

#### 6. **MANUAL DEBUG**

**Buka Browser Console (F12), ketik:**

```javascript
// Check if function exists
console.log(typeof window.showAlertsView);
// Should show: "function"

// Check if element exists
console.log(document.getElementById('alertsView'));
// Should show: <div id="alertsView" ...>

// Try to show view manually
if (typeof window.showAlertsView === 'function') {
    window.showAlertsView();
} else {
    console.error('Function not loaded! Clear cache and refresh.');
}

// Check all alert functions
const alertFuncs = [
    'showAlertsView',
    'loadAlertConfig',
    'showAddChannelModal',
    'testChannel'
];
alertFuncs.forEach(f => {
    console.log(f + ':', typeof window[f]);
});
```

**Expected Output:**
```
function
<div id="alertsView" class="content-view" style="display: none;">
[DEBUG] ========== Showing Alerts View ==========
showAlertsView: function
loadAlertConfig: function
showAddChannelModal: function
testChannel: function
```

---

#### 7. **CHECK MENU CLICK EVENT**

**Di Console, ketik:**

```javascript
// Check menu exists
const alertMenu = document.querySelector('[data-view="alerts"]');
console.log('Alert menu found:', alertMenu !== null);

// Check if menu has click listener
console.log('Menu element:', alertMenu);

// Try clicking programmatically
if (alertMenu) {
    alertMenu.click();
}
```

---

## Quick Fix Checklist

Lakukan berurutan:

```
□ 1. Clear browser cache (Ctrl+Shift+Delete)
□ 2. Hard refresh (Ctrl+F5)
□ 3. Check browser console (F12) untuk error
□ 4. Open test page: /static/alert-ui-test.html
□ 5. Jika masih gagal: Restart container
□ 6. Jika masih gagal: Check logs
□ 7. Jika masih gagal: Manual debug di console
```

---

## Common Issues & Solutions

### Issue: "View tidak muncul sama sekali"

**Penyebab**: Browser cache old version

**Fix**:
```
1. Close all tabs dashboard
2. Clear ALL browsing data:
   - Cached images and files
   - Cookies and site data
3. Close browser completely
4. Open browser fresh
5. Login again
6. Try Alert Settings menu
```

---

### Issue: "Menu click tapi tidak ada response"

**Penyebab**: JavaScript error atau event listener not attached

**Fix**:
```
1. F12 → Console
2. Refresh page (watch for errors)
3. Type: window.showAlertsView()
4. If error → Clear cache
5. If works → Menu listener issue
```

---

### Issue: "API calls failing (red in console)"

**Penyebab**: Backend not running atau database error

**Fix**:
```
1. Check container:
   docker-compose -f docker-compose.ssl.yml ps

2. If not running:
   docker-compose -f docker-compose.ssl.yml up -d

3. Check logs:
   docker-compose -f docker-compose.ssl.yml logs backend

4. Look for errors like:
   - "No such table: alert_config"
   - "Database is locked"
   - "Port already in use"

5. If database error:
   docker-compose -f docker-compose.ssl.yml down
   docker-compose -f docker-compose.ssl.yml up -d --build
```

---

### Issue: "Element not found errors"

**Penyebab**: HTML file not updated or wrong version loaded

**Fix**:
```
1. Check HTML version:
   curl https://eyes.indoinfinite.com/dashboard.html | grep "alertsView"
   
   Should contain: <div id="alertsView"

2. If not found:
   - Restart container
   - Check if dashboard.html mounted correctly in docker-compose

3. Verify mount in docker-compose.ssl.yml:
   volumes:
     - ./dashboard:/app/dashboard
```

---

## Diagnostic Commands

```bash
# Check if container running
docker ps | grep monitoring

# Check container logs for errors
docker-compose -f docker-compose.ssl.yml logs backend | tail -50

# Check if files exist in container
docker-compose -f docker-compose.ssl.yml exec backend ls -la /app/dashboard/

# Check if HTML has alertsView
docker-compose -f docker-compose.ssl.yml exec backend grep -c "alertsView" /app/dashboard/dashboard.html

# Check if JS has showAlertsView
docker-compose -f docker-compose.ssl.yml exec backend grep -c "showAlertsView" /app/dashboard/dashboard.js

# Test API endpoints
curl -k https://eyes.indoinfinite.com/api/alerts/config
curl -k https://eyes.indoinfinite.com/api/alerts/channels
```

---

## Still Not Working?

### Last Resort: Full Rebuild

```bash
# 1. Stop everything
docker-compose -f docker-compose.ssl.yml down

# 2. Remove volumes (CAUTION: This removes database!)
# Skip this if you want to keep data
# docker-compose -f docker-compose.ssl.yml down -v

# 3. Rebuild from scratch
docker-compose -f docker-compose.ssl.yml up -d --build

# 4. Watch logs
docker-compose -f docker-compose.ssl.yml logs -f backend

# 5. Wait for "Running on https://..." message

# 6. Clear browser cache COMPLETELY

# 7. Close browser, reopen, login

# 8. Try Alert Settings menu
```

---

## Debug Output to Share

Jika masih tidak berhasil, jalankan dan share output:

```bash
echo "=== Container Status ==="
docker-compose -f docker-compose.ssl.yml ps

echo "=== File Check ==="
docker-compose -f docker-compose.ssl.yml exec backend ls -la /app/dashboard/ | grep dashboard

echo "=== HTML Content Check ==="
docker-compose -f docker-compose.ssl.yml exec backend grep -o "alertsView" /app/dashboard/dashboard.html | wc -l

echo "=== JS Content Check ==="
docker-compose -f docker-compose.ssl.yml exec backend grep -o "showAlertsView" /app/dashboard/dashboard.js | wc -l

echo "=== API Check ==="
curl -k https://eyes.indoinfinite.com/api/alerts/config

echo "=== Backend Logs (last 20 lines) ==="
docker-compose -f docker-compose.ssl.yml logs backend | tail -20
```

---

## Expected Behavior

Ketika **Alert Settings** di-click, seharusnya:

1. **Console logs:**
   ```
   [DEBUG] Menu clicked: alerts
   [DEBUG] ========== Showing Alerts View ==========
   [DEBUG] Total content views found: 5
   [DEBUG] Hiding view: dashboardView
   [DEBUG] Hiding view: allHostsView
   [DEBUG] Hiding view: groupsView
   [DEBUG] Hiding view: accountView
   [DEBUG] Hiding view: userManagementView
   [DEBUG] alertsView element: <div id="alertsView" ...>
   [DEBUG] Setting alertsView display to block
   [DEBUG] ========== Initializing Alerts View ==========
   [DEBUG] Loading alert config...
   [DEBUG] Loading notification channels...
   [DEBUG] Loading alert stats...
   [DEBUG] Loading alert history...
   ```

2. **Page shows:**
   - Statistics cards (4 cards di atas)
   - Alert Rules Configuration form
   - Notification Channels section
   - Alert History section

3. **No errors in console** (no red text)

---

## Contact/Support

Jika semua langkah di atas sudah dicoba dan masih tidak berhasil:

1. Copy output dari "Debug Output to Share" section
2. Screenshot browser console (F12 → Console tab)
3. Screenshot halaman dashboard
4. Jelaskan langkah apa saja yang sudah dicoba

---

## Summary: Most Common Fix

**90% kasus:**
```
1. Ctrl + Shift + Delete (Clear cache)
2. Select "All time" + "Cached images and files"
3. Clear data
4. Ctrl + F5 (Hard refresh)
5. Click Alert Settings menu
6. Should work!
```

**Jika tidak work setelah cache clear:**
```
docker-compose -f docker-compose.ssl.yml restart
```

Lalu ulangi cache clear.

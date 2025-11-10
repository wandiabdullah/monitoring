# 🚨 ALERT: UI Tidak Tampil?

## ⚡ Quick Fix (90% berhasil)

### Option 1: Otomatis
```cmd
# Jalankan script ini
fix-alert-ui.bat
```

### Option 2: Manual

**Step 1: Clear Browser Cache**
```
1. Tekan: Ctrl + Shift + Delete
2. Pilih: "Cached images and files" 
3. Time range: "All time"
4. Klik: "Clear data"
```

**Step 2: Hard Refresh**
```
1. Tekan: Ctrl + F5 (hard refresh)
2. Atau: Shift + Click Refresh button
```

**Step 3: Test**
```
1. Login ke dashboard
2. Klik menu "Alert Settings" (icon 🔔)
3. View should appear!
```

---

## 🔧 Jika Masih Tidak Muncul

### Test UI Components

Buka test page untuk diagnosa:
```
https://eyes.indoinfinite.com/static/alert-ui-test.html
```

Click semua tombol test:
- ✅ Semua hijau = Masalahnya cache, clear cache lagi
- ❌ Ada merah = Ikuti instruksi di bawah

---

## 🐛 Debug Mode

### Check Browser Console

```
1. Tekan F12
2. Tab "Console"
3. Refresh page (Ctrl+F5)
4. Click "Alert Settings" menu
5. Lihat output [DEBUG] messages
```

**Expected output:**
```
[DEBUG] Menu clicked: alerts
[DEBUG] ========== Showing Alerts View ==========
[DEBUG] Total content views found: 5
[DEBUG] alertsView element: <div id="alertsView"...>
[DEBUG] ========== Initializing Alerts View ==========
```

**If you see:**
- ❌ "showAlertsView is not defined" → Cache belum di-clear
- ❌ "alertsView element NOT FOUND" → Restart container
- ❌ "Failed to fetch /api/alerts/config" → Backend tidak running

---

## 🔄 Restart Container

```bash
# Restart
docker-compose -f docker-compose.ssl.yml restart backend

# Check logs
docker-compose -f docker-compose.ssl.yml logs -f backend

# Wait for: "Running on https://..."
```

Lalu clear cache browser dan refresh.

---

## 📞 Still Not Working?

Read full troubleshooting guide:
```
ALERT-UI-TROUBLESHOOT.md
```

Atau jalankan diagnostic:

```bash
# Windows
fix-alert-ui.bat

# Linux/Mac
chmod +x fix-alert-ui.sh
./fix-alert-ui.sh
```

---

## 📚 Documentation

- **User Guide**: `ALERT-UI-GUIDE.md`
- **Quick Reference**: `ALERT-UI-QUICKREF.md`
- **Troubleshooting**: `ALERT-UI-TROUBLESHOOT.md`
- **Implementation**: `ALERT-UI-IMPLEMENTATION-SUMMARY.md`

---

## ✅ Success Indicators

Ketika berhasil, Anda akan melihat:

1. **Page shows**:
   ```
   - 4 statistics cards (Total Alerts, Unresolved, etc.)
   - Alert Rules Configuration form
   - Notification Channels section (with "Add Channel" button)
   - Alert History section
   ```

2. **Console shows**:
   ```
   [DEBUG] ========== Showing Alerts View ==========
   [DEBUG] ========== Initializing Alerts View ==========
   ```

3. **No red errors in console**

---

**TL;DR**: Clear browser cache (Ctrl+Shift+Delete) → Hard refresh (Ctrl+F5) → Done! ✅

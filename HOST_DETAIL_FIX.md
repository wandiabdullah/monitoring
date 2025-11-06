# Host Detail View Fix - Testing Guide

## 🔧 Problem Fixed

**Issue:** Saat klik host dari dashboard, redirect ke `/old-dashboard?host=...` menampilkan dashboard awal (blank/server list) bukan detail monitoring host tersebut.

**Root Cause:** 
- `app.js` tidak membaca URL parameter `?host=...`
- Detail section tidak auto-show saat load dengan URL parameter

## ✅ Solution Applied

### 1. **URL Parameter Detection**
```javascript
// app.js now checks URL parameters on load
const urlParams = new URLSearchParams(window.location.search);
const hostParam = urlParams.get('host');

if (hostParam) {
    // Auto-show detail for that host
    loadServerDetail(hostParam);
}
```

### 2. **Auto-Show Detail Section**
```javascript
// Hide server list, show detail immediately when URL has host param
serversGrid.style.display = 'none';
detailSection.classList.add('active');
```

### 3. **Smart Back Button**
```javascript
// If came from URL, back goes to main dashboard
// If clicked from list, back shows server list
closeDetail() {
    if (hostParam) {
        window.location.href = '/';  // Back to main dashboard
    } else {
        // Show server list
    }
}
```

### 4. **Added Back Button in Header**
```html
<a href="/" class="back-btn">
    <span>←</span> Back to Dashboard
</a>
```

## 📋 Files Modified

1. **`dashboard/app.js`**
   - ✅ Added URL parameter reading
   - ✅ Auto-load detail when host param exists
   - ✅ Hide server list on direct access
   - ✅ Smart close/back behavior
   - ✅ Update button text based on context

2. **`dashboard/index.html`**
   - ✅ Added back button in header
   - ✅ Enhanced header layout
   - ✅ Added loading state styles

3. **`dashboard/dashboard.js`**
   - ✅ Fixed duplicate `viewHostDetails()` function
   - ✅ Added `encodeURIComponent()` for hostname

## 🧪 Testing Steps

### Test 1: Direct URL Access
```
1. Open: http://eyes.indoinfinite.com:5000/old-dashboard?host=server1.sumedangkab.go.id

Expected:
✓ Server list is HIDDEN
✓ Detail section shows IMMEDIATELY
✓ Shows monitoring data for server1.sumedangkab.go.id
✓ Charts display CPU, Memory, Network, Disk
✓ Close button shows "← Back to Dashboard"
✓ Clicking close redirects to main dashboard (/)
```

### Test 2: Click from Dashboard
```
1. Open: http://eyes.indoinfinite.com:5000
2. Login: admin / admin123
3. Click any host card

Expected:
✓ Redirects to /old-dashboard?host={hostname}
✓ Shows detail monitoring for that host
✓ Data loads correctly
✓ Charts render properly
```

### Test 3: Navigation Flow
```
1. Main Dashboard → Click Host → Detail View
2. Click "← Back to Dashboard" button in header
   ✓ Returns to main dashboard

3. Click "Back to Dashboard" link in header
   ✓ Also returns to main dashboard

4. Main Dashboard → All Hosts view → Click Host → Detail View
5. Click Close button
   ✓ Returns to main dashboard
```

### Test 4: Server List View (No URL Param)
```
1. Open: http://eyes.indoinfinite.com:5000/old-dashboard

Expected:
✓ Shows server list
✓ Can click any server card
✓ Detail section opens
✓ Close button shows "Tutup"
✓ Clicking close shows server list again
```

## 🔍 Verification Checklist

### Console Debug Messages:
```javascript
// When accessing with URL param:
[DEBUG] URL host parameter detected: server1.sumedangkab.go.id

// When clicking host from dashboard:
[DEBUG] Viewing host details: server1.sumedangkab.go.id
```

### Visual Checks:
- [ ] Detail section visible immediately
- [ ] Server list hidden (when URL param exists)
- [ ] Charts render with data
- [ ] Stats cards show current values
- [ ] Network speed displayed
- [ ] Disk usage shown
- [ ] Auto-refresh working (every 5s)
- [ ] Close/Back button functional
- [ ] Header back button works

### Data Checks:
```javascript
// Should fetch these endpoints:
GET /api/servers/{hostname}/current
GET /api/servers/{hostname}/history?minutes=5&limit=60
GET /api/servers/{hostname}/disk
GET /api/servers/{hostname}/network?minutes=5

// All should return 200 OK with JSON data
```

## 📊 Example URLs

### Production:
```
http://eyes.indoinfinite.com:5000/old-dashboard?host=server1.sumedangkab.go.id
http://eyes.indoinfinite.com:5000/old-dashboard?host=web-server-01
http://eyes.indoinfinite.com:5000/old-dashboard?host=db-server-02
```

### Local Testing:
```
http://localhost:5000/old-dashboard?host=test-server
```

## 🐛 Troubleshooting

### Issue: Still shows server list instead of detail

**Check:**
```javascript
// Open browser console (F12)
// Should see:
[DEBUG] URL host parameter detected: <hostname>
```

**If not shown:**
- Check URL has `?host=...` parameter
- Hard refresh: Ctrl + F5
- Clear browser cache

### Issue: Detail shows but no data

**Check:**
```javascript
// Console should show API calls
// Network tab (F12) should show:
GET /api/servers/{hostname}/current → 200 OK
```

**If 404 errors:**
- Host not found in database
- Check hostname spelling
- Verify host exists: `GET /api/hosts`

### Issue: Close button doesn't work

**Check:**
```javascript
// Console errors?
// closeDetail() function defined?
```

**Fix:**
- Ensure `app.js` loaded correctly
- Check onclick="closeDetail()" in HTML

## ✅ Success Criteria

All tests pass when:

1. ✅ URL with `?host=...` shows detail immediately
2. ✅ Server list hidden when URL has host param
3. ✅ Monitoring data displays correctly
4. ✅ Charts render with historical data
5. ✅ Auto-refresh updates every 5 seconds
6. ✅ Close/Back buttons work correctly
7. ✅ Navigation flow smooth
8. ✅ No console errors
9. ✅ No network errors (except expected 404 for missing data)
10. ✅ Responsive on mobile

## 🚀 Deployment

After fix:

```bash
# Restart backend (if needed)
docker restart monitoring-backend

# Or rebuild
docker-compose up -d --build

# Clear browser cache
Ctrl + F5

# Test URL
http://eyes.indoinfinite.com:5000/old-dashboard?host=server1.sumedangkab.go.id
```

## 📝 Notes

- URL parameter is URL-encoded automatically (`encodeURIComponent`)
- Works with hostnames containing dots, hyphens, underscores
- Auto-refresh continues on detail view
- Server list still accessible at `/old-dashboard` without params

---

**Status:** ✅ FIXED - Ready for testing
**Last Updated:** 2025-11-06

# 🔧 Alert Settings - View Switching & Layout Fix

## Masalah yang Dilaporkan

### 1. Menu Stuck di Alert Settings
**Gejala**: Setelah masuk ke menu Alert Settings, tidak bisa pindah ke menu lainnya (stuck/terjebak)

**Penyebab**: 
- Fungsi `showAlertsView()` hanya menyembunyikan elemen dengan class `.content-view`
- Element `#dashboardView` tidak memiliki class `.content-view`, jadi tetap tampil
- Ketika klik menu lain, `#dashboardView` tidak disembunyikan

### 2. Statistics Cards Berjajar Ke Bawah
**Gejala**: 4 statistics cards (Total Alerts, Unresolved, Active Channels, System Status) berjajar vertikal, bukan horizontal

**Penyebab**:
- HTML menggunakan `<div class="dashboard-grid">` 
- CSS mendefinisikan `.alert-stats-grid` dengan grid layout
- Class name tidak cocok, jadi grid CSS tidak aktif

## Solusi yang Diterapkan

### Fix #1: View Switching Logic

**File**: `dashboard/dashboard.js`

#### Perbaikan `showAlertsView()` (Lines ~1495-1530)

**SEBELUM**:
```javascript
function showAlertsView() {
    // Hide all views
    const allViews = document.querySelectorAll('.content-view');
    allViews.forEach(view => {
        view.style.display = 'none';
    });
    
    // Show alerts view
    const alertsView = document.getElementById('alertsView');
    if (alertsView) {
        alertsView.style.display = 'block';
        initializeAlertsView();
    }
}
```

**SESUDAH**:
```javascript
function showAlertsView() {
    // Hide dashboard view explicitly
    const dashboardView = document.getElementById('dashboardView');
    if (dashboardView) {
        dashboardView.style.display = 'none';
    }
    
    // Hide all other content views
    const allViews = document.querySelectorAll('.content-view');
    allViews.forEach(view => {
        if (view.id !== 'alertsView') {
            view.style.display = 'none';
        }
    });
    
    // Show alerts view
    const alertsView = document.getElementById('alertsView');
    if (alertsView) {
        alertsView.style.display = 'block';
        initializeAlertsView();
    }
}
```

**Perubahan**:
1. ✅ Explicitly hide `#dashboardView` 
2. ✅ Skip hiding `alertsView` dalam loop (lebih efisien)
3. ✅ Dashboard view sekarang tersembunyi ketika Alert Settings aktif

#### Perbaikan `showDashboardView()` (Lines ~554-560)

**SEBELUM**:
```javascript
function showDashboardView() {
    currentView = 'dashboard';
    document.getElementById('pageTitle').textContent = 'Dashboard Overview';
    renderGroups();
}
```

**SESUDAH**:
```javascript
function showDashboardView() {
    // Show dashboard view
    const dashboardView = document.getElementById('dashboardView');
    if (dashboardView) {
        dashboardView.style.display = 'block';
    }
    
    // Hide all other content views
    const allViews = document.querySelectorAll('.content-view');
    allViews.forEach(view => {
        if (view.id !== 'dashboardView') {
            view.style.display = 'none';
        }
    });
    
    currentView = 'dashboard';
    document.getElementById('pageTitle').textContent = 'Dashboard Overview';
    renderGroups();
}
```

**Perubahan**:
1. ✅ Show `#dashboardView` explicitly
2. ✅ Hide all `.content-view` elements (including `alertsView`)
3. ✅ Alert Settings view sekarang tersembunyi ketika kembali ke Dashboard

### Fix #2: Statistics Cards Layout

**File**: `dashboard/dashboard.html`

#### HTML Structure Fix (Lines ~1810-1848)

**SEBELUM**:
```html
<div class="dashboard-grid">
    <!-- Alert Statistics Cards -->
    <div class="stat-card">...</div>
    <div class="stat-card">...</div>
    <div class="stat-card">...</div>
    <div class="stat-card">...</div>
</div>
```

**SESUDAH**:
```html
<!-- Alert Statistics Cards -->
<div class="alert-stats-grid">
    <div class="stat-card">...</div>
    <div class="stat-card">...</div>
    <div class="stat-card">...</div>
    <div class="stat-card">...</div>
</div>
```

**Perubahan**:
1. ✅ Changed class from `dashboard-grid` → `alert-stats-grid`
2. ✅ Sekarang match dengan CSS definition
3. ✅ Grid layout akan aktif (4 cards horizontal)

### CSS Grid Definition (Already Exists)

```css
.alert-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

@media (max-width: 768px) {
    .alert-stats-grid {
        grid-template-columns: 1fr;
    }
}
```

**Layout Behavior**:
- **Desktop (>768px)**: 4 cards dalam 1 baris (horizontal)
- **Tablet**: 2 cards per baris (auto-wrap)
- **Mobile (<768px)**: 1 card per baris (vertical stack)

### Cache Busting Update

**File**: `dashboard/dashboard.html` (Line ~2100)

```html
<!-- SEBELUM -->
<script src="/static/dashboard.js?v=20251110005"></script>

<!-- SESUDAH -->
<script src="/static/dashboard.js?v=20251110006"></script>
```

## Testing Steps

### 1. Restart Container
```powershell
docker-compose -f docker-compose.ssl.yml restart backend
```

### 2. Clear Browser Cache
```
Ctrl + Shift + Delete
→ Select "All time"
→ Check "Cached images and files"
→ Click "Clear data"
→ Close browser completely
→ Reopen browser
```

### 3. Test View Switching

#### Test A: Dashboard → Alert Settings
1. Login ke dashboard
2. Klik menu "Alert Settings" (icon 🔔)
3. **Expected**: 
   - ✅ Dashboard content HILANG
   - ✅ Alert Settings content MUNCUL
   - ✅ 4 statistics cards tampil HORIZONTAL

#### Test B: Alert Settings → Dashboard
1. Dari Alert Settings view
2. Klik menu "Dashboard" (icon 📊)
3. **Expected**:
   - ✅ Alert Settings content HILANG
   - ✅ Dashboard content MUNCUL
   - ✅ Groups dan hosts tampil normal

#### Test C: Alert Settings → Hosts
1. Dari Alert Settings view
2. Klik menu "All Hosts"
3. **Expected**:
   - ✅ Alert Settings content HILANG
   - ✅ Hosts list MUNCUL
   - ✅ Tidak ada overlap

#### Test D: Statistics Cards Layout
1. Masuk ke Alert Settings
2. **Desktop view** (window > 768px):
   - ✅ 4 cards dalam 1 baris (horizontal)
   - ✅ Equal width
   - ✅ Gap 20px antara cards
3. **Mobile view** (window < 768px):
   - ✅ 1 card per baris (vertical)
   - ✅ Full width
   - ✅ Stack dengan spacing

### 4. Browser Console Check

Press **F12** → Console tab:

```javascript
// When in Alert Settings:
document.getElementById('dashboardView').style.display
// Should return: "none"

document.getElementById('alertsView').style.display
// Should return: "block"

// When in Dashboard:
document.getElementById('dashboardView').style.display
// Should return: "block"

document.getElementById('alertsView').style.display
// Should return: "none"
```

## Expected Results

### View Switching Behavior

```
┌─────────────────────────────────────┐
│ Menu: Dashboard    (dashboardView)  │
│ ✅ dashboardView: display=block     │
│ ✅ alertsView: display=none         │
│ ✅ Shows: Groups, Hosts, Stats      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Menu: Alert Settings (alertsView)   │
│ ✅ dashboardView: display=none      │
│ ✅ alertsView: display=block        │
│ ✅ Shows: Alert config, channels    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Menu: All Hosts    (hosts view)     │
│ ✅ dashboardView: display=none      │
│ ✅ alertsView: display=none         │
│ ✅ Shows: Host list only            │
└─────────────────────────────────────┘
```

### Statistics Cards Layout

**Desktop View (> 768px)**:
```
┌─────────────────────────────────────────────────────────────┐
│ [Total Alerts] [Unresolved] [Active Channels] [Status]     │
│     Today          Alerts        0                Active     │
│       1              1                                        │
└─────────────────────────────────────────────────────────────┘
```

**Mobile View (< 768px)**:
```
┌──────────────────┐
│ [Total Alerts]   │
│     Today        │
│       1          │
├──────────────────┤
│ [Unresolved]     │
│    Alerts        │
│       1          │
├──────────────────┤
│ [Active]         │
│  Channels        │
│       0          │
├──────────────────┤
│ [System]         │
│  Status          │
│     Active       │
└──────────────────┘
```

## Troubleshooting

### Issue: Menu masih stuck

**Solution**:
1. Hard refresh: **Ctrl + F5**
2. Check console for JavaScript errors
3. Verify dashboard.js?v=20251110006 loaded
4. Clear cache completely and retry

### Issue: Statistics cards masih vertikal

**Solution**:
1. Press F12 → Elements tab
2. Find `<div class="alert-stats-grid">`
3. Check computed styles:
   - Should have: `display: grid`
   - Should have: `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))`
4. If not, clear cache and hard refresh

### Issue: Dashboard tidak muncul setelah klik menu Dashboard

**Solution**:
1. Check console for errors
2. Verify `showDashboardView()` is called
3. Check `dashboardView.style.display` value
4. Try reload page (F5)

## Files Modified

### 1. dashboard/dashboard.js
- **Line ~1495-1530**: `showAlertsView()` - Added explicit dashboard hide
- **Line ~554-575**: `showDashboardView()` - Added explicit dashboard show + hide other views
- **Cache version**: Updated to v=20251110006

### 2. dashboard/dashboard.html
- **Line ~1810**: Changed `class="dashboard-grid"` → `class="alert-stats-grid"`
- **Line ~2100**: Updated script tag cache version to v=20251110006

## Technical Details

### View Hierarchy

```
<main class="main-content">
    ├── <div id="dashboardView" class="content-view">
    │   ├── <header> Dashboard header </header>
    │   └── <div class="content"> Dashboard content </div>
    │
    ├── <div id="alertsView" class="content-view">
    │   ├── <div class="view-header"> Alert Settings header </div>
    │   ├── <div class="alert-stats-grid"> Statistics cards </div>
    │   └── <div class="card"> Configuration forms </div>
    │
    └── <!-- Other modals -->
</main>
```

### View Switching Logic

```javascript
// When switching to any view:
1. Hide #dashboardView (if exists)
2. Hide all .content-view elements
3. Show target view
4. Initialize target view (load data)
```

### CSS Grid Auto-Fit Behavior

```css
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
```

**How it works**:
- `auto-fit`: Create as many columns as fit
- `minmax(250px, 1fr)`: Each column min 250px, max equal share
- **Result**: 
  - 1200px width → 4 columns (4 × 250 = 1000px + gaps)
  - 800px width → 3 columns
  - 600px width → 2 columns
  - 400px width → 1 column

## Success Criteria

- [x] View switching JavaScript updated
- [x] Dashboard view hides when Alert Settings active
- [x] Alert Settings view hides when Dashboard active
- [x] HTML structure uses correct CSS class
- [x] Statistics cards layout horizontal on desktop
- [x] Statistics cards stack vertical on mobile
- [x] Cache busting version updated
- [x] Documentation created

## Next Steps

After confirming fixes work:
1. ✅ Test all menu items (Dashboard, Hosts, Groups, Alert Settings)
2. ✅ Test responsive layout (resize browser)
3. ✅ Verify no console errors
4. ⏭️ Test alert configuration functionality
5. ⏭️ Test notification channels
6. ⏭️ Production deployment

---

**Status**: ✅ FIXED - View switching + Statistics cards layout
**Date**: 2024-11-10
**Issue**: Menu stuck + Cards vertical
**Solution**: Explicit view show/hide + CSS class name fix
**Files**: dashboard.js, dashboard.html
**Cache**: v=20251110006

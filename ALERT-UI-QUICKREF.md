# Alert Management UI - Quick Reference

## 🚀 Akses Cepat

```
1. Buka: https://eyes.indoinfinite.com
2. Login dengan akun admin
3. Klik menu "Alert Settings" (icon 🔔)
```

---

## ⚙️ Set Alert Thresholds (30 detik)

```
1. Di Alert Rules Configuration card
2. Atur nilai threshold:
   - CPU: 70% (default)
   - Disk: 90% (default)
   - Memory: 90% (default)
   - Server Down: 60 detik
   - Network Timeout: 60 detik
   - Cooldown: 300 detik (5 menit)
3. Klik "Save Configuration"
```

---

## 📧 Setup Email (2 menit)

### Gmail

```
1. Generate App Password:
   https://myaccount.google.com/apppasswords

2. Di dashboard:
   - Click "Add Channel"
   - Type: Email
   - SMTP Server: smtp.gmail.com
   - Port: 587
   - Username: your@gmail.com
   - Password: [16-digit app password]
   - From: your@gmail.com
   - To: admin@company.com
   - Click "Test Notification"
   - If OK → Click "Save Channel"
```

### Office 365

```
   - SMTP Server: smtp.office365.com
   - Port: 587
   - Username: your@company.com
   - Password: [account password]
   - Rest sama dengan Gmail
```

---

## 🤖 Setup Telegram (3 menit)

### Step 1: Create Bot

```
1. Chat ke @BotFather di Telegram
2. Kirim: /newbot
3. Nama bot: MonitorHub Alert Bot
4. Username: MonitorHubAlertBot (atau apapun available)
5. Copy token yang diberikan:
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
```

### Step 2: Get Chat ID

**Personal Chat:**
```
1. Chat ke bot Anda: /start
2. Buka browser:
   https://api.telegram.org/bot<TOKEN>/getUpdates
   (ganti <TOKEN> dengan token bot Anda)
3. Cari: "chat":{"id": 123456789}
4. Copy angka 123456789
```

**Group Chat:**
```
1. Add bot ke group
2. Kirim pesan: /start
3. Buka browser:
   https://api.telegram.org/bot<TOKEN>/getUpdates
4. Cari: "chat":{"id": -1001234567890}
5. Copy angka -1001234567890 (dengan minus)
```

### Step 3: Configure di Dashboard

```
1. Click "Add Channel"
2. Type: Telegram
3. Bot Token: [paste token dari BotFather]
4. Chat ID: [paste chat ID dari getUpdates]
5. Click "Test Notification"
6. Check Telegram untuk pesan test
7. If OK → Click "Save Channel"
```

---

## 💬 Setup WhatsApp (5 menit)

### Option A: Fonnte (Recommended untuk Indonesia)

```
1. Daftar di: https://fonnte.com
2. Pilih paket: Rp 80.000/bulan unlimited
3. Connect nomor WhatsApp Anda
4. Copy API Token dari dashboard

5. Di MonitorHub:
   - Click "Add Channel"
   - Type: WhatsApp
   - Provider: Fonnte
   - API Key: [paste token fonnte]
   - Target: 628123456789 (62 + nomor tanpa 0)
   - Click "Test Notification"
   - Check WhatsApp
   - If OK → Click "Save Channel"
```

### Option B: Twilio (International)

```
1. Daftar di: https://www.twilio.com/try-twilio
2. Get WhatsApp Sandbox number
3. Copy Account SID dan Auth Token

4. Di MonitorHub:
   - Click "Add Channel"
   - Type: WhatsApp
   - Provider: Twilio
   - Account SID: [paste SID]
   - Auth Token: [paste token]
   - From: +14155238886 (Twilio sandbox number)
   - To: +628123456789 (format: + kode negara + nomor)
   - Click "Test Notification"
   - Check WhatsApp
   - If OK → Click "Save Channel"
```

---

## 🔍 View Alert History

```
1. Scroll ke "Alert History" card
2. Lihat 20 alert terakhir
3. Color codes:
   - 🔴 Red border = Critical (server down, disk full)
   - 🟠 Orange border = Warning (high CPU/memory)
   - 🔵 Blue border = Info
4. Click "Mark as Resolved" untuk close alert
5. Click "Refresh" untuk reload
```

---

## 📊 Monitor Statistics

Di bagian atas, 4 cards menampilkan:

```
┌─────────────────┬─────────────────┐
│ Total Alerts    │ Unresolved      │
│ Today: 5        │ Alerts: 2       │
├─────────────────┼─────────────────┤
│ Active Channels │ System Status   │
│ 3               │ Active          │
└─────────────────┴─────────────────┘
```

- **Total Alerts Today**: Semua alert hari ini
- **Unresolved Alerts**: Alert yang masih aktif
- **Active Channels**: Channel yang enabled
- **System Status**: Active (hijau) atau Disabled (merah)

---

## 🧪 Test Notifications

### Test Before Save (New Channel)

```
1. Fill form dengan config
2. Click "Test Notification" (jangan save dulu)
3. Check email/telegram/whatsapp
4. Jika berhasil → Click "Save Channel"
5. Jika gagal → Fix config → Test lagi
```

### Test Existing Channel

```
1. Di channel list, click icon "✈️" (paper plane)
2. System kirim test notification
3. Check notification received
```

**Test Message:**
```
🔔 Test Notification

This is a test message from MonitorHub Alert System.
If you receive this, your notification channel is working correctly!
```

---

## 🔧 Common Tasks

### Disable Alert System
```
1. Uncheck "Enable Alerts"
2. Click "Save Configuration"
3. System Status → "Disabled"
```

### Change Threshold
```
1. Update nilai (misal CPU dari 70% → 80%)
2. Click "Save Configuration"
3. Threshold langsung aktif
```

### Delete Channel
```
1. Di channel list, click "🗑️" (trash icon)
2. Confirm deletion
3. Channel removed
```

### Adjust Cooldown
```
Terlalu banyak notifikasi?
1. Naikkan Cooldown Period dari 300 → 600 detik
2. Save Configuration
3. Alert hanya kirim max 1x per 10 menit untuk kondisi sama
```

---

## ⚠️ Troubleshooting

### Email Tidak Terkirim

**Gmail:**
```
✗ "Authentication failed"
→ Gunakan App Password, bukan password akun
→ Generate di: https://myaccount.google.com/apppasswords
```

**Port Issue:**
```
✗ "Connection timeout"
→ Coba port 587 (TLS) atau 465 (SSL)
→ Jangan gunakan port 25
```

### Telegram Tidak Terkirim

```
✗ "Unauthorized (401)"
→ Bot token salah atau expired
→ Generate token baru dari @BotFather

✗ "Chat not found (400)"
→ Chat ID salah atau bot belum di-start
→ Personal: chat /start ke bot dulu
→ Group: add bot ke group, kirim /start
```

### WhatsApp Tidak Terkirim

**Fonnte:**
```
✗ "Invalid API key"
→ Check API key di dashboard fonnte.com
→ Format nomor: 628xxx (62 + nomor tanpa 0)

✗ "Insufficient balance"
→ Top up saldo di fonnte.com
```

**Twilio:**
```
✗ "Authentication error"
→ Check Account SID dan Auth Token
→ Format nomor: +628xxx (pakai + dan kode negara)
```

---

## 🎯 Best Practices

### Multi-Channel Strategy
```
Setup minimal 2 channels:
1. Email - untuk dokumentasi/audit
2. Telegram - untuk notifikasi real-time

Bonus:
3. WhatsApp - untuk on-call engineer
```

### Threshold Guidelines

**Conservative (untuk awal):**
```
CPU: 80-90%
Memory: 90-95%
Disk: 85-90%
```

**Aggressive (production critical):**
```
CPU: 70-80%
Memory: 85-90%
Disk: 75-85%
```

### Cooldown Settings

```
High Priority (Server Down): 300 detik (5 menit)
Medium Priority (CPU/Memory): 600 detik (10 menit)
Low Priority (Disk): 1800 detik (30 menit)
```

---

## 📱 Mobile Access

UI responsive untuk mobile:

```
1. Buka browser mobile
2. Login ke https://eyes.indoinfinite.com
3. Menu sidebar → slide dari kiri
4. Semua fungsi available di mobile
```

---

## 🔐 Security Notes

```
✓ Gunakan strong password untuk dashboard
✓ Jangan share screenshot dengan token/API key
✓ Rotate API key/token secara berkala
✓ Limit recipients (jangan broadcast ke semua)
✓ Enable 2FA di Gmail/Telegram jika available
```

---

## 🆘 Quick Support Commands

### Check System Status
```bash
curl -k https://eyes.indoinfinite.com/api/alerts/config
```

### Check Channels
```bash
curl -k https://eyes.indoinfinite.com/api/alerts/channels
```

### Check Recent Alerts
```bash
curl -k https://eyes.indoinfinite.com/api/alerts/history?limit=5
```

### Check Stats
```bash
curl -k https://eyes.indoinfinite.com/api/alerts/stats
```

### Restart Alert System
```bash
docker-compose -f docker-compose.ssl.yml restart backend
```

---

## 📚 Documentation

**User Guide**: ALERT-UI-GUIDE.md (detailed tutorial)
**Implementation**: ALERT-UI-IMPLEMENTATION-SUMMARY.md (technical)
**Backend Setup**: ALERT-SETUP-GUIDE.md (server config)

---

## ✅ Quick Checklist

Setup lengkap dalam 5 menit:

```
□ Login ke dashboard
□ Buka Alert Settings
□ Set thresholds (gunakan default dulu)
□ Add Telegram channel
  □ Create bot di @BotFather
  □ Get chat ID
  □ Configure di dashboard
  □ Test notification
  □ Save channel
□ Monitor alert history
□ Done! System monitoring.
```

---

**Tips**: Start dengan Telegram karena paling cepat dan gratis. Add Email setelahnya untuk audit trail.

**Support**: Check ALERT-UI-GUIDE.md untuk troubleshooting detail.

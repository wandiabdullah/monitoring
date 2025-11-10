# 🚨 ALERT SYSTEM SETUP GUIDE

Panduan lengkap untuk mengkonfigurasi sistem alerting dengan notifikasi via Email, Telegram, dan WhatsApp.

---

## 📋 FITUR ALERT

Sistem akan mengirim alert otomatis jika:

1. **Server Down**: Tidak ada data selama 60 detik (default, bisa diubah)
2. **CPU High**: CPU usage > 70% (default, bisa diubah)
3. **Disk Full**: Disk usage > 90% (default, bisa diubah)
4. **Memory High**: Memory usage > 90% (default, bisa diubah)
5. **Network Timeout**: Network tidak respon selama 60 detik

**Notification Channels:**
- ✉️ Email (SMTP)
- 📱 Telegram Bot
- 💬 WhatsApp (via Twilio atau Fonnte.com)

---

## 🔧 KONFIGURASI ALERT RULES

### Default Configuration:

```python
{
    "enabled": true,
    "server_down_timeout": 60,      # seconds
    "cpu_threshold": 70,             # percent
    "disk_threshold": 90,            # percent
    "memory_threshold": 90,          # percent
    "network_timeout": 60,           # seconds
    "cooldown_period": 300           # seconds (5 minutes)
}
```

### Mengubah Configuration:

Via Dashboard (setelah UI selesai) atau via API:

```bash
curl -X PUT https://eyes.indoinfinite.com/api/alerts/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": 1,
    "server_down_timeout": 120,
    "cpu_threshold": 80,
    "disk_threshold": 85,
    "memory_threshold": 85,
    "cooldown_period": 600
  }'
```

---

## 📧 EMAIL NOTIFICATION SETUP

### 1. Gmail Setup (Recommended)

**Step 1: Enable 2-Factor Authentication**
- Buka https://myaccount.google.com/security
- Enable 2-Step Verification

**Step 2: Create App Password**
- Buka https://myaccount.google.com/apppasswords
- Select app: "Mail"
- Select device: "Other" → Nama: "Monitoring System"
- Copy password yang di-generate (16 karakter)

**Step 3: Configure di Dashboard**

```json
{
  "channel_type": "email",
  "config": {
    "smtp_server": "smtp.gmail.com",
    "smtp_port": 587,
    "username": "your-email@gmail.com",
    "password": "your-app-password",
    "from_email": "your-email@gmail.com",
    "to_emails": ["recipient1@email.com", "recipient2@email.com"]
  },
  "enabled": 1
}
```

**Test Email:**
```bash
curl -X POST https://eyes.indoinfinite.com/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{
    "channel_type": "email",
    "config": {
      "smtp_server": "smtp.gmail.com",
      "smtp_port": 587,
      "username": "your-email@gmail.com",
      "password": "your-app-password",
      "from_email": "your-email@gmail.com",
      "to_emails": ["test@email.com"]
    }
  }'
```

### 2. Custom SMTP Server

Untuk SMTP server lain (Office 365, SendGrid, Mailgun, dll):

```json
{
  "channel_type": "email",
  "config": {
    "smtp_server": "smtp.office365.com",
    "smtp_port": 587,
    "username": "your-email@company.com",
    "password": "your-password",
    "from_email": "monitoring@company.com",
    "to_emails": ["admin@company.com"]
  },
  "enabled": 1
}
```

**Common SMTP Settings:**

| Provider | SMTP Server | Port | TLS |
|----------|-------------|------|-----|
| Gmail | smtp.gmail.com | 587 | Yes |
| Office 365 | smtp.office365.com | 587 | Yes |
| Yahoo | smtp.mail.yahoo.com | 587 | Yes |
| SendGrid | smtp.sendgrid.net | 587 | Yes |
| Mailgun | smtp.mailgun.org | 587 | Yes |

---

## 📱 TELEGRAM NOTIFICATION SETUP

### Step 1: Create Telegram Bot

1. **Open Telegram** dan search "@BotFather"
2. **Send command:** `/newbot`
3. **Nama bot:** "Server Monitoring Alert"
4. **Username bot:** "your_monitoring_alert_bot" (harus unique)
5. **Copy Bot Token** yang diberikan (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Get Chat ID

**Option A: Manual**
1. Add bot ke group atau chat pribadi
2. Send message: `/start`
3. Buka browser: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Cari `"chat":{"id":123456789}` → copy ID tersebut

**Option B: Via @userinfobot**
1. Search "@userinfobot" di Telegram
2. Start chat
3. Bot akan reply dengan Your ID
4. Gunakan ID tersebut

### Step 3: Configure di Dashboard

```json
{
  "channel_type": "telegram",
  "config": {
    "bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
    "chat_id": "123456789"
  },
  "enabled": 1
}
```

**For Group Chat:**
- Chat ID akan negative (e.g., `-123456789`)
- Bot harus di-add ke group dulu

**Test Telegram:**
```bash
curl -X POST https://eyes.indoinfinite.com/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{
    "channel_type": "telegram",
    "config": {
      "bot_token": "YOUR_BOT_TOKEN",
      "chat_id": "YOUR_CHAT_ID"
    }
  }'
```

---

## 💬 WHATSAPP NOTIFICATION SETUP

### Option 1: Twilio (International - Recommended)

**Step 1: Create Twilio Account**
1. Sign up di https://www.twilio.com/try-twilio
2. Verify phone number
3. Get free trial credit ($15)

**Step 2: Enable WhatsApp Sandbox**
1. Buka Twilio Console → Messaging → Try it out → Try WhatsApp
2. Join sandbox dengan send message ke Twilio WhatsApp number
3. Send code yang diminta (e.g., "join <code>")

**Step 3: Get Credentials**
- Account SID: dari Dashboard
- Auth Token: dari Dashboard
- From Number: `whatsapp:+14155238886` (Twilio sandbox)
- To Number: `whatsapp:+6281234567890` (your number dengan country code)

**Step 4: Configure di Dashboard**

```json
{
  "channel_type": "whatsapp",
  "config": {
    "provider": "twilio",
    "account_sid": "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "auth_token": "your_auth_token",
    "from_number": "whatsapp:+14155238886",
    "to_number": "whatsapp:+6281234567890"
  },
  "enabled": 1
}
```

**For Production (Paid):**
- Apply for WhatsApp Business API
- Get approved WhatsApp sender number
- Replace from_number dengan your WhatsApp Business number

---

### Option 2: Fonnte.com (Indonesia - Lebih Mudah)

**Step 1: Register di Fonnte.com**
1. Buka https://fonnte.com
2. Register akun baru
3. Login ke Dashboard

**Step 2: Connect WhatsApp**
1. Scan QR Code dengan WhatsApp kamu
2. WhatsApp kamu akan jadi sender

**Step 3: Get API Key**
1. Menu "Setting" → "API Key"
2. Copy API Key

**Step 4: Configure di Dashboard**

```json
{
  "channel_type": "whatsapp",
  "config": {
    "provider": "fonnte",
    "api_key": "your_fonnte_api_key",
    "target": "6281234567890"
  },
  "enabled": 1
}
```

**Notes:**
- Target tanpa "+" dan "whatsapp:" prefix
- Biaya mulai Rp 80.000/bulan (unlimited)
- Lebih mudah untuk Indonesia

**Test WhatsApp:**
```bash
curl -X POST https://eyes.indoinfinite.com/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{
    "channel_type": "whatsapp",
    "config": {
      "provider": "fonnte",
      "api_key": "YOUR_API_KEY",
      "target": "6281234567890"
    }
  }'
```

---

## 🔧 API ENDPOINTS

### Get Alert Configuration
```bash
GET /api/alerts/config
```

### Update Alert Configuration
```bash
PUT /api/alerts/config
Content-Type: application/json

{
  "enabled": 1,
  "server_down_timeout": 60,
  "cpu_threshold": 70,
  "disk_threshold": 90,
  "memory_threshold": 90,
  "cooldown_period": 300
}
```

### Get Notification Channels
```bash
GET /api/alerts/channels
```

### Save Notification Channel
```bash
POST /api/alerts/channels
Content-Type: application/json

{
  "channel_type": "email|telegram|whatsapp",
  "config": { ... },
  "enabled": 1
}
```

### Delete Notification Channel
```bash
DELETE /api/alerts/channels/<channel_id>
```

### Test Notification
```bash
POST /api/alerts/test
Content-Type: application/json

{
  "channel_type": "email|telegram|whatsapp",
  "config": { ... }
}
```

### Get Alert History
```bash
GET /api/alerts/history?limit=100&hostname=server1
```

### Get Unresolved Alerts
```bash
GET /api/alerts/unresolved?hostname=server1
```

### Resolve Alert
```bash
POST /api/alerts/<alert_id>/resolve
```

### Get Alert Statistics
```bash
GET /api/alerts/stats
```

---

## 🎯 ALERT MESSAGE FORMAT

### Email Alert Example:
```
Subject: 🚨 Alert: CPU_HIGH - web-server-01

Server: web-server-01
Alert: HIGH CPU USAGE
Current: 85.5%
Threshold: 70%
Time: 2025-11-10 10:30:00 UTC
```

### Telegram Alert Example:
```
🚨 *Server Alert*

Server: web-server-01
Alert: HIGH CPU USAGE
Current: 85.5%
Threshold: 70%
Time: 2025-11-10 10:30:00 UTC
```

### WhatsApp Alert Example:
```
🚨 SERVER ALERT

Server: web-server-01
Alert: HIGH CPU USAGE
Current: 85.5%
Threshold: 70%
Time: 2025-11-10 10:30:00 UTC
```

---

## 📊 ALERT TYPES

| Alert Type | Severity | Default Threshold | Description |
|------------|----------|-------------------|-------------|
| server_down | critical | 60s | No data received from agent |
| cpu_high | warning | 70% | CPU usage exceeds threshold |
| memory_high | warning | 90% | Memory usage exceeds threshold |
| disk_high | warning | 90% | Disk usage exceeds threshold |
| network_timeout | warning | 60s | Network not responding |

---

## 🔄 COOLDOWN PERIOD

Alert system menggunakan cooldown period untuk mencegah spam notification:

- **Default:** 300 seconds (5 minutes)
- Alert yang sama tidak akan dikirim ulang dalam periode cooldown
- Setelah cooldown selesai, jika kondisi masih memenuhi threshold, alert baru akan dikirim

**Contoh:**
```
10:00:00 - CPU 80% → Alert dikirim
10:02:00 - CPU 85% → Tidak dikirim (masih dalam cooldown)
10:05:01 - CPU 82% → Alert dikirim lagi (cooldown selesai)
```

---

## 🐛 TROUBLESHOOTING

### Email tidak terkirim

**Error: "Authentication failed"**
- Pastikan username/password benar
- Gunakan App Password untuk Gmail (bukan password utama)
- Check 2FA enabled

**Error: "Connection refused"**
- Check SMTP server dan port
- Pastikan TLS/SSL enabled
- Check firewall tidak block port 587/465

### Telegram tidak terkirim

**Error: "Unauthorized"**
- Bot token salah
- Regenerate token di BotFather

**Error: "Chat not found"**
- Chat ID salah
- Bot belum di-add ke chat/group
- Send `/start` ke bot dulu

### WhatsApp tidak terkirim

**Twilio - "Sandbox not joined"**
- Join sandbox dulu dengan send message
- Verify phone number di Twilio

**Fonnte - "Invalid API key"**
- Check API key di dashboard Fonnte
- Pastikan subscription aktif

---

## ✅ BEST PRACTICES

1. **Test Notifications First**
   - Gunakan endpoint `/api/alerts/test` sebelum enable
   - Verify semua channels working

2. **Set Appropriate Thresholds**
   - CPU: 70-80% untuk web servers
   - Memory: 85-90% (leave room for spike)
   - Disk: 85-90% (give time to clean up)

3. **Configure Multiple Channels**
   - Email untuk documentation
   - Telegram/WhatsApp untuk real-time alert
   - Different recipients per channel

4. **Cooldown Period**
   - Minimum 5 minutes untuk avoid spam
   - 10-15 minutes untuk high-traffic systems

5. **Monitor Alert System**
   - Check alert history regularly
   - Tune thresholds berdasarkan false positives
   - Review resolved vs unresolved ratio

---

## 📞 SUPPORT

Jika ada issue:

1. Check logs: `docker-compose -f docker-compose.ssl.yml logs monitoring-backend`
2. Test individual channel dengan `/api/alerts/test`
3. Verify configuration di `/api/alerts/config`
4. Check alert history di `/api/alerts/history`

---

**NEXT:** Configure alert channels via Dashboard UI (coming soon)

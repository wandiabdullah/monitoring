# Alert Management UI - User Guide

## Overview

Alert Management UI menyediakan interface visual untuk mengelola sistem notifikasi alert monitoring server Anda.

## Akses Alert Settings

1. Login ke dashboard monitoring
2. Klik menu **"Alert Settings"** di sidebar (icon bell 🔔)
3. Halaman akan menampilkan 4 bagian utama:
   - **Statistics Cards** - Ringkasan alert hari ini dan status sistem
   - **Alert Rules Configuration** - Setting threshold alert
   - **Notification Channels** - Konfigurasi saluran notifikasi
   - **Alert History** - Riwayat alert yang terjadi

---

## 1. Alert Statistics Dashboard

Di bagian atas menampilkan 4 kartu statistik:

### Total Alerts Today
- Jumlah total alert yang triggered hari ini
- Semua jenis alert (CPU, Disk, Memory, Server Down, Network)

### Unresolved Alerts
- Alert yang masih aktif dan belum di-resolve
- Perlu perhatian segera

### Active Channels
- Jumlah saluran notifikasi yang aktif
- Email, Telegram, atau WhatsApp yang enabled

### System Status
- Status monitoring: **Active** atau **Disabled**
- Hijau = monitoring berjalan
- Merah = monitoring dinonaktifkan

---

## 2. Alert Rules Configuration

Configure threshold dan timeout untuk setiap jenis alert:

### Server Down Timeout
- **Default**: 60 detik
- **Deskripsi**: Alert jika server tidak mengirim data dalam waktu ini
- **Rekomendasi**: 60-120 detik (terlalu kecil = false alarm)

### CPU Usage Threshold
- **Default**: 70%
- **Deskripsi**: Alert jika CPU usage melebihi persentase ini
- **Rekomendasi**: 70-85% (sesuaikan dengan load normal server)

### Disk Usage Threshold
- **Default**: 90%
- **Deskripsi**: Alert jika disk space usage melebihi persentase ini
- **Rekomendasi**: 80-90% (beri waktu untuk cleanup)

### Memory Usage Threshold
- **Default**: 90%
- **Deskripsi**: Alert jika memory usage melebihi persentase ini
- **Rekomendasi**: 85-95% (tergantung aplikasi)

### Network Timeout
- **Default**: 60 detik
- **Deskripsi**: Alert jika network tidak merespon dalam waktu ini
- **Rekomendasi**: 60-120 detik

### Cooldown Period
- **Default**: 300 detik (5 menit)
- **Deskripsi**: Jeda minimum antar alert untuk kondisi yang sama
- **Rekomendasi**: 300-600 detik (cegah spam notifikasi)

### Cara Menyimpan
1. Ubah nilai sesuai kebutuhan
2. Klik tombol **"Save Configuration"**
3. Tunggu notifikasi sukses
4. Konfigurasi langsung aktif

---

## 3. Notification Channels Management

Kelola saluran notifikasi untuk menerima alert.

### Menambah Channel Baru

1. **Klik tombol "Add Channel"**
2. **Pilih Channel Type**:
   - **Email** - Via SMTP
   - **Telegram** - Via Bot API (gratis, real-time)
   - **WhatsApp** - Via Fonnte/Twilio (berbayar)

3. **Isi Konfigurasi Channel**

#### A. Email Configuration

**SMTP Server**: smtp.gmail.com (Gmail) atau smtp.office365.com (Office 365)

**SMTP Port**: 
- 587 (TLS - Recommended)
- 465 (SSL)
- 25 (Unencrypted - Not recommended)

**Username**: Email login Anda

**Password**: 
- Gmail: Gunakan App Password (bukan password akun)
- Office 365: Password akun

**From Email**: Email pengirim

**To Emails**: Email penerima (pisahkan dengan koma jika lebih dari 1)
```
admin@example.com, ops@example.com
```

**Cara Setup Gmail App Password**:
1. Buka https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Buka https://myaccount.google.com/apppasswords
4. Generate App Password untuk "Mail"
5. Gunakan 16-digit password yang dihasilkan

#### B. Telegram Configuration

**Bot Token**: Token dari BotFather
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
```

**Chat ID**: ID chat/group Telegram
```
-1001234567890  (untuk group, pakai minus)
123456789       (untuk personal chat)
```

**Cara Setup Telegram Bot**:

1. **Buat Bot**:
   ```
   1. Chat ke @BotFather di Telegram
   2. Ketik: /newbot
   3. Ikuti instruksi (nama bot, username)
   4. Copy token yang diberikan
   ```

2. **Dapatkan Chat ID**:
   
   **Untuk Personal Chat**:
   ```
   1. Chat ke bot Anda: /start
   2. Buka browser: https://api.telegram.org/bot<TOKEN>/getUpdates
   3. Cari "chat":{"id": 123456789}
   4. Copy angka ID-nya
   ```

   **Untuk Group Chat**:
   ```
   1. Tambahkan bot ke group
   2. Kirim pesan: /start
   3. Buka: https://api.telegram.org/bot<TOKEN>/getUpdates
   4. Cari "chat":{"id": -1001234567890}
   5. Copy angka ID (dengan minus)
   ```

#### C. WhatsApp Configuration

Pilih provider:

**FONNTE (Recommended untuk Indonesia)**

**API Key**: Token dari Fonnte.com

**Target Number**: Nomor WhatsApp tujuan
```
628123456789  (format: 62 + nomor tanpa 0)
```

**Biaya**: Rp 80.000/bulan unlimited pesan

**Cara Setup Fonnte**:
1. Daftar di https://fonnte.com
2. Pilih paket (Rp 80k/bulan)
3. Connect nomor WhatsApp Anda
4. Copy API Token dari dashboard
5. Format nomor: 628xxxx (62 + nomor tanpa 0 di depan)

---

**TWILIO (International)**

**Account SID**: SID dari Twilio Console

**Auth Token**: Token dari Twilio Console

**From Number**: Nomor WhatsApp Twilio
```
+14155238886  (Twilio Sandbox atau nomor aktif)
```

**To Number**: Nomor penerima
```
+628123456789
```

**Biaya**: $0.005 per pesan + biaya Twilio number

**Cara Setup Twilio**:
1. Daftar di https://www.twilio.com/try-twilio
2. Verifikasi nomor Anda
3. Get WhatsApp Sandbox number atau beli nomor
4. Copy Account SID dan Auth Token
5. Format: +628xxx (pakai + dan kode negara)

### Enable/Disable Channel

- Toggle **"Enable Channel"** checkbox
- Disabled channel tidak akan menerima notifikasi
- Berguna untuk testing atau maintenance

### Test Notification

1. Sebelum save, klik tombol **"Test Notification"**
2. System akan kirim test message:
   ```
   🔔 Test Notification
   This is a test message from MonitorHub Alert System.
   If you receive this, your notification channel is working correctly!
   ```
3. Cek email/telegram/whatsapp Anda
4. Jika berhasil, klik **"Save Channel"**
5. Jika gagal, periksa konfigurasi

### Edit/Delete Channel

- **Test Icon (✈️)**: Kirim test notification
- **Trash Icon (🗑️)**: Hapus channel
- **Badge**: Menunjukkan status Enabled/Disabled

---

## 4. Alert History

Menampilkan 20 alert terakhir dengan detail:

### Informasi Alert

- **Hostname**: Server yang trigger alert
- **Alert Type**: Jenis alert (CPU High, Disk Full, dll)
- **Timestamp**: Waktu alert terjadi
- **Message**: Detail kondisi alert
- **Status**: Active atau Resolved
- **Severity**: 
  - 🔴 Critical (Merah) - Server down, disk penuh
  - 🟠 Warning (Orange) - CPU/Memory tinggi
  - 🔵 Info (Biru) - Informasi umum

### Mengelola Alert

**Mark as Resolved**:
- Klik tombol "Mark as Resolved" pada alert
- Alert akan dipindah ke status Resolved
- Tidak akan muncul di Unresolved count

**Refresh History**:
- Klik tombol "Refresh" untuk reload data
- Auto-refresh setiap view dibuka

---

## 5. Best Practices

### Threshold Configuration

1. **Monitoring Awal**: Set threshold konservatif (lebih tinggi)
   - CPU: 80-90%
   - Memory: 90%
   - Disk: 85%

2. **Setelah 1-2 Minggu**: Turunkan threshold berdasarkan usage normal
   - Lihat pattern di dashboard
   - Adjust untuk menghindari false alarm

3. **Production Critical**: Set agresif
   - CPU: 70%
   - Memory: 85%
   - Disk: 80%

### Channel Strategy

**Setup Multiple Channels**:
```
✅ Email - untuk dokumentasi dan audit trail
✅ Telegram - untuk notifikasi real-time ke tim
✅ WhatsApp - untuk on-call engineer
```

**Team Setup**:
- Email: ops@company.com (semua team)
- Telegram Group: DevOps Team
- WhatsApp: On-call person rotation

### Cooldown Configuration

- **High Priority Alerts** (Server Down): 5 menit
- **Medium Priority** (CPU/Memory): 10 menit
- **Low Priority** (Disk space): 15-30 menit

Terlalu pendek = spam notifications
Terlalu panjang = missed follow-up alerts

---

## 6. Troubleshooting

### Email Tidak Terkirim

**Problem**: SMTP Authentication Failed
- **Gmail**: Pastikan menggunakan App Password, bukan password akun
- **Office 365**: Periksa akun memiliki SMTP enabled
- **Port**: Gunakan 587 (TLS) atau 465 (SSL), jangan 25

**Problem**: Connection Timeout
- Check firewall/security group allow outbound port 587/465
- Test dengan telnet: `telnet smtp.gmail.com 587`

### Telegram Tidak Terkirim

**Problem**: Unauthorized (401)
- Bot token salah atau expired
- Generate bot token baru dari @BotFather

**Problem**: Chat Not Found (400)
- Chat ID salah
- Bot belum di-start oleh user atau belum ditambahkan ke group
- Untuk group: pastikan ID pakai minus di depan

**Problem**: Bot was kicked from group
- Add bot kembali ke group
- Berikan admin privileges jika perlu

### WhatsApp Tidak Terkirim

**Fonnte**:
- API Key expired atau salah
- Nomor tidak dalam format 62xxx
- Saldo habis (cek dashboard fonnte.com)

**Twilio**:
- WhatsApp Sandbox belum di-join
- Format nomor salah (harus pakai +)
- Account SID atau Auth Token salah

### Test Berhasil, Live Alert Tidak Terkirim

**Penyebab Umum**:
1. Channel di-disable setelah test
2. Cooldown period masih aktif
3. Alert system disabled di configuration
4. Server metrics tidak update (agent offline)

**Cara Check**:
```bash
# Check alert system status
curl -k https://eyes.indoinfinite.com/api/alerts/config

# Check channels
curl -k https://eyes.indoinfinite.com/api/alerts/channels

# Check recent alerts
curl -k https://eyes.indoinfinite.com/api/alerts/history?limit=5
```

---

## 7. API Access (Advanced)

UI ini menggunakan REST API. Anda juga bisa manage via curl:

### Get Alert Config
```bash
curl -k https://eyes.indoinfinite.com/api/alerts/config
```

### Update Alert Config
```bash
curl -k -X PUT https://eyes.indoinfinite.com/api/alerts/config \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": 1,
    "cpu_threshold": 75,
    "disk_threshold": 85,
    "memory_threshold": 90,
    "server_down_timeout": 60,
    "network_timeout": 60,
    "cooldown_period": 300
  }'
```

### Add Notification Channel
```bash
# Telegram
curl -k -X POST https://eyes.indoinfinite.com/api/alerts/channels \
  -H "Content-Type: application/json" \
  -d '{
    "channel_type": "telegram",
    "config": {
      "bot_token": "YOUR_BOT_TOKEN",
      "chat_id": "YOUR_CHAT_ID"
    },
    "enabled": 1
  }'

# Email
curl -k -X POST https://eyes.indoinfinite.com/api/alerts/channels \
  -H "Content-Type: application/json" \
  -d '{
    "channel_type": "email",
    "config": {
      "smtp_server": "smtp.gmail.com",
      "smtp_port": 587,
      "username": "your@gmail.com",
      "password": "your-app-password",
      "from_email": "alerts@monitoring.com",
      "to_emails": ["admin@company.com", "ops@company.com"]
    },
    "enabled": 1
  }'
```

### Get Alert History
```bash
curl -k https://eyes.indoinfinite.com/api/alerts/history?limit=10
```

### Get Alert Statistics
```bash
curl -k https://eyes.indoinfinite.com/api/alerts/stats
```

---

## 8. Quick Start Guide

**5 Menit Setup Lengkap**:

1. **Buka Alert Settings** (menu sidebar dengan icon 🔔)

2. **Set Thresholds** (default sudah oke untuk kebanyakan kasus):
   - Biarkan default atau adjust sesuai kebutuhan
   - Klik "Save Configuration"

3. **Add Telegram Channel** (tercepat dan gratis):
   ```
   a. Chat @BotFather → /newbot → ikuti instruksi
   b. Copy token yang diberikan
   c. Chat ke bot Anda → /start
   d. Buka: https://api.telegram.org/bot<TOKEN>/getUpdates
   e. Copy chat ID dari response
   f. Kembali ke dashboard → Add Channel → Telegram
   g. Paste token dan chat ID → Test → Save
   ```

4. **Test Alert**:
   - Trigger alert dengan cara:
     ```bash
     # Test CPU alert (di server monitoring)
     stress-ng --cpu 4 --timeout 120s
     
     # Atau stop agent untuk test server down
     systemctl stop monitoring-agent
     ```

5. **Monitor**:
   - Check Telegram untuk notifikasi
   - Lihat alert history di dashboard
   - Mark as resolved setelah ditangani

---

## 9. Security Notes

### Credential Storage
- Semua credential (SMTP password, bot token, API key) disimpan di database
- Gunakan strong password untuk dashboard
- Jangan share screenshot yang menampilkan token/API key

### Access Control
- Only admin users can access Alert Settings
- Regular users cannot modify alert configuration
- Audit trail tersimpan di alert_history table

### Network Security
- Alert system berjalan di internal network
- HTTPS/TLS untuk semua external API calls
- No credentials logged in plain text

---

## Support

Jika ada masalah:
1. Check Alert History untuk error messages
2. Test notification channel
3. Verify server agent masih running dan kirim metrics
4. Check backend logs:
   ```bash
   docker-compose -f docker-compose.ssl.yml logs backend
   ```

---

## Changelog

### Version 2 (2024-11-10)
- ✅ Added visual UI dashboard
- ✅ Statistics cards for overview
- ✅ Form-based threshold configuration
- ✅ Channel management with test function
- ✅ Alert history visualization
- ✅ Real-time status monitoring

### Version 1 (2024-11-09)
- ✅ Alert system backend
- ✅ Multi-channel notifications
- ✅ API endpoints
- ✅ Background monitoring thread

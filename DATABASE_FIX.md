# Quick Fix Guide - Database Migration

## Problem
```
sqlite3.OperationalError: no such column: h.group_id
```

Database Anda dibuat sebelum fitur groups ditambahkan. Kolom `group_id` dan `enable_key_mapping` belum ada.

## Solution 1: Automatic Migration (Recommended)

**Backend sekarang melakukan auto-migration saat startup!**

Cukup restart container Docker:

```bash
docker-compose restart backend
```

Atau restart langsung:

```bash
docker restart monitoring-backend
```

**Log yang benar:**
```
[MIGRATION] Adding group_id column to hosts table...
[MIGRATION] ✓ group_id column added
[MIGRATION] Adding enable_key_mapping column to hosts table...
[MIGRATION] ✓ enable_key_mapping column added
```

## Solution 2: Manual Migration (Jika auto-migration gagal)

### A. Di Docker Container

```bash
# Masuk ke container
docker exec -it monitoring-backend /bin/bash

# Jalankan migration script
cd /app/backend
python migrate_db.py

# Keluar dan restart
exit
docker restart monitoring-backend
```

### B. Di Server Lokal

```bash
cd backend
python migrate_db.py
```

## Verification

Setelah restart, akses dashboard dan cek:

1. **Browser Console (F12):**
   ```
   [API] GET /api/hosts called by user: admin
   [API] Returning 0 hosts
   ```

2. **Server Logs:**
   ```
   [REQUEST] GET /api/hosts from 192.168.1.100
   [RESPONSE] GET /api/hosts -> 200 OK
   [RESPONSE] Content-Type: application/json
   ```

3. **Test Add Host:**
   - Klik "Add Host"
   - Isi form
   - Klik "Add Host"
   - Harusnya berhasil tanpa error 500

## Check Database Schema

Verifikasi kolom sudah ada:

```bash
# Di Docker
docker exec -it monitoring-backend sqlite3 /app/backend/data/monitoring.db "PRAGMA table_info(hosts);"

# Di lokal
sqlite3 backend/data/monitoring.db "PRAGMA table_info(hosts);"
```

**Output yang benar harus menunjukkan:**
```
...
5|group_id|INTEGER|0||0
6|enable_key_mapping|INTEGER|0|1|0
...
```

## Jika Masih Error

1. **Backup database:**
   ```bash
   docker cp monitoring-backend:/app/backend/data/monitoring.db ./monitoring.db.backup
   ```

2. **Hapus database lama** (akan dibuat ulang dengan schema baru):
   ```bash
   docker exec -it monitoring-backend rm /app/backend/data/monitoring.db
   docker restart monitoring-backend
   ```

3. **Database baru akan dibuat otomatis** dengan schema yang benar.
   - User admin default: `admin` / `admin123`
   - Semua host lama akan hilang (gunakan backup jika perlu restore)

## Status

- ✅ `init_db()` sekarang auto-migrate saat startup
- ✅ `migrate_db.py` support path Docker
- ✅ Logging ditambahkan untuk tracking
- ✅ Backend siap untuk restart

**Next: Restart backend dan test add host!**

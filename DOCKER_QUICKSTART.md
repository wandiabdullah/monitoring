# 🐳 Docker Quick Start

Panduan super cepat untuk menjalankan monitoring system dengan Docker.

## ⚡ 3 Langkah Setup

### 1️⃣ Install Docker

**Windows:**
- Download & install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Restart komputer

**Linux:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Logout dan login kembali
```

**Mac:**
- Download & install [Docker Desktop](https://www.docker.com/products/docker-desktop)

### 2️⃣ Start Dashboard

```bash
cd monitoring
docker-compose up -d
```

**That's it!** 🎉

### 3️⃣ Access Dashboard

Buka browser: **http://localhost:5000**

---

## 🎯 One-Line Commands

### Windows (PowerShell)
```powershell
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart
```

### Linux/Mac
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Restart
docker-compose restart
```

---

## 🚀 Quick Deploy (Alternative Scripts)

### Windows
```cmd
docker-deploy.bat
```

### Linux/Mac
```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

Interactive menu akan muncul! ✨

---

## 📊 Test dengan Agent

Setelah dashboard running, test dengan fake data:

```bash
pip install requests
python test_agent.py --server http://localhost:5000 --hostname test-server
```

Dashboard akan langsung menampilkan data! 🎉

---

## 🔍 Verify Installation

```bash
# Check containers
docker-compose ps

# Should show:
# NAME                    STATUS    PORTS
# monitoring-backend      Up        0.0.0.0:5000->5000/tcp
```

---

## 🛠️ Common Tasks

### Update Code
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f
```

### Clean Restart
```bash
docker-compose down -v
docker-compose up -d
```

### Backup Data
```bash
docker run --rm -v monitoring_monitoring-data:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /data .
```

---

## 🌐 Access from Other Machines

Dashboard dapat diakses dari komputer lain di network:

```
http://YOUR_IP:5000
```

Example: `http://192.168.1.100:5000`

Agents dari Linux server bisa connect ke:
```bash
python3 monitor_agent.py --server http://YOUR_IP:5000
```

---

## 🐛 Troubleshooting

### Port 5000 already in use?

**Windows:**
```powershell
netstat -ano | findstr :5000
```

**Linux/Mac:**
```bash
lsof -i :5000
```

Kill the process or change port in `docker-compose.yml`:
```yaml
ports:
  - "8080:5000"  # Use 8080 instead
```

### Container won't start?

```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Can't connect to Docker daemon?

**Windows:** Start Docker Desktop

**Linux:** 
```bash
sudo systemctl start docker
sudo usermod -aG docker $USER
# Logout and login
```

---

## 📚 More Information

- 📖 [DOCKER.md](DOCKER.md) - Complete Docker documentation
- 🚀 [QUICKSTART.md](QUICKSTART.md) - General quick start
- 📋 [INSTALLATION.md](INSTALLATION.md) - Detailed installation

---

## 🎉 That's It!

Dashboard running di: **http://localhost:5000**

Install agent di Linux servers dan mereka akan langsung muncul di dashboard!

**Happy Monitoring! 🚀**

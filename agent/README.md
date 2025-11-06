# Linux Monitoring Agent

Agent untuk monitoring server Linux yang mengumpulkan metrics CPU, RAM, Disk, dan I/O.

## Fitur

- **CPU Monitoring**: Usage per core, load average, frequency
- **Memory Monitoring**: RAM dan Swap usage
- **Disk Monitoring**: Usage semua partisi
- **I/O Monitoring**: Network dan Disk I/O rates

## Instalasi

### Metode 1: Instalasi Otomatis (dengan systemd service)

```bash
sudo chmod +x install.sh
sudo ./install.sh
```

Kemudian edit konfigurasi server:
```bash
sudo nano /etc/systemd/system/monitoring-agent.service
```

Ganti `YOUR_MONITORING_SERVER` dengan alamat server monitoring Anda.

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable monitoring-agent
sudo systemctl start monitoring-agent
sudo systemctl status monitoring-agent
```

### Metode 2: Manual Installation

1. Install dependencies:
```bash
pip3 install -r requirements.txt
```

2. Jalankan agent:
```bash
python3 monitor_agent.py --server http://monitoring-server:5000
```

## Usage

```bash
python3 monitor_agent.py --server <SERVER_URL> [OPTIONS]

Options:
  --server, -s    Monitoring server URL (required)
  --hostname, -n  Custom hostname (default: auto-detect)
  --interval, -i  Collection interval in seconds (default: 5)
```

### Contoh:

```bash
# Basic usage
python3 monitor_agent.py --server http://192.168.1.100:5000

# Custom hostname dan interval
python3 monitor_agent.py --server http://monitoring.example.com:5000 --hostname web-server-01 --interval 10
```

## Data yang Dikumpulkan

### CPU Metrics
- CPU usage total dan per core
- CPU frequency (current, min, max)
- Load average
- Physical dan logical core count

### Memory Metrics
- Total, used, available, free RAM
- Memory usage percentage
- Swap usage dan percentage

### Disk Metrics
- All mounted partitions
- Disk usage (total, used, free, percentage)
- Filesystem type

### I/O Metrics
- Network: bytes sent/received, packets, errors, drops
- Network transfer rates (bytes/sec)
- Disk I/O: read/write counts, bytes, time
- Disk I/O rates (bytes/sec)

## Troubleshooting

### Melihat logs (jika menggunakan systemd):
```bash
journalctl -u monitoring-agent -f
```

### Test koneksi ke server:
```bash
curl http://YOUR_MONITORING_SERVER:5000/api/health
```

### Permission errors:
Pastikan agent dijalankan dengan privilege yang cukup (biasanya root) untuk akses ke semua metrics.

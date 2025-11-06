#!/usr/bin/env python3
"""
Linux Server Monitoring Agent
Monitors CPU, RAM, Disk, and IO metrics and sends to central server
Compatible with Python 2.7+ and 3.x
Compatible with CentOS 6/7/8, Ubuntu, Debian, RHEL, Rocky Linux, AlmaLinux
"""

from __future__ import print_function, division
import psutil
import time
import json
import socket
import argparse
import sys
from datetime import datetime

# Python 2/3 compatibility
if sys.version_info[0] >= 3:
    from typing import Dict, Any
    string_types = str
else:
    # Python 2
    string_types = basestring

# Try to import requests, fallback to urllib if not available
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    if sys.version_info[0] >= 3:
        import urllib.request as urllib2
        import urllib.error
    else:
        import urllib2


class MonitoringAgent:
    def __init__(self, server_url: str, api_key: str, hostname: str = None, interval: int = 5, use_key_mapping: bool = True):
        """
        Initialize monitoring agent
        
        Args:
            server_url: URL of the central monitoring server
            api_key: API key for authentication
            hostname: Server hostname (auto-detect if None, or override with key mapping)
            interval: Collection interval in seconds
            use_key_mapping: If True, hostname will be determined by API key on server side (more secure)
                           If False, agent sends its own hostname
        """
        self.server_url = server_url
        self.api_key = api_key
        self.hostname = hostname or socket.gethostname()
        self.interval = interval
        self.use_key_mapping = use_key_mapping
        self.previous_net_io = None
        self.previous_disk_io = None
        self.previous_time = None
        
    def get_cpu_metrics(self):
        """Collect CPU metrics"""
        try:
            cpu_percent = psutil.cpu_percent(interval=1, percpu=True)
        except Exception:
            cpu_percent = [psutil.cpu_percent(interval=1)]
        
        try:
            cpu_freq = psutil.cpu_freq()
        except (AttributeError, NotImplementedError):
            cpu_freq = None
        
        cpu_count = psutil.cpu_count()
        
        # Get load average (Unix-like systems only)
        try:
            load_avg = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
        except (AttributeError, OSError):
            try:
                # Fallback for systems without psutil.getloadavg()
                with open('/proc/loadavg', 'r') as f:
                    load_avg = [float(x) for x in f.read().split()[:3]]
            except Exception:
                load_avg = None
        
        return {
            'cpu_percent_total': psutil.cpu_percent(interval=0),
            'cpu_percent_per_core': cpu_percent,
            'cpu_count_logical': psutil.cpu_count(logical=True),
            'cpu_count_physical': psutil.cpu_count(logical=False) if psutil.cpu_count(logical=False) else psutil.cpu_count(logical=True),
            'cpu_freq_current': cpu_freq.current if cpu_freq else None,
            'cpu_freq_min': cpu_freq.min if cpu_freq else None,
            'cpu_freq_max': cpu_freq.max if cpu_freq else None,
            'load_average': load_avg
        }
    
    def get_memory_metrics(self):
        """Collect memory metrics"""
        virtual_mem = psutil.virtual_memory()
        swap_mem = psutil.swap_memory()
        
        return {
            'memory_total': virtual_mem.total,
            'memory_available': getattr(virtual_mem, 'available', virtual_mem.free),
            'memory_used': virtual_mem.used,
            'memory_percent': virtual_mem.percent,
            'memory_free': virtual_mem.free,
            'swap_total': swap_mem.total,
            'swap_used': swap_mem.used,
            'swap_free': swap_mem.free,
            'swap_percent': swap_mem.percent
        }
    
    def get_disk_metrics(self):
        """Collect disk metrics"""
        try:
            partitions = psutil.disk_partitions()
        except Exception:
            partitions = psutil.disk_partitions(all=False)
        
        disk_info = []
        
        for partition in partitions:
            try:
                # Skip virtual filesystems
                if partition.fstype in ('tmpfs', 'devtmpfs', 'squashfs', 'overlay'):
                    continue
                    
                usage = psutil.disk_usage(partition.mountpoint)
                disk_info.append({
                    'device': partition.device,
                    'mountpoint': partition.mountpoint,
                    'fstype': partition.fstype,
                    'total': usage.total,
                    'used': usage.used,
                    'free': usage.free,
                    'percent': usage.percent
                })
            except (PermissionError, OSError):
                # Skip partitions we can't access
                continue
            except Exception:
                continue
        
        return {'partitions': disk_info}
    
    def get_io_metrics(self):
        """Collect I/O metrics (network and disk)"""
        current_time = time.time()
        
        try:
            net_io = psutil.net_io_counters()
        except Exception:
            net_io = None
        
        try:
            disk_io = psutil.disk_io_counters()
        except Exception:
            disk_io = None
        
        metrics = {
            'network': {
                'bytes_sent': net_io.bytes_sent if net_io else 0,
                'bytes_recv': net_io.bytes_recv if net_io else 0,
                'packets_sent': net_io.packets_sent if net_io else 0,
                'packets_recv': net_io.packets_recv if net_io else 0,
                'errin': net_io.errin if net_io else 0,
                'errout': net_io.errout if net_io else 0,
                'dropin': net_io.dropin if net_io else 0,
                'dropout': net_io.dropout if net_io else 0
            },
            'disk_io': {
                'read_count': disk_io.read_count if disk_io else 0,
                'write_count': disk_io.write_count if disk_io else 0,
                'read_bytes': disk_io.read_bytes if disk_io else 0,
                'write_bytes': disk_io.write_bytes if disk_io else 0,
                'read_time': getattr(disk_io, 'read_time', 0) if disk_io else 0,
                'write_time': getattr(disk_io, 'write_time', 0) if disk_io else 0
            }
        }
        
        # Calculate rates if we have previous data
        if self.previous_net_io and self.previous_time and net_io:
            time_delta = current_time - self.previous_time
            if time_delta > 0:
                metrics['network']['bytes_sent_per_sec'] = \
                    (net_io.bytes_sent - self.previous_net_io.bytes_sent) / time_delta
                metrics['network']['bytes_recv_per_sec'] = \
                    (net_io.bytes_recv - self.previous_net_io.bytes_recv) / time_delta
        
        if self.previous_disk_io and self.previous_time and disk_io:
            time_delta = current_time - self.previous_time
            if time_delta > 0:
                metrics['disk_io']['read_bytes_per_sec'] = \
                    (disk_io.read_bytes - self.previous_disk_io.read_bytes) / time_delta
                metrics['disk_io']['write_bytes_per_sec'] = \
                    (disk_io.write_bytes - self.previous_disk_io.write_bytes) / time_delta
        
        self.previous_net_io = net_io
        self.previous_disk_io = disk_io
        self.previous_time = current_time
        
        return metrics
    
    def collect_metrics(self):
        """Collect all metrics"""
        metrics = {
            'hostname': self.hostname,
            'timestamp': datetime.utcnow().isoformat(),
            'cpu': self.get_cpu_metrics(),
            'memory': self.get_memory_metrics(),
            'disk': self.get_disk_metrics(),
            'io': self.get_io_metrics(),
            'system': self.get_system_info()  # Always include system info for real-time uptime
        }
        
        return metrics
    
    def get_system_info(self):
        """Collect system information"""
        import platform
        
        try:
            boot_time = datetime.fromtimestamp(psutil.boot_time())
            uptime_seconds = time.time() - psutil.boot_time()
        except Exception:
            boot_time = None
            uptime_seconds = 0
        
        # Format uptime
        if uptime_seconds > 0:
            days = int(uptime_seconds // 86400)
            hours = int((uptime_seconds % 86400) // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            uptime_str = "{0}d {1}h {2}m".format(days, hours, minutes)
        else:
            uptime_str = "Unknown"
        
        # Get OS info with fallbacks for older systems
        try:
            os_name = platform.system()
        except Exception:
            os_name = "Unknown"
        
        try:
            os_version = platform.version()
        except Exception:
            os_version = "Unknown"
        
        try:
            kernel = platform.release()
        except Exception:
            kernel = "Unknown"
        
        try:
            architecture = platform.machine()
        except Exception:
            architecture = "Unknown"
        
        return {
            'os': os_name,
            'os_version': os_version,
            'kernel': kernel,
            'architecture': architecture,
            'hostname': socket.gethostname(),
            'boot_time': boot_time.strftime('%Y-%m-%d %H:%M:%S') if boot_time else 'Unknown',
            'uptime': uptime_str
        }
    
    def send_metrics(self, metrics):
        """Send metrics to central server"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'X-API-Key': self.api_key
            }
            
            # If using key mapping, don't send hostname in metrics
            # Server will determine hostname from API key
            if self.use_key_mapping:
                # Remove hostname from metrics, server will add it
                metrics_to_send = dict((k, v) for k, v in metrics.items() if k != 'hostname')
            else:
                # Send metrics with hostname
                metrics_to_send = metrics
            
            # Convert to JSON
            json_data = json.dumps(metrics_to_send)
            
            if HAS_REQUESTS:
                # Use requests library (preferred)
                response = requests.post(
                    "{0}/api/metrics".format(self.server_url),
                    data=json_data,
                    headers=headers,
                    timeout=10
                )
                if response.status_code == 200:
                    return True
                else:
                    print("Error sending metrics: {0} - {1}".format(response.status_code, response.text))
                    return False
            else:
                # Fallback to urllib (Python 2/3 compatible)
                url = "{0}/api/metrics".format(self.server_url)
                if sys.version_info[0] >= 3:
                    req = urllib2.Request(url, data=json_data.encode('utf-8'), headers=headers)
                else:
                    req = urllib2.Request(url, data=json_data, headers=headers)
                
                try:
                    response = urllib2.urlopen(req, timeout=10)
                    if response.getcode() == 200:
                        return True
                    else:
                        print("Error sending metrics: {0}".format(response.getcode()))
                        return False
                except Exception as e:
                    print("Failed to send metrics: {0}".format(str(e)))
                    return False
                    
        except Exception as e:
            print("Failed to send metrics: {0}".format(str(e)))
            return False
    
    def run(self):
        """Main monitoring loop"""
        print("Starting monitoring agent for {0}".format(self.hostname))
        print("Sending metrics to: {0}".format(self.server_url))
        print("Collection interval: {0} seconds".format(self.interval))
        print("Key mapping enabled: {0}".format(self.use_key_mapping))
        print("Python version: {0}.{1}.{2}".format(sys.version_info[0], sys.version_info[1], sys.version_info[2]))
        print("psutil version: {0}".format(psutil.__version__))
        
        if self.use_key_mapping:
            print("  >> Hostname will be determined by server from API key (secure mode)")
        else:
            print("  >> Using local hostname: {0}".format(self.hostname))
        
        while True:
            try:
                metrics = self.collect_metrics()
                
                # Print summary (Python 2/3 compatible, ASCII only)
                cpu_percent = metrics['cpu']['cpu_percent_total']
                mem_percent = metrics['memory']['memory_percent']
                upload_speed = metrics['io']['network'].get('bytes_sent_per_sec', 0) / 1024
                download_speed = metrics['io']['network'].get('bytes_recv_per_sec', 0) / 1024
                
                print("\n[{0}] Collected metrics:".format(datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
                print("  CPU: {0:.1f}%".format(cpu_percent))
                print("  Memory: {0:.1f}%".format(mem_percent))
                print("  Network: UP {0:.1f} KB/s | DOWN {1:.1f} KB/s".format(upload_speed, download_speed))
                
                # Send to server
                if self.send_metrics(metrics):
                    print("  [OK] Metrics sent successfully")
                else:
                    print("  [ERROR] Failed to send metrics")
                
                time.sleep(self.interval)
                
            except KeyboardInterrupt:
                print("\nStopping monitoring agent...")
                break
            except Exception as e:
                print("Error collecting metrics: {0}".format(str(e)))
                time.sleep(self.interval)


def check_dependencies():
    """Check if required dependencies are installed"""
    print("=" * 60)
    print("System Compatibility Check")
    print("=" * 60)
    print("Python version: {0}.{1}.{2}".format(sys.version_info[0], sys.version_info[1], sys.version_info[2]))
    
    # Check Python version
    if sys.version_info[0] < 2 or (sys.version_info[0] == 2 and sys.version_info[1] < 7):
        print("ERROR: Python 2.7+ or 3.x required")
        return False
    
    # Check psutil
    try:
        print("psutil version: {0}".format(psutil.__version__))
    except Exception:
        print("ERROR: psutil not installed. Install with: pip install psutil")
        return False
    
    # Check requests (optional)
    if HAS_REQUESTS:
        print("requests: Available (version {0})".format(requests.__version__))
    else:
        print("requests: Not available (using urllib fallback)")
    
    print("=" * 60)
    print("All checks passed!")
    print("=" * 60)
    print("")
    return True


def main():
    # Check dependencies first
    if not check_dependencies():
        sys.exit(1)
    
    parser = argparse.ArgumentParser(
        description='Linux Server Monitoring Agent - Compatible with CentOS 6/7/8, RHEL, Ubuntu, Debian',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Using key mapping (secure, recommended):
  python monitor_agent.py -s http://monitoring.server:5000 -k YOUR_API_KEY
  
  # Without key mapping (send local hostname):
  python monitor_agent.py -s http://monitoring.server:5000 -k YOUR_API_KEY --no-key-mapping
  
  # Custom hostname with key mapping disabled:
  python monitor_agent.py -s http://monitoring.server:5000 -k YOUR_API_KEY -n custom-hostname --no-key-mapping

Compatible with:
  - Python 2.7+ and Python 3.x
  - CentOS 6, 7, 8, Stream
  - RHEL 6, 7, 8, 9
  - Rocky Linux, AlmaLinux
  - Ubuntu 14.04+
  - Debian 7+
        """
    )
    parser.add_argument('--server', '-s', required=True, 
                       help='Monitoring server URL (e.g., http://monitoring.server:5000)')
    parser.add_argument('--api-key', '-k', required=True, 
                       help='API key for authentication (obtained from dashboard)')
    parser.add_argument('--hostname', '-n', 
                       help='Server hostname (auto-detect if not specified)')
    parser.add_argument('--interval', '-i', type=int, default=5, 
                       help='Collection interval in seconds (default: 5)')
    parser.add_argument('--no-key-mapping', action='store_true',
                       help='Disable key mapping (send local hostname instead of using API key mapping)')
    
    args = parser.parse_args()
    
    agent = MonitoringAgent(
        server_url=args.server,
        api_key=args.api_key,
        hostname=args.hostname,
        interval=args.interval,
        use_key_mapping=not args.no_key_mapping
    )
    
    agent.run()


if __name__ == '__main__':
    main()

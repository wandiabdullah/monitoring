#!/usr/bin/env python3
"""
Linux Server Monitoring Agent
Monitors CPU, RAM, Disk, and IO metrics and sends to central server
"""

import psutil
import time
import json
import requests
import socket
import argparse
from datetime import datetime
from typing import Dict, Any


class MonitoringAgent:
    def __init__(self, server_url: str, api_key: str, hostname: str = None, interval: int = 5):
        """
        Initialize monitoring agent
        
        Args:
            server_url: URL of the central monitoring server
            api_key: API key for authentication
            hostname: Server hostname (auto-detect if None)
            interval: Collection interval in seconds
        """
        self.server_url = server_url
        self.api_key = api_key
        self.hostname = hostname or socket.gethostname()
        self.interval = interval
        self.previous_net_io = None
        self.previous_disk_io = None
        self.previous_time = None
        
    def get_cpu_metrics(self) -> Dict[str, Any]:
        """Collect CPU metrics"""
        cpu_percent = psutil.cpu_percent(interval=1, percpu=True)
        cpu_freq = psutil.cpu_freq()
        cpu_count = psutil.cpu_count()
        
        return {
            'cpu_percent_total': psutil.cpu_percent(interval=0),
            'cpu_percent_per_core': cpu_percent,
            'cpu_count_logical': psutil.cpu_count(logical=True),
            'cpu_count_physical': psutil.cpu_count(logical=False),
            'cpu_freq_current': cpu_freq.current if cpu_freq else None,
            'cpu_freq_min': cpu_freq.min if cpu_freq else None,
            'cpu_freq_max': cpu_freq.max if cpu_freq else None,
            'load_average': psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
        }
    
    def get_memory_metrics(self) -> Dict[str, Any]:
        """Collect memory metrics"""
        virtual_mem = psutil.virtual_memory()
        swap_mem = psutil.swap_memory()
        
        return {
            'memory_total': virtual_mem.total,
            'memory_available': virtual_mem.available,
            'memory_used': virtual_mem.used,
            'memory_percent': virtual_mem.percent,
            'memory_free': virtual_mem.free,
            'swap_total': swap_mem.total,
            'swap_used': swap_mem.used,
            'swap_free': swap_mem.free,
            'swap_percent': swap_mem.percent
        }
    
    def get_disk_metrics(self) -> Dict[str, Any]:
        """Collect disk metrics"""
        partitions = psutil.disk_partitions()
        disk_info = []
        
        for partition in partitions:
            try:
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
            except PermissionError:
                continue
        
        return {'partitions': disk_info}
    
    def get_io_metrics(self) -> Dict[str, Any]:
        """Collect I/O metrics (network and disk)"""
        current_time = time.time()
        net_io = psutil.net_io_counters()
        disk_io = psutil.disk_io_counters()
        
        metrics = {
            'network': {
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv,
                'errin': net_io.errin,
                'errout': net_io.errout,
                'dropin': net_io.dropin,
                'dropout': net_io.dropout
            },
            'disk_io': {
                'read_count': disk_io.read_count if disk_io else 0,
                'write_count': disk_io.write_count if disk_io else 0,
                'read_bytes': disk_io.read_bytes if disk_io else 0,
                'write_bytes': disk_io.write_bytes if disk_io else 0,
                'read_time': disk_io.read_time if disk_io else 0,
                'write_time': disk_io.write_time if disk_io else 0
            }
        }
        
        # Calculate rates if we have previous data
        if self.previous_net_io and self.previous_disk_io and self.previous_time:
            time_delta = current_time - self.previous_time
            
            metrics['network']['bytes_sent_per_sec'] = \
                (net_io.bytes_sent - self.previous_net_io.bytes_sent) / time_delta
            metrics['network']['bytes_recv_per_sec'] = \
                (net_io.bytes_recv - self.previous_net_io.bytes_recv) / time_delta
            
            if disk_io:
                metrics['disk_io']['read_bytes_per_sec'] = \
                    (disk_io.read_bytes - self.previous_disk_io.read_bytes) / time_delta
                metrics['disk_io']['write_bytes_per_sec'] = \
                    (disk_io.write_bytes - self.previous_disk_io.write_bytes) / time_delta
        
        self.previous_net_io = net_io
        self.previous_disk_io = disk_io
        self.previous_time = current_time
        
        return metrics
    
    def collect_metrics(self) -> Dict[str, Any]:
        """Collect all metrics"""
        return {
            'hostname': self.hostname,
            'timestamp': datetime.utcnow().isoformat(),
            'cpu': self.get_cpu_metrics(),
            'memory': self.get_memory_metrics(),
            'disk': self.get_disk_metrics(),
            'io': self.get_io_metrics()
        }
    
    def send_metrics(self, metrics: Dict[str, Any]) -> bool:
        """Send metrics to central server"""
        try:
            headers = {
                'Content-Type': 'application/json',
                'X-API-Key': self.api_key
            }
            
            response = requests.post(
                f"{self.server_url}/api/metrics",
                json=metrics,
                headers=headers,
                timeout=5
            )
            if response.status_code == 200:
                return True
            else:
                print(f"Error sending metrics: {response.status_code} - {response.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"Failed to send metrics: {e}")
            return False
    
    def run(self):
        """Main monitoring loop"""
        print(f"Starting monitoring agent for {self.hostname}")
        print(f"Sending metrics to: {self.server_url}")
        print(f"Collection interval: {self.interval} seconds")
        
        while True:
            try:
                metrics = self.collect_metrics()
                
                # Print summary
                print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Collected metrics:")
                print(f"  CPU: {metrics['cpu']['cpu_percent_total']:.1f}%")
                print(f"  Memory: {metrics['memory']['memory_percent']:.1f}%")
                print(f"  Network: ↑{metrics['io']['network'].get('bytes_sent_per_sec', 0)/1024:.1f} KB/s "
                      f"↓{metrics['io']['network'].get('bytes_recv_per_sec', 0)/1024:.1f} KB/s")
                
                # Send to server
                if self.send_metrics(metrics):
                    print("  ✓ Metrics sent successfully")
                else:
                    print("  ✗ Failed to send metrics")
                
                time.sleep(self.interval)
                
            except KeyboardInterrupt:
                print("\nStopping monitoring agent...")
                break
            except Exception as e:
                print(f"Error collecting metrics: {e}")
                time.sleep(self.interval)


def main():
    parser = argparse.ArgumentParser(description='Linux Server Monitoring Agent')
    parser.add_argument('--server', '-s', required=True, help='Monitoring server URL')
    parser.add_argument('--api-key', '-k', required=True, help='API key for authentication')
    parser.add_argument('--hostname', '-n', help='Server hostname (auto-detect if not specified)')
    parser.add_argument('--interval', '-i', type=int, default=5, 
                       help='Collection interval in seconds (default: 5)')
    
    args = parser.parse_args()
    
    agent = MonitoringAgent(
        server_url=args.server,
        api_key=args.api_key,
        hostname=args.hostname,
        interval=args.interval
    )
    
    agent.run()


if __name__ == '__main__':
    main()

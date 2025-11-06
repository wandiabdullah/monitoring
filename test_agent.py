#!/usr/bin/env python3
"""
Test script to simulate monitoring agent for testing dashboard
Run this on any machine (Windows/Linux/Mac) to send fake data
"""

import requests
import time
import random
from datetime import datetime
import argparse

def generate_fake_metrics(hostname):
    """Generate realistic fake metrics"""
    return {
        'hostname': hostname,
        'timestamp': datetime.utcnow().isoformat(),
        'cpu': {
            'cpu_percent_total': random.uniform(10, 95),
            'cpu_percent_per_core': [random.uniform(5, 100) for _ in range(4)],
            'cpu_count_logical': 4,
            'cpu_count_physical': 2,
            'cpu_freq_current': 2400.0,
            'cpu_freq_min': 800.0,
            'cpu_freq_max': 3600.0,
            'load_average': [1.5, 1.2, 1.0]
        },
        'memory': {
            'memory_total': 8589934592,  # 8 GB
            'memory_available': random.randint(2000000000, 6000000000),
            'memory_used': random.randint(2000000000, 6000000000),
            'memory_percent': random.uniform(30, 85),
            'memory_free': random.randint(1000000000, 4000000000),
            'swap_total': 4294967296,  # 4 GB
            'swap_used': random.randint(0, 1000000000),
            'swap_free': random.randint(3000000000, 4294967296),
            'swap_percent': random.uniform(0, 25)
        },
        'disk': {
            'partitions': [
                {
                    'device': '/dev/sda1',
                    'mountpoint': '/',
                    'fstype': 'ext4',
                    'total': 107374182400,  # 100 GB
                    'used': random.randint(30000000000, 80000000000),
                    'free': random.randint(20000000000, 70000000000),
                    'percent': random.uniform(30, 80)
                },
                {
                    'device': '/dev/sda2',
                    'mountpoint': '/home',
                    'fstype': 'ext4',
                    'total': 214748364800,  # 200 GB
                    'used': random.randint(50000000000, 150000000000),
                    'free': random.randint(50000000000, 150000000000),
                    'percent': random.uniform(25, 75)
                }
            ]
        },
        'io': {
            'network': {
                'bytes_sent': random.randint(10000000000, 50000000000),
                'bytes_recv': random.randint(20000000000, 100000000000),
                'packets_sent': random.randint(1000000, 10000000),
                'packets_recv': random.randint(2000000, 20000000),
                'bytes_sent_per_sec': random.uniform(1024, 1024*1024),  # 1 KB - 1 MB/s
                'bytes_recv_per_sec': random.uniform(1024*10, 1024*1024*2),  # 10 KB - 2 MB/s
                'errin': 0,
                'errout': 0,
                'dropin': 0,
                'dropout': 0
            },
            'disk_io': {
                'read_count': random.randint(100000, 1000000),
                'write_count': random.randint(50000, 500000),
                'read_bytes': random.randint(1000000000, 10000000000),
                'write_bytes': random.randint(500000000, 5000000000),
                'read_time': random.randint(1000, 10000),
                'write_time': random.randint(500, 5000),
                'read_bytes_per_sec': random.uniform(1024*100, 1024*1024*10),
                'write_bytes_per_sec': random.uniform(1024*50, 1024*1024*5)
            }
        }
    }

def main():
    parser = argparse.ArgumentParser(description='Test monitoring agent with fake data')
    parser.add_argument('--server', '-s', default='http://localhost:5000', 
                       help='Monitoring server URL')
    parser.add_argument('--hostname', '-n', default='test-server', 
                       help='Fake hostname')
    parser.add_argument('--interval', '-i', type=int, default=5, 
                       help='Send interval in seconds')
    parser.add_argument('--count', '-c', type=int, default=0, 
                       help='Number of metrics to send (0 = infinite)')
    
    args = parser.parse_args()
    
    print(f"🧪 Starting test agent")
    print(f"   Server: {args.server}")
    print(f"   Hostname: {args.hostname}")
    print(f"   Interval: {args.interval}s")
    print(f"   Count: {'infinite' if args.count == 0 else args.count}")
    print()
    
    sent = 0
    try:
        while args.count == 0 or sent < args.count:
            metrics = generate_fake_metrics(args.hostname)
            
            try:
                response = requests.post(
                    f"{args.server}/api/metrics",
                    json=metrics,
                    timeout=5
                )
                
                if response.status_code == 200:
                    sent += 1
                    print(f"✅ [{sent}] Sent metrics - CPU: {metrics['cpu']['cpu_percent_total']:.1f}%, "
                          f"Memory: {metrics['memory']['memory_percent']:.1f}%")
                else:
                    print(f"❌ Error: {response.status_code}")
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ Failed to send: {e}")
            
            if args.count == 0 or sent < args.count:
                time.sleep(args.interval)
                
    except KeyboardInterrupt:
        print(f"\n🛑 Stopped. Total sent: {sent}")

if __name__ == '__main__':
    main()

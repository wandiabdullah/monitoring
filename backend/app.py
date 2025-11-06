from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import os
from collections import defaultdict, deque
from threading import Lock

app = Flask(__name__, static_folder='../dashboard', template_folder='../dashboard')
CORS(app)

# In-memory storage for metrics (untuk demo, bisa diganti dengan database)
metrics_storage = defaultdict(lambda: deque(maxlen=1000))  # Store last 1000 metrics per server
current_metrics = {}  # Latest metrics per server
storage_lock = Lock()

# Jika ingin persistent storage
STORAGE_DIR = 'data'
os.makedirs(STORAGE_DIR, exist_ok=True)


def save_to_file(hostname, metrics):
    """Save metrics to JSON file (optional persistent storage)"""
    date_str = datetime.now().strftime('%Y-%m-%d')
    filename = os.path.join(STORAGE_DIR, f"{hostname}_{date_str}.jsonl")
    
    with open(filename, 'a') as f:
        f.write(json.dumps(metrics) + '\n')


@app.route('/')
def index():
    """Serve dashboard"""
    return render_template('index.html')


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'servers_count': len(current_metrics)
    })


@app.route('/api/metrics', methods=['POST'])
def receive_metrics():
    """Receive metrics from monitoring agents"""
    try:
        metrics = request.json
        hostname = metrics.get('hostname')
        
        if not hostname:
            return jsonify({'error': 'hostname is required'}), 400
        
        # Add server timestamp
        metrics['server_received_at'] = datetime.utcnow().isoformat()
        
        with storage_lock:
            # Store in memory
            metrics_storage[hostname].append(metrics)
            current_metrics[hostname] = metrics
            
            # Optionally save to file
            # save_to_file(hostname, metrics)
        
        return jsonify({'status': 'success', 'hostname': hostname}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/servers', methods=['GET'])
def get_servers():
    """Get list of all monitored servers"""
    servers = []
    
    with storage_lock:
        for hostname, metrics in current_metrics.items():
            server_info = {
                'hostname': hostname,
                'last_update': metrics.get('timestamp'),
                'cpu_percent': metrics.get('cpu', {}).get('cpu_percent_total', 0),
                'memory_percent': metrics.get('memory', {}).get('memory_percent', 0),
                'status': 'online'  # Could add logic to mark offline if no recent updates
            }
            servers.append(server_info)
    
    return jsonify(servers)


@app.route('/api/servers/<hostname>/current', methods=['GET'])
def get_current_metrics(hostname):
    """Get current metrics for a specific server"""
    with storage_lock:
        metrics = current_metrics.get(hostname)
    
    if not metrics:
        return jsonify({'error': 'Server not found'}), 404
    
    return jsonify(metrics)


@app.route('/api/servers/<hostname>/history', methods=['GET'])
def get_metrics_history(hostname):
    """Get historical metrics for a specific server"""
    # Get query parameters
    minutes = request.args.get('minutes', default=60, type=int)
    limit = request.args.get('limit', default=100, type=int)
    
    with storage_lock:
        history = list(metrics_storage.get(hostname, []))
    
    if not history:
        return jsonify({'error': 'No data found for server'}), 404
    
    # Filter by time if needed
    cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
    filtered_history = []
    
    for metric in reversed(history):  # Most recent first
        try:
            metric_time = datetime.fromisoformat(metric['timestamp'].replace('Z', '+00:00'))
            if metric_time >= cutoff_time:
                filtered_history.append(metric)
        except:
            filtered_history.append(metric)  # Include if can't parse time
    
    # Apply limit
    filtered_history = filtered_history[:limit]
    
    return jsonify(filtered_history)


@app.route('/api/servers/<hostname>/stats', methods=['GET'])
def get_server_stats(hostname):
    """Get aggregated statistics for a server"""
    with storage_lock:
        history = list(metrics_storage.get(hostname, []))
    
    if not history:
        return jsonify({'error': 'No data found for server'}), 404
    
    # Calculate statistics
    cpu_values = [m.get('cpu', {}).get('cpu_percent_total', 0) for m in history]
    memory_values = [m.get('memory', {}).get('memory_percent', 0) for m in history]
    
    stats = {
        'hostname': hostname,
        'data_points': len(history),
        'cpu': {
            'current': cpu_values[-1] if cpu_values else 0,
            'average': sum(cpu_values) / len(cpu_values) if cpu_values else 0,
            'min': min(cpu_values) if cpu_values else 0,
            'max': max(cpu_values) if cpu_values else 0
        },
        'memory': {
            'current': memory_values[-1] if memory_values else 0,
            'average': sum(memory_values) / len(memory_values) if memory_values else 0,
            'min': min(memory_values) if memory_values else 0,
            'max': max(memory_values) if memory_values else 0
        }
    }
    
    return jsonify(stats)


@app.route('/api/servers/<hostname>/disk', methods=['GET'])
def get_disk_info(hostname):
    """Get disk information for a specific server"""
    with storage_lock:
        metrics = current_metrics.get(hostname)
    
    if not metrics:
        return jsonify({'error': 'Server not found'}), 404
    
    disk_info = metrics.get('disk', {}).get('partitions', [])
    return jsonify(disk_info)


@app.route('/api/servers/<hostname>/network', methods=['GET'])
def get_network_info(hostname):
    """Get network I/O information"""
    minutes = request.args.get('minutes', default=5, type=int)
    
    with storage_lock:
        history = list(metrics_storage.get(hostname, []))
    
    if not history:
        return jsonify({'error': 'No data found for server'}), 404
    
    # Get recent network data
    cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)
    network_data = []
    
    for metric in reversed(history):
        try:
            metric_time = datetime.fromisoformat(metric['timestamp'].replace('Z', '+00:00'))
            if metric_time >= cutoff_time:
                io_data = metric.get('io', {}).get('network', {})
                network_data.append({
                    'timestamp': metric['timestamp'],
                    'bytes_sent_per_sec': io_data.get('bytes_sent_per_sec', 0),
                    'bytes_recv_per_sec': io_data.get('bytes_recv_per_sec', 0),
                    'bytes_sent': io_data.get('bytes_sent', 0),
                    'bytes_recv': io_data.get('bytes_recv', 0)
                })
        except:
            continue
    
    return jsonify(network_data)


if __name__ == '__main__':
    print("Starting Monitoring Server...")
    print("Dashboard available at: http://localhost:5000")
    print("API endpoint: http://localhost:5000/api/metrics")
    app.run(host='0.0.0.0', port=5000, debug=True)

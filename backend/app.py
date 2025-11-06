from flask import Flask, request, jsonify, render_template, session, redirect, url_for, send_from_directory
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import os
from collections import defaultdict, deque
from threading import Lock
import hashlib
import secrets
import sqlite3
from functools import wraps

app = Flask(__name__, static_folder='../dashboard', static_url_path='/static', template_folder='../dashboard')
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))

# Session configuration
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True if using HTTPS
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)

# CORS configuration - support credentials
CORS(app, supports_credentials=True, origins=['*'])

# In-memory storage for metrics (untuk demo, bisa diganti dengan database)
metrics_storage = defaultdict(lambda: deque(maxlen=1000))  # Store last 1000 metrics per server
current_metrics = {}  # Latest metrics per server
storage_lock = Lock()

# Jika ingin persistent storage
STORAGE_DIR = 'data'
os.makedirs(STORAGE_DIR, exist_ok=True)

# Database setup
DATABASE = os.path.join(STORAGE_DIR, 'monitoring.db')

def get_db():
    """Get database connection"""
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    """Initialize database with tables"""
    db = get_db()
    cursor = db.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT,
            is_admin INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Hosts table - Updated with group support
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hosts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hostname TEXT UNIQUE NOT NULL,
            api_key TEXT UNIQUE NOT NULL,
            description TEXT,
            ip_address TEXT,
            group_id INTEGER,
            is_active INTEGER DEFAULT 1,
            enable_key_mapping INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES groups (id)
        )
    ''')
    
    # Groups table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            icon TEXT DEFAULT 'fa-server',
            description TEXT,
            color TEXT DEFAULT '#667eea',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # API Keys table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            hostname TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (hostname) REFERENCES hosts (hostname)
        )
    ''')
    
    db.commit()
    
    # Create default admin user if not exists
    cursor.execute('SELECT * FROM users WHERE username = ?', ('admin',))
    if not cursor.fetchone():
        admin_password = hash_password('admin123')
        cursor.execute(
            'INSERT INTO users (username, password_hash, email, is_admin) VALUES (?, ?, ?, ?)',
            ('admin', admin_password, 'admin@monitoring.local', 1)
        )
        db.commit()
        print("Default admin user created: username=admin, password=admin123")
    
    db.close()

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_api_key():
    """Generate random API key for host"""
    return secrets.token_urlsafe(32)

def login_required(f):
    """Decorator to require login"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Decorator to require admin access"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        
        db = get_db()
        user = db.execute('SELECT is_admin FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        db.close()
        
        if not user or not user['is_admin']:
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def verify_api_key(api_key):
    """Verify API key and return hostname"""
    db = get_db()
    host = db.execute('SELECT hostname FROM hosts WHERE api_key = ? AND is_active = 1', (api_key,)).fetchone()
    db.close()
    return host['hostname'] if host else None


def save_to_file(hostname, metrics):
    """Save metrics to JSON file (optional persistent storage)"""
    date_str = datetime.now().strftime('%Y-%m-%d')
    filename = os.path.join(STORAGE_DIR, f"{hostname}_{date_str}.jsonl")
    
    with open(filename, 'a') as f:
        f.write(json.dumps(metrics) + '\n')


@app.route('/')
def index():
    """Serve dashboard or redirect to login"""
    # Check if user is logged in
    if 'user_id' not in session:
        print(f"[AUTH] No user_id in session, redirecting to login. Session: {dict(session)}")
        return render_template('login.html')
    
    print(f"[AUTH] User logged in: {session.get('username')}")
    return render_template('dashboard.html')

# Serve static files (JS, CSS, etc.)
@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files from dashboard folder"""
    if filename.endswith(('.js', '.css', '.png', '.jpg', '.ico', '.svg')):
        return send_from_directory('../dashboard', filename)
    return '', 404

@app.route('/old-dashboard')
@login_required
def old_dashboard():
    """Serve old detailed dashboard"""
    return render_template('index.html')

@app.route('/login', methods=['GET'])
def login_page():
    """Serve login page"""
    return render_template('login.html')

@app.route('/api/login', methods=['POST'])
def login():
    """Login endpoint"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    password_hash = hash_password(password)
    
    db = get_db()
    user = db.execute(
        'SELECT id, username, is_admin FROM users WHERE username = ? AND password_hash = ?',
        (username, password_hash)
    ).fetchone()
    db.close()
    
    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['is_admin'] = user['is_admin']
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'is_admin': bool(user['is_admin'])
            }
        })
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout endpoint"""
    session.clear()
    return jsonify({'success': True})

@app.route('/api/current-user', methods=['GET'])
@login_required
def current_user():
    """Get current logged in user"""
    db = get_db()
    user = db.execute(
        'SELECT id, username, email, is_admin FROM users WHERE id = ?',
        (session['user_id'],)
    ).fetchone()
    db.close()
    
    if user:
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'is_admin': bool(user['is_admin'])
        })
    return jsonify({'error': 'User not found'}), 404


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
        # Verify API key
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'API key required'}), 401
        
        hostname = verify_api_key(api_key)
        if not hostname:
            return jsonify({'error': 'Invalid API key'}), 401
        
        # Update last_seen for the host
        db = get_db()
        db.execute('UPDATE hosts SET last_seen = CURRENT_TIMESTAMP WHERE hostname = ?', (hostname,))
        db.commit()
        db.close()
        
        metrics = request.json
        
        # Override hostname with the one from API key
        metrics['hostname'] = hostname
        
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
@login_required
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


@app.route('/api/hosts', methods=['GET'])
@login_required
def get_hosts():
    """Get all hosts with group information"""
    db = get_db()
    hosts = db.execute('''
        SELECT h.id, h.hostname, h.description, h.ip_address, h.is_active, 
               h.api_key, h.created_at, h.last_seen, h.group_id,
               g.name as group_name, g.icon as group_icon
        FROM hosts h
        LEFT JOIN groups g ON h.group_id = g.id
        ORDER BY h.hostname
    ''').fetchall()
    db.close()
    
    return jsonify([{
        'id': host['id'],
        'hostname': host['hostname'],
        'description': host['description'],
        'ip_address': host['ip_address'],
        'is_active': bool(host['is_active']),
        'api_key': host['api_key'],
        'created_at': host['created_at'],
        'last_seen': host['last_seen'],
        'group_id': host['group_id'],
        'group_name': host['group_name'],
        'group_icon': host['group_icon']
    } for host in hosts])


@app.route('/api/hosts', methods=['POST'])
@admin_required
def add_host():
    """Add new host with key mapping and group support"""
    data = request.json
    hostname = data.get('hostname')
    description = data.get('description', '')
    ip_address = data.get('ip_address', '')
    group_id = data.get('group_id')
    enable_key_mapping = data.get('enable_key_mapping', True)
    
    if not hostname:
        return jsonify({'error': 'Hostname required'}), 400
    
    # Generate API key
    api_key = generate_api_key()
    
    db = get_db()
    try:
        cursor = db.execute(
            '''INSERT INTO hosts (hostname, api_key, description, ip_address, group_id, enable_key_mapping) 
               VALUES (?, ?, ?, ?, ?, ?)''',
            (hostname, api_key, description, ip_address, group_id, 1 if enable_key_mapping else 0)
        )
        db.commit()
        host_id = cursor.lastrowid
        db.close()
        
        print(f"[HOST] New host added: {hostname} (Group: {group_id}, Key Mapping: {enable_key_mapping})")
        
        return jsonify({
            'id': host_id,
            'hostname': hostname,
            'api_key': api_key,
            'description': description,
            'ip_address': ip_address,
            'group_id': group_id,
            'is_active': True,
            'enable_key_mapping': enable_key_mapping
        }), 201
    except sqlite3.IntegrityError:
        db.close()
        return jsonify({'error': 'Hostname already exists'}), 409


@app.route('/api/hosts/<int:host_id>', methods=['PUT'])
@admin_required
def update_host(host_id):
    """Update host"""
    data = request.json
    
    db = get_db()
    host = db.execute('SELECT * FROM hosts WHERE id = ?', (host_id,)).fetchone()
    
    if not host:
        db.close()
        return jsonify({'error': 'Host not found'}), 404
    
    hostname = data.get('hostname', host['hostname'])
    description = data.get('description', host['description'])
    ip_address = data.get('ip_address', host['ip_address'])
    is_active = data.get('is_active', host['is_active'])
    
    try:
        db.execute(
            'UPDATE hosts SET hostname = ?, description = ?, ip_address = ?, is_active = ? WHERE id = ?',
            (hostname, description, ip_address, is_active, host_id)
        )
        db.commit()
        
        updated_host = db.execute('SELECT * FROM hosts WHERE id = ?', (host_id,)).fetchone()
        db.close()
        
        return jsonify({
            'id': updated_host['id'],
            'hostname': updated_host['hostname'],
            'api_key': updated_host['api_key'],
            'description': updated_host['description'],
            'ip_address': updated_host['ip_address'],
            'is_active': bool(updated_host['is_active'])
        })
    except sqlite3.IntegrityError:
        db.close()
        return jsonify({'error': 'Hostname already exists'}), 409


@app.route('/api/hosts/<int:host_id>', methods=['DELETE'])
@admin_required
def delete_host(host_id):
    """Delete host"""
    db = get_db()
    host = db.execute('SELECT * FROM hosts WHERE id = ?', (host_id,)).fetchone()
    
    if not host:
        db.close()
        return jsonify({'error': 'Host not found'}), 404
    
    db.execute('DELETE FROM hosts WHERE id = ?', (host_id,))
    db.commit()
    db.close()
    
    return jsonify({'success': True})


@app.route('/api/hosts/<int:host_id>/regenerate-key', methods=['POST'])
@admin_required
def regenerate_api_key(host_id):
    """Regenerate API key for host"""
    db = get_db()
    host = db.execute('SELECT * FROM hosts WHERE id = ?', (host_id,)).fetchone()
    
    if not host:
        db.close()
        return jsonify({'error': 'Host not found'}), 404
    
    new_api_key = generate_api_key()
    db.execute('UPDATE hosts SET api_key = ? WHERE id = ?', (new_api_key, host_id))
    db.commit()
    db.close()
    
    return jsonify({'api_key': new_api_key})


# Groups API
@app.route('/api/groups', methods=['GET'])
@login_required
def get_groups():
    """Get all groups"""
    db = get_db()
    groups = db.execute('''
        SELECT g.*, COUNT(h.id) as host_count
        FROM groups g
        LEFT JOIN hosts h ON h.group_id = g.id
        GROUP BY g.id
        ORDER BY g.name
    ''').fetchall()
    db.close()
    
    return jsonify([{
        'id': group['id'],
        'name': group['name'],
        'icon': group['icon'],
        'description': group['description'],
        'color': group['color'],
        'host_count': group['host_count'],
        'created_at': group['created_at']
    } for group in groups])


@app.route('/api/groups', methods=['POST'])
@admin_required
def add_group():
    """Add new group"""
    data = request.json
    name = data.get('name')
    icon = data.get('icon', 'fa-server')
    description = data.get('description', '')
    color = data.get('color', '#667eea')
    
    if not name:
        return jsonify({'error': 'Group name required'}), 400
    
    db = get_db()
    try:
        cursor = db.execute(
            'INSERT INTO groups (name, icon, description, color) VALUES (?, ?, ?, ?)',
            (name, icon, description, color)
        )
        db.commit()
        group_id = cursor.lastrowid
        db.close()
        
        return jsonify({
            'id': group_id,
            'name': name,
            'icon': icon,
            'description': description,
            'color': color
        }), 201
    except sqlite3.IntegrityError:
        db.close()
        return jsonify({'error': 'Group name already exists'}), 409


@app.route('/api/groups/<int:group_id>', methods=['PUT'])
@admin_required
def update_group(group_id):
    """Update group"""
    data = request.json
    
    db = get_db()
    group = db.execute('SELECT * FROM groups WHERE id = ?', (group_id,)).fetchone()
    
    if not group:
        db.close()
        return jsonify({'error': 'Group not found'}), 404
    
    name = data.get('name', group['name'])
    icon = data.get('icon', group['icon'])
    description = data.get('description', group['description'])
    color = data.get('color', group['color'])
    
    try:
        db.execute(
            'UPDATE groups SET name = ?, icon = ?, description = ?, color = ? WHERE id = ?',
            (name, icon, description, color, group_id)
        )
        db.commit()
        db.close()
        
        return jsonify({
            'id': group_id,
            'name': name,
            'icon': icon,
            'description': description,
            'color': color
        })
    except sqlite3.IntegrityError:
        db.close()
        return jsonify({'error': 'Group name already exists'}), 409


@app.route('/api/groups/<int:group_id>', methods=['DELETE'])
@admin_required
def delete_group(group_id):
    """Delete group (hosts will be ungrouped)"""
    db = get_db()
    group = db.execute('SELECT * FROM groups WHERE id = ?', (group_id,)).fetchone()
    
    if not group:
        db.close()
        return jsonify({'error': 'Group not found'}), 404
    
    # Ungroup all hosts in this group
    db.execute('UPDATE hosts SET group_id = NULL WHERE group_id = ?', (group_id,))
    db.execute('DELETE FROM groups WHERE id = ?', (group_id,))
    db.commit()
    db.close()
    
    return jsonify({'success': True})


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
    print("Initializing database...")
    init_db()
    print("Dashboard available at: http://localhost:5000")
    print("API endpoint: http://localhost:5000/api/metrics")
    print("\nDefault admin credentials:")
    print("  Username: admin")
    print("  Password: admin123")
    app.run(host='0.0.0.0', port=5000, debug=True)

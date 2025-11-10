"""
Alert System for Monitoring
Handles alert checking, notification delivery, and alert history
"""
import sqlite3
import os
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import json
from threading import Thread, Lock
import time

# Database path
DATABASE = os.path.join('data', 'monitoring.db')
alert_lock = Lock()

# Alert state tracking (to prevent duplicate alerts)
alert_states = {}

def get_db():
    """Get database connection"""
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_alert_tables():
    """Initialize alert-related tables"""
    db = get_db()
    cursor = db.cursor()
    
    # Alert configuration table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alert_config (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            enabled INTEGER DEFAULT 1,
            server_down_timeout INTEGER DEFAULT 60,
            cpu_threshold INTEGER DEFAULT 70,
            disk_threshold INTEGER DEFAULT 90,
            network_timeout INTEGER DEFAULT 60,
            memory_threshold INTEGER DEFAULT 90,
            cooldown_period INTEGER DEFAULT 300,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Notification channels table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notification_channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_type TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            config TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Alert history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alert_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hostname TEXT NOT NULL,
            alert_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            message TEXT NOT NULL,
            metric_value REAL,
            threshold_value REAL,
            resolved INTEGER DEFAULT 0,
            resolved_at TIMESTAMP,
            notified_channels TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create default alert config if not exists
    cursor.execute('SELECT COUNT(*) as count FROM alert_config')
    if cursor.fetchone()['count'] == 0:
        cursor.execute('''
            INSERT INTO alert_config 
            (enabled, server_down_timeout, cpu_threshold, disk_threshold, network_timeout, memory_threshold)
            VALUES (1, 60, 70, 90, 60, 90)
        ''')
    
    db.commit()
    db.close()
    print("[ALERT] Alert tables initialized")

def get_alert_config():
    """Get current alert configuration"""
    db = get_db()
    config = db.execute('SELECT * FROM alert_config ORDER BY id DESC LIMIT 1').fetchone()
    db.close()
    return dict(config) if config else None

def update_alert_config(data):
    """Update alert configuration"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        UPDATE alert_config SET
            enabled = ?,
            server_down_timeout = ?,
            cpu_threshold = ?,
            disk_threshold = ?,
            network_timeout = ?,
            memory_threshold = ?,
            cooldown_period = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT id FROM alert_config ORDER BY id DESC LIMIT 1)
    ''', (
        data.get('enabled', 1),
        data.get('server_down_timeout', 60),
        data.get('cpu_threshold', 70),
        data.get('disk_threshold', 90),
        data.get('network_timeout', 60),
        data.get('memory_threshold', 90),
        data.get('cooldown_period', 300)
    ))
    
    db.commit()
    db.close()

def get_notification_channels():
    """Get all notification channels"""
    db = get_db()
    channels = db.execute('SELECT * FROM notification_channels').fetchall()
    db.close()
    return [dict(ch) for ch in channels]

def save_notification_channel(channel_type, config, enabled=1):
    """Save or update notification channel"""
    db = get_db()
    cursor = db.cursor()
    
    # Check if channel exists
    existing = cursor.execute(
        'SELECT id FROM notification_channels WHERE channel_type = ?',
        (channel_type,)
    ).fetchone()
    
    config_json = json.dumps(config)
    
    if existing:
        cursor.execute('''
            UPDATE notification_channels 
            SET config = ?, enabled = ?, updated_at = CURRENT_TIMESTAMP
            WHERE channel_type = ?
        ''', (config_json, enabled, channel_type))
    else:
        cursor.execute('''
            INSERT INTO notification_channels (channel_type, config, enabled)
            VALUES (?, ?, ?)
        ''', (channel_type, config_json, enabled))
    
    db.commit()
    db.close()

def delete_notification_channel(channel_id):
    """Delete notification channel"""
    db = get_db()
    db.execute('DELETE FROM notification_channels WHERE id = ?', (channel_id,))
    db.commit()
    db.close()

def create_alert(hostname, alert_type, severity, message, metric_value=None, threshold_value=None):
    """Create alert in history"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        INSERT INTO alert_history 
        (hostname, alert_type, severity, message, metric_value, threshold_value)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (hostname, alert_type, severity, message, metric_value, threshold_value))
    
    alert_id = cursor.lastrowid
    db.commit()
    db.close()
    
    return alert_id

def resolve_alert(alert_id):
    """Mark alert as resolved"""
    db = get_db()
    db.execute('''
        UPDATE alert_history 
        SET resolved = 1, resolved_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (alert_id,))
    db.commit()
    db.close()

def get_unresolved_alerts(hostname=None):
    """Get unresolved alerts"""
    db = get_db()
    if hostname:
        alerts = db.execute('''
            SELECT * FROM alert_history 
            WHERE hostname = ? AND resolved = 0
            ORDER BY created_at DESC
        ''', (hostname,)).fetchall()
    else:
        alerts = db.execute('''
            SELECT * FROM alert_history 
            WHERE resolved = 0
            ORDER BY created_at DESC
        ''').fetchall()
    db.close()
    return [dict(alert) for alert in alerts]

def get_alert_history(limit=100, hostname=None):
    """Get alert history"""
    db = get_db()
    if hostname:
        alerts = db.execute('''
            SELECT * FROM alert_history 
            WHERE hostname = ?
            ORDER BY created_at DESC
            LIMIT ?
        ''', (hostname, limit)).fetchall()
    else:
        alerts = db.execute('''
            SELECT * FROM alert_history 
            ORDER BY created_at DESC
            LIMIT ?
        ''', (limit,)).fetchall()
    db.close()
    return [dict(alert) for alert in alerts]

# ==================== NOTIFICATION FUNCTIONS ====================

def send_email_notification(config, subject, message):
    """Send email notification"""
    try:
        smtp_server = config.get('smtp_server')
        smtp_port = config.get('smtp_port', 587)
        username = config.get('username')
        password = config.get('password')
        from_email = config.get('from_email', username)
        to_emails = config.get('to_emails', [])
        
        if not all([smtp_server, username, password, to_emails]):
            print("[EMAIL] Missing required configuration")
            return False
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = ', '.join(to_emails)
        msg['Subject'] = subject
        
        # Add HTML body
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #e53e3e;">🚨 Server Alert</h2>
                <div style="background: #f7fafc; padding: 15px; border-left: 4px solid #e53e3e; margin: 20px 0;">
                    {message.replace('\n', '<br>')}
                </div>
                <p style="color: #718096; font-size: 12px; margin-top: 30px;">
                    This is an automated message from Server Monitoring System
                </p>
            </body>
        </html>
        """
        msg.attach(MIMEText(html_body, 'html'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(username, password)
            server.send_message(msg)
        
        print(f"[EMAIL] Alert sent to {to_emails}")
        return True
    except Exception as e:
        print(f"[EMAIL] Error sending notification: {e}")
        return False

def send_telegram_notification(config, message):
    """Send Telegram notification"""
    try:
        bot_token = config.get('bot_token')
        chat_id = config.get('chat_id')
        
        if not bot_token or not chat_id:
            print("[TELEGRAM] Missing bot_token or chat_id")
            return False
        
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        
        # Format message with emoji
        formatted_message = f"🚨 *Server Alert*\n\n{message}"
        
        payload = {
            'chat_id': chat_id,
            'text': formatted_message,
            'parse_mode': 'Markdown'
        }
        
        response = requests.post(url, json=payload, timeout=10)
        
        if response.status_code == 200:
            print(f"[TELEGRAM] Alert sent to chat {chat_id}")
            return True
        else:
            print(f"[TELEGRAM] Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"[TELEGRAM] Error sending notification: {e}")
        return False

def send_whatsapp_notification(config, message):
    """Send WhatsApp notification via Twilio or WhatsApp Business API"""
    try:
        provider = config.get('provider', 'twilio')
        
        if provider == 'twilio':
            return send_whatsapp_twilio(config, message)
        elif provider == 'fonnte':
            return send_whatsapp_fonnte(config, message)
        else:
            print(f"[WHATSAPP] Unknown provider: {provider}")
            return False
    except Exception as e:
        print(f"[WHATSAPP] Error sending notification: {e}")
        return False

def send_whatsapp_twilio(config, message):
    """Send WhatsApp via Twilio"""
    try:
        account_sid = config.get('account_sid')
        auth_token = config.get('auth_token')
        from_number = config.get('from_number')  # e.g., 'whatsapp:+14155238886'
        to_number = config.get('to_number')      # e.g., 'whatsapp:+6281234567890'
        
        if not all([account_sid, auth_token, from_number, to_number]):
            print("[WHATSAPP] Missing Twilio configuration")
            return False
        
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        
        payload = {
            'From': from_number,
            'To': to_number,
            'Body': f"🚨 SERVER ALERT\n\n{message}"
        }
        
        response = requests.post(
            url,
            data=payload,
            auth=(account_sid, auth_token),
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            print(f"[WHATSAPP-TWILIO] Alert sent to {to_number}")
            return True
        else:
            print(f"[WHATSAPP-TWILIO] Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"[WHATSAPP-TWILIO] Error: {e}")
        return False

def send_whatsapp_fonnte(config, message):
    """Send WhatsApp via Fonnte.com (Indonesian service)"""
    try:
        api_key = config.get('api_key')
        target = config.get('target')  # Phone number, e.g., '6281234567890'
        
        if not api_key or not target:
            print("[WHATSAPP] Missing Fonnte configuration")
            return False
        
        url = "https://api.fonnte.com/send"
        
        headers = {
            'Authorization': api_key
        }
        
        payload = {
            'target': target,
            'message': f"🚨 *SERVER ALERT*\n\n{message}",
            'countryCode': '62'
        }
        
        response = requests.post(url, data=payload, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print(f"[WHATSAPP-FONNTE] Alert sent to {target}")
            return True
        else:
            print(f"[WHATSAPP-FONNTE] Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"[WHATSAPP-FONNTE] Error: {e}")
        return False

def send_notifications(subject, message):
    """Send notifications to all enabled channels"""
    channels = get_notification_channels()
    sent_channels = []
    
    for channel in channels:
        if not channel['enabled']:
            continue
        
        channel_type = channel['channel_type']
        config = json.loads(channel['config'])
        
        success = False
        if channel_type == 'email':
            success = send_email_notification(config, subject, message)
        elif channel_type == 'telegram':
            success = send_telegram_notification(config, message)
        elif channel_type == 'whatsapp':
            success = send_whatsapp_notification(config, message)
        
        if success:
            sent_channels.append(channel_type)
    
    return sent_channels

# ==================== ALERT CHECKING ====================

def check_server_down(current_metrics, alert_config):
    """Check for servers that are down (no data in X seconds)"""
    alerts_triggered = []
    timeout = alert_config['server_down_timeout']
    now = datetime.utcnow()
    
    for hostname, metrics in current_metrics.items():
        if not metrics:
            continue
        
        last_update_str = metrics.get('timestamp')
        if not last_update_str:
            continue
        
        try:
            last_update = datetime.fromisoformat(last_update_str.replace('Z', '+00:00'))
            if isinstance(last_update, str):
                last_update = datetime.fromisoformat(last_update)
            
            seconds_since_update = (now - last_update).total_seconds()
            
            # Check if server is down
            if seconds_since_update > timeout:
                alert_key = f"{hostname}_server_down"
                
                # Check cooldown
                if alert_key in alert_states:
                    last_alert_time = alert_states[alert_key]
                    if (now - last_alert_time).total_seconds() < alert_config['cooldown_period']:
                        continue
                
                alert_states[alert_key] = now
                
                message = f"""
Server: {hostname}
Alert: SERVER DOWN
Status: No data received for {int(seconds_since_update)} seconds
Threshold: {timeout} seconds
Time: {now.strftime('%Y-%m-%d %H:%M:%S')} UTC
                """.strip()
                
                alert_id = create_alert(
                    hostname=hostname,
                    alert_type='server_down',
                    severity='critical',
                    message=message,
                    metric_value=seconds_since_update,
                    threshold_value=timeout
                )
                
                alerts_triggered.append({
                    'id': alert_id,
                    'hostname': hostname,
                    'type': 'server_down',
                    'message': message
                })
        except Exception as e:
            print(f"[ALERT] Error checking server down for {hostname}: {e}")
    
    return alerts_triggered

def check_cpu_usage(current_metrics, alert_config):
    """Check for high CPU usage"""
    alerts_triggered = []
    threshold = alert_config['cpu_threshold']
    now = datetime.utcnow()
    
    for hostname, metrics in current_metrics.items():
        if not metrics or 'cpu' not in metrics:
            continue
        
        cpu_percent = metrics['cpu'].get('cpu_percent_total', 0)
        
        if cpu_percent > threshold:
            alert_key = f"{hostname}_cpu_high"
            
            # Check cooldown
            if alert_key in alert_states:
                last_alert_time = alert_states[alert_key]
                if (now - last_alert_time).total_seconds() < alert_config['cooldown_period']:
                    continue
            
            alert_states[alert_key] = now
            
            message = f"""
Server: {hostname}
Alert: HIGH CPU USAGE
Current: {cpu_percent:.1f}%
Threshold: {threshold}%
Time: {now.strftime('%Y-%m-%d %H:%M:%S')} UTC
            """.strip()
            
            alert_id = create_alert(
                hostname=hostname,
                alert_type='cpu_high',
                severity='warning',
                message=message,
                metric_value=cpu_percent,
                threshold_value=threshold
            )
            
            alerts_triggered.append({
                'id': alert_id,
                'hostname': hostname,
                'type': 'cpu_high',
                'message': message
            })
    
    return alerts_triggered

def check_disk_usage(current_metrics, alert_config):
    """Check for high disk usage"""
    alerts_triggered = []
    threshold = alert_config['disk_threshold']
    now = datetime.utcnow()
    
    for hostname, metrics in current_metrics.items():
        if not metrics or 'disk' not in metrics:
            continue
        
        disks = metrics['disk'].get('partitions', [])
        
        for disk in disks:
            usage_percent = disk.get('percent', 0)
            mount = disk.get('mountpoint', 'unknown')
            
            if usage_percent > threshold:
                alert_key = f"{hostname}_disk_high_{mount}"
                
                # Check cooldown
                if alert_key in alert_states:
                    last_alert_time = alert_states[alert_key]
                    if (now - last_alert_time).total_seconds() < alert_config['cooldown_period']:
                        continue
                
                alert_states[alert_key] = now
                
                message = f"""
Server: {hostname}
Alert: HIGH DISK USAGE
Mount: {mount}
Current: {usage_percent:.1f}%
Threshold: {threshold}%
Time: {now.strftime('%Y-%m-%d %H:%M:%S')} UTC
                """.strip()
                
                alert_id = create_alert(
                    hostname=hostname,
                    alert_type='disk_high',
                    severity='warning',
                    message=message,
                    metric_value=usage_percent,
                    threshold_value=threshold
                )
                
                alerts_triggered.append({
                    'id': alert_id,
                    'hostname': hostname,
                    'type': 'disk_high',
                    'message': message
                })
    
    return alerts_triggered

def check_memory_usage(current_metrics, alert_config):
    """Check for high memory usage"""
    alerts_triggered = []
    threshold = alert_config['memory_threshold']
    now = datetime.utcnow()
    
    for hostname, metrics in current_metrics.items():
        if not metrics or 'memory' not in metrics:
            continue
        
        memory_percent = metrics['memory'].get('memory_percent', 0)
        
        if memory_percent > threshold:
            alert_key = f"{hostname}_memory_high"
            
            # Check cooldown
            if alert_key in alert_states:
                last_alert_time = alert_states[alert_key]
                if (now - last_alert_time).total_seconds() < alert_config['cooldown_period']:
                    continue
            
            alert_states[alert_key] = now
            
            message = f"""
Server: {hostname}
Alert: HIGH MEMORY USAGE
Current: {memory_percent:.1f}%
Threshold: {threshold}%
Time: {now.strftime('%Y-%m-%d %H:%M:%S')} UTC
            """.strip()
            
            alert_id = create_alert(
                hostname=hostname,
                alert_type='memory_high',
                severity='warning',
                message=message,
                metric_value=memory_percent,
                threshold_value=threshold
            )
            
            alerts_triggered.append({
                'id': alert_id,
                'hostname': hostname,
                'type': 'memory_high',
                'message': message
            })
    
    return alerts_triggered

def check_alerts(current_metrics):
    """Main alert checking function"""
    alert_config = get_alert_config()
    
    if not alert_config or not alert_config['enabled']:
        return
    
    all_alerts = []
    
    # Check all alert conditions
    all_alerts.extend(check_server_down(current_metrics, alert_config))
    all_alerts.extend(check_cpu_usage(current_metrics, alert_config))
    all_alerts.extend(check_disk_usage(current_metrics, alert_config))
    all_alerts.extend(check_memory_usage(current_metrics, alert_config))
    
    # Send notifications for triggered alerts
    for alert in all_alerts:
        subject = f"🚨 Alert: {alert['type'].upper()} - {alert['hostname']}"
        sent_channels = send_notifications(subject, alert['message'])
        
        # Update alert with notified channels
        if sent_channels:
            db = get_db()
            db.execute('''
                UPDATE alert_history 
                SET notified_channels = ?
                WHERE id = ?
            ''', (json.dumps(sent_channels), alert['id']))
            db.commit()
            db.close()
    
    return all_alerts

# ==================== ALERT MONITORING THREAD ====================

def start_alert_monitor(current_metrics, interval=30):
    """Start background thread to monitor alerts"""
    def monitor_loop():
        while True:
            try:
                with alert_lock:
                    check_alerts(current_metrics)
            except Exception as e:
                print(f"[ALERT] Error in monitor loop: {e}")
            
            time.sleep(interval)
    
    monitor_thread = Thread(target=monitor_loop, daemon=True)
    monitor_thread.start()
    print(f"[ALERT] Alert monitor started (checking every {interval}s)")

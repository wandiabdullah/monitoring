#!/bin/bash
# Quick fix for monitoring-agent.service systemd error
# Fix: "Executable path is not absolute"

echo "========================================="
echo "  Monitoring Agent Service Quick Fix"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Check if service file exists
if [ ! -f /etc/systemd/system/monitoring-agent.service ]; then
    echo "❌ Service file not found: /etc/systemd/system/monitoring-agent.service"
    echo "Please run install.sh first"
    exit 1
fi

echo "Current service file:"
cat /etc/systemd/system/monitoring-agent.service
echo ""
echo "========================================="
echo ""

# Detect Python path
if command -v python3 &> /dev/null; then
    PYTHON_PATH=$(which python3)
    echo "✓ Found Python 3: $PYTHON_PATH"
elif command -v python2.7 &> /dev/null; then
    PYTHON_PATH=$(which python2.7)
    echo "✓ Found Python 2.7: $PYTHON_PATH"
elif command -v python &> /dev/null; then
    PYTHON_PATH=$(which python)
    echo "✓ Found Python: $PYTHON_PATH"
else
    echo "❌ Python not found!"
    exit 1
fi

# Backup old service file
echo "📦 Backing up old service file..."
cp /etc/systemd/system/monitoring-agent.service /etc/systemd/system/monitoring-agent.service.backup
echo "✓ Backup saved to: /etc/systemd/system/monitoring-agent.service.backup"
echo ""

# Read current configuration
echo "📝 Reading current configuration..."
API_KEY=$(grep "API_KEY=" /etc/systemd/system/monitoring-agent.service | sed 's/Environment="API_KEY=\(.*\)"/\1/')
SERVER_URL=$(grep "ExecStart=" /etc/systemd/system/monitoring-agent.service | grep -oP '(?<=--server )[^ ]+')
INTERVAL=$(grep "ExecStart=" /etc/systemd/system/monitoring-agent.service | grep -oP '(?<=--interval )[^ ]+' | head -1)
INTERVAL=${INTERVAL:-5}

# Check for key mapping flag
if grep -q "\-\-no-key-mapping" /etc/systemd/system/monitoring-agent.service; then
    KEY_MAPPING_FLAG="--no-key-mapping"
    CUSTOM_HOSTNAME=$(grep "ExecStart=" /etc/systemd/system/monitoring-agent.service | grep -oP '(?<=--hostname )[^ ]+' | head -1)
    if [ ! -z "$CUSTOM_HOSTNAME" ]; then
        KEY_MAPPING_FLAG="$KEY_MAPPING_FLAG --hostname $CUSTOM_HOSTNAME"
    fi
else
    KEY_MAPPING_FLAG=""
fi

echo "  API Key: ${API_KEY:0:20}..."
echo "  Server URL: $SERVER_URL"
echo "  Interval: $INTERVAL"
echo "  Key Mapping: ${KEY_MAPPING_FLAG:-enabled}"
echo ""

# Create new service file with absolute path
echo "🔧 Creating fixed service file..."
cat > /etc/systemd/system/monitoring-agent.service << EOF
[Unit]
Description=Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/monitoring-agent
Environment="API_KEY=$API_KEY"
ExecStart=$PYTHON_PATH /opt/monitoring-agent/monitor_agent.py --server $SERVER_URL --api-key \${API_KEY} --interval $INTERVAL $KEY_MAPPING_FLAG
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✓ Service file updated with absolute Python path"
echo ""

# Reload systemd
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload
echo "✓ Daemon reloaded"
echo ""

# Restart service
echo "🚀 Restarting monitoring-agent..."
systemctl stop monitoring-agent 2>/dev/null
systemctl start monitoring-agent

# Check status
sleep 2
echo ""
echo "========================================="
echo "  Service Status"
echo "========================================="
systemctl status monitoring-agent --no-pager

echo ""
echo "========================================="
echo "  Fix Complete!"
echo "========================================="
echo ""
echo "New service file:"
cat /etc/systemd/system/monitoring-agent.service
echo ""
echo "To view logs:"
echo "  journalctl -u monitoring-agent -f"
echo ""
echo "To check status:"
echo "  systemctl status monitoring-agent"
echo ""

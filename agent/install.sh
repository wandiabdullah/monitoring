#!/bin/bash
# Installation script for Linux Monitoring Agent

echo "========================================="
echo "  Linux Monitoring Agent Installation"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Get API key from user
read -p "Enter API Key (from dashboard): " API_KEY
if [ -z "$API_KEY" ]; then
    echo "❌ API Key is required!"
    exit 1
fi

# Get server URL
read -p "Enter Monitoring Server URL [http://monitoring-server:5000]: " SERVER_URL
SERVER_URL=${SERVER_URL:-http://monitoring-server:5000}

# Get hostname (optional)
read -p "Enter Hostname (leave empty for auto-detect): " HOSTNAME

# Get interval
read -p "Enter collection interval in seconds [5]: " INTERVAL
INTERVAL=${INTERVAL:-5}

# Install Python3 and pip if not available
if ! command -v python3 &> /dev/null; then
    echo "📦 Installing Python3..."
    apt-get update
    apt-get install -y python3 python3-pip
fi

# Install required Python packages
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

# Create systemd service
echo "⚙️  Creating systemd service..."

# Build ExecStart command
EXEC_CMD="/usr/bin/python3 /opt/monitoring-agent/monitor_agent.py --server $SERVER_URL --api-key \${API_KEY} --interval $INTERVAL"
if [ ! -z "$HOSTNAME" ]; then
    EXEC_CMD="$EXEC_CMD --hostname $HOSTNAME"
fi

cat > /etc/systemd/system/monitoring-agent.service << EOF
[Unit]
Description=Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/monitoring-agent
Environment="API_KEY=$API_KEY"
ExecStart=$EXEC_CMD
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Copy files to /opt
echo "📁 Copying files to /opt/monitoring-agent..."
mkdir -p /opt/monitoring-agent
cp monitor_agent.py /opt/monitoring-agent/
cp requirements.txt /opt/monitoring-agent/

# Set permissions
chmod +x /opt/monitoring-agent/monitor_agent.py

# Reload systemd
systemctl daemon-reload

echo ""
echo "✅ Installation complete!"
echo ""
echo "========================================="
echo "  Configuration Summary"
echo "========================================="
echo "Server URL: $SERVER_URL"
echo "API Key: ${API_KEY:0:20}..." 
echo "Hostname: ${HOSTNAME:-auto-detect}"
echo "Interval: $INTERVAL seconds"
echo ""
echo "========================================="
echo "  Next Steps"
echo "========================================="
echo ""
echo "Start the service:"
echo "  systemctl enable monitoring-agent"
echo "  systemctl start monitoring-agent"
echo ""
echo "Check status:"
echo "  systemctl status monitoring-agent"
echo ""
echo "View logs:"
echo "  journalctl -u monitoring-agent -f"
echo ""
echo "Configuration file:"
echo "  /etc/systemd/system/monitoring-agent.service"
echo ""
echo "⚠️  To change API key later, edit the service file and run:"
echo "  systemctl daemon-reload"
echo "  systemctl restart monitoring-agent"
echo ""

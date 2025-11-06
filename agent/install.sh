#!/bin/bash
# Installation script for Linux Monitoring Agent

echo "Installing Linux Monitoring Agent..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install Python3 and pip if not available
if ! command -v python3 &> /dev/null; then
    echo "Installing Python3..."
    apt-get update
    apt-get install -y python3 python3-pip
fi

# Install required Python packages
echo "Installing Python dependencies..."
pip3 install -r requirements.txt

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/monitoring-agent.service << 'EOF'
[Unit]
Description=Server Monitoring Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/monitoring-agent
ExecStart=/usr/bin/python3 /opt/monitoring-agent/monitor_agent.py --server http://YOUR_MONITORING_SERVER:5000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Copy files to /opt
echo "Copying files to /opt/monitoring-agent..."
mkdir -p /opt/monitoring-agent
cp monitor_agent.py /opt/monitoring-agent/
cp requirements.txt /opt/monitoring-agent/

# Set permissions
chmod +x /opt/monitoring-agent/monitor_agent.py

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit /etc/systemd/system/monitoring-agent.service"
echo "   Replace YOUR_MONITORING_SERVER with your monitoring server address"
echo "2. Enable and start the service:"
echo "   systemctl daemon-reload"
echo "   systemctl enable monitoring-agent"
echo "   systemctl start monitoring-agent"
echo "3. Check status:"
echo "   systemctl status monitoring-agent"
echo "   journalctl -u monitoring-agent -f"

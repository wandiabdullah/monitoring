#!/bin/bash
# Quick update script for monitoring agent
# Updates monitor_agent.py file on running system

echo "========================================="
echo "  Monitoring Agent Quick Update"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Check if agent directory exists
if [ ! -d /opt/monitoring-agent ]; then
    echo "❌ Agent directory not found: /opt/monitoring-agent"
    echo "Please run install.sh first"
    exit 1
fi

# Backup current agent
echo "📦 Backing up current agent..."
cp /opt/monitoring-agent/monitor_agent.py /opt/monitoring-agent/monitor_agent.py.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"
echo ""

# Copy new agent file
echo "📋 Updating agent file..."
if [ -f ./monitor_agent.py ]; then
    cp ./monitor_agent.py /opt/monitoring-agent/
    echo "✓ Agent file updated"
else
    echo "❌ monitor_agent.py not found in current directory"
    echo "Please run this script from the agent directory"
    exit 1
fi

# Ensure executable permission
chmod +x /opt/monitoring-agent/monitor_agent.py

# Restart service
echo ""
echo "🔄 Restarting monitoring-agent service..."
systemctl restart monitoring-agent

# Wait a moment
sleep 2

# Check status
echo ""
echo "========================================="
echo "  Service Status"
echo "========================================="
systemctl status monitoring-agent --no-pager -l

echo ""
echo "========================================="
echo "  Update Complete!"
echo "========================================="
echo ""
echo "To view live logs:"
echo "  journalctl -u monitoring-agent -f"
echo ""
echo "To check for errors:"
echo "  journalctl -u monitoring-agent -n 50"
echo ""

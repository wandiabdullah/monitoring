#!/bin/bash

# Simple Update Script - Download and replace agent

echo "=========================================="
echo "Updating Monitor Agent - System Info Fix"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Error: This script must be run as root"
    echo "Please run: sudo $0"
    exit 1
fi

# Find agent location
AGENT_PATH=""
if [ -f "/opt/monitor-agent/monitor_agent.py" ]; then
    AGENT_PATH="/opt/monitor-agent/monitor_agent.py"
elif [ -f "/usr/local/bin/monitor_agent.py" ]; then
    AGENT_PATH="/usr/local/bin/monitor_agent.py"
else
    echo "Error: Agent not found"
    exit 1
fi

echo "Found agent at: $AGENT_PATH"

# Backup
BACKUP_PATH="${AGENT_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$AGENT_PATH" "$BACKUP_PATH"
echo "Backup created: $BACKUP_PATH"
echo ""

# Download new version (or copy from local if testing)
echo "Downloading updated agent..."
# wget -O "$AGENT_PATH" http://YOUR_BACKEND_SERVER/static/monitor_agent.py

# For now, manual instruction:
echo ""
echo "=========================================="
echo "MANUAL UPDATE REQUIRED"
echo "=========================================="
echo ""
echo "Please copy the updated monitor_agent.py to:"
echo "  $AGENT_PATH"
echo ""
echo "Or run this command from your monitoring server:"
echo ""
echo "scp monitor_agent.py root@$(hostname):$AGENT_PATH"
echo ""
echo "Then restart the agent:"
echo "  systemctl restart monitor-agent"
echo ""


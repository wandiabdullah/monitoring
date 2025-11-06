#!/bin/bash
# Installation script for Linux Monitoring Agent
# Compatible with: CentOS 6/7/8, RHEL, Rocky, AlmaLinux, Ubuntu, Debian

echo "========================================="
echo "  Linux Monitoring Agent Installation"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
elif [ -f /etc/redhat-release ]; then
    OS="centos"
    VER=$(cat /etc/redhat-release | grep -oE '[0-9]+\.[0-9]+' | head -1)
else
    OS=$(uname -s)
    VER=$(uname -r)
fi

echo "Detected OS: $OS $VER"
echo ""

# Get API key from user
read -p "Enter API Key (from dashboard): " API_KEY
if [ -z "$API_KEY" ]; then
    echo "❌ API Key is required!"
    exit 1
fi

# Get server URL
read -p "Enter Monitoring Server URL [http://monitoring-server:5000]: " SERVER_URL
SERVER_URL=${SERVER_URL:-http://monitoring-server:5000}

# Ask about key mapping
echo ""
echo "🔐 Key Mapping Configuration:"
echo "  ✅ Enabled (recommended): Hostname determined by server from API key (secure)"
echo "  ❌ Disabled: Agent sends its own hostname (flexible)"
echo ""
read -p "Enable Key Mapping? [Y/n]: " USE_KEY_MAPPING
USE_KEY_MAPPING=${USE_KEY_MAPPING:-Y}

# Get hostname only if key mapping is disabled
HOSTNAME=""
if [[ "$USE_KEY_MAPPING" =~ ^[Nn]$ ]]; then
    read -p "Enter Hostname (leave empty for auto-detect): " HOSTNAME
fi

# Get interval
read -p "Enter collection interval in seconds [5]: " INTERVAL
INTERVAL=${INTERVAL:-5}

# Install Python and pip based on OS
echo "📦 Installing dependencies..."

if [[ "$OS" == "centos" ]] || [[ "$OS" == "rhel" ]] || [[ "$OS" == "rocky" ]] || [[ "$OS" == "almalinux" ]]; then
    # CentOS/RHEL/Rocky/AlmaLinux
    echo "Installing for CentOS/RHEL based system..."
    
    # Determine Python version available
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        PIP_CMD="pip3"
    elif command -v python2.7 &> /dev/null; then
        PYTHON_CMD="python2.7"
        PIP_CMD="pip2.7"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
        PIP_CMD="pip"
    else
        echo "Installing Python..."
        if [[ "$VER" == "6"* ]]; then
            # CentOS 6
            yum install -y python27 python27-pip
            PYTHON_CMD="python2.7"
            PIP_CMD="pip2.7"
        elif [[ "$VER" == "7"* ]]; then
            # CentOS 7
            yum install -y python3 python3-pip
            PYTHON_CMD="python3"
            PIP_CMD="pip3"
        else
            # CentOS 8+
            dnf install -y python3 python3-pip
            PYTHON_CMD="python3"
            PIP_CMD="pip3"
        fi
    fi
    
elif [[ "$OS" == "ubuntu" ]] || [[ "$OS" == "debian" ]]; then
    # Ubuntu/Debian
    echo "Installing for Debian based system..."
    apt-get update
    
    if ! command -v python3 &> /dev/null; then
        apt-get install -y python3 python3-pip
    fi
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
    
else
    echo "⚠️  Unknown OS. Attempting generic installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
        PIP_CMD="pip3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
        PIP_CMD="pip"
    else
        echo "❌ Python not found. Please install Python manually."
        exit 1
    fi
fi

echo "Using Python: $PYTHON_CMD ($($PYTHON_CMD --version 2>&1))"

# Install required Python packages
echo "📦 Installing Python dependencies..."
$PIP_CMD install -r requirements.txt || {
    # Fallback for older systems
    echo "Trying alternative installation method..."
    $PYTHON_CMD -m pip install --upgrade pip
    $PYTHON_CMD -m pip install -r requirements.txt
}

# Create systemd service
echo "⚙️  Creating systemd service..."

# Build ExecStart command
EXEC_CMD="$PYTHON_CMD /opt/monitoring-agent/monitor_agent.py --server $SERVER_URL --api-key \${API_KEY} --interval $INTERVAL"

# Add key mapping flag if disabled
if [[ "$USE_KEY_MAPPING" =~ ^[Nn]$ ]]; then
    EXEC_CMD="$EXEC_CMD --no-key-mapping"
    if [ ! -z "$HOSTNAME" ]; then
        EXEC_CMD="$EXEC_CMD --hostname $HOSTNAME"
    fi
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
if [[ "$USE_KEY_MAPPING" =~ ^[Nn]$ ]]; then
    echo "Key Mapping: ❌ Disabled"
    echo "Hostname: ${HOSTNAME:-auto-detect}"
else
    echo "Key Mapping: ✅ Enabled (hostname from server)"
fi
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
echo "⚠️  To change settings later, edit the service file and run:"
echo "  systemctl daemon-reload"
echo "  systemctl restart monitoring-agent"
echo ""

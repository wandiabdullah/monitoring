#!/bin/bash

# Start Monitoring Backend Server

echo "🚀 Starting Monitoring Backend Server..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed!"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Create data directory
mkdir -p data

# Start server
echo "✅ Starting server..."
echo "Dashboard: http://localhost:5000"
echo "Press Ctrl+C to stop"
echo ""

cd backend
python app.py

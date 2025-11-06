#!/bin/bash

# Test API Endpoints Script
# Usage: ./test-api.sh [hostname]

BACKEND_URL="http://localhost"
HOSTNAME="${1:-server1.sumedangkab.go.id}"

echo "Testing API endpoints for: $HOSTNAME"
echo "========================================"

# Test 1: List all servers
echo ""
echo "1. Testing /api/servers (list all servers)..."
curl -s "$BACKEND_URL/api/servers" | python3 -m json.tool | head -20
echo ""

# Test 2: Current metrics
echo "2. Testing /api/servers/$HOSTNAME/current..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BACKEND_URL/api/servers/$HOSTNAME/current")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ Status: $HTTP_STATUS OK"
    echo "$BODY" | python3 -m json.tool | head -30
else
    echo "✗ Status: $HTTP_STATUS ERROR"
    echo "$BODY"
fi
echo ""

# Test 3: History
echo "3. Testing /api/servers/$HOSTNAME/history..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BACKEND_URL/api/servers/$HOSTNAME/history?limit=5")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ Status: $HTTP_STATUS OK"
    ITEMS=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)")
    echo "Items count: $ITEMS"
    echo "$BODY" | python3 -m json.tool | head -20
else
    echo "✗ Status: $HTTP_STATUS ERROR"
    echo "$BODY"
fi
echo ""

# Test 4: Disk
echo "4. Testing /api/servers/$HOSTNAME/disk..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BACKEND_URL/api/servers/$HOSTNAME/disk")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ Status: $HTTP_STATUS OK"
    echo "$BODY" | python3 -m json.tool
else
    echo "✗ Status: $HTTP_STATUS ERROR"
    echo "$BODY"
fi
echo ""

# Test 5: Network
echo "5. Testing /api/servers/$HOSTNAME/network..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BACKEND_URL/api/servers/$HOSTNAME/network")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✓ Status: $HTTP_STATUS OK"
    ITEMS=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data) if isinstance(data, list) else 0)")
    echo "Items count: $ITEMS"
    echo "$BODY" | python3 -m json.tool | head -20
else
    echo "✗ Status: $HTTP_STATUS ERROR"
    echo "$BODY"
fi
echo ""

echo "========================================"
echo "API Test Complete"

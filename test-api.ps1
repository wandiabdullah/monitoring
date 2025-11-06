# Test API Endpoints Script (PowerShell)
# Usage: .\test-api.ps1 [hostname]

param(
    [string]$Hostname = "server1.sumedangkab.go.id"
)

$BackendUrl = "http://localhost"

Write-Host "Testing API endpoints for: $Hostname" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 1: List all servers
Write-Host ""
Write-Host "1. Testing /api/servers (list all servers)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/servers" -Method Get
    Write-Host "✓ Success" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Select-Object -First 20
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
}

# Test 2: Current metrics
Write-Host ""
Write-Host "2. Testing /api/servers/$Hostname/current..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/servers/$Hostname/current" -Method Get
    Write-Host "✓ Status: 200 OK" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Select-Object -First 30
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✗ Status: $statusCode ERROR" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 3: History
Write-Host ""
Write-Host "3. Testing /api/servers/$Hostname/history..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/servers/$Hostname/history?limit=5" -Method Get
    Write-Host "✓ Status: 200 OK" -ForegroundColor Green
    Write-Host "Items count: $($response.Count)" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3 | Select-Object -First 20
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✗ Status: $statusCode ERROR" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 4: Disk
Write-Host ""
Write-Host "4. Testing /api/servers/$Hostname/disk..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/servers/$Hostname/disk" -Method Get
    Write-Host "✓ Status: 200 OK" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✗ Status: $statusCode ERROR" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 5: Network
Write-Host ""
Write-Host "5. Testing /api/servers/$Hostname/network..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/api/servers/$Hostname/network" -Method Get
    Write-Host "✓ Status: 200 OK" -ForegroundColor Green
    Write-Host "Items count: $($response.Count)" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 3 | Select-Object -First 20
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✗ Status: $statusCode ERROR" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Test Complete" -ForegroundColor Cyan

# Additional check: Show available hostnames
Write-Host ""
Write-Host "Available hostnames in system:" -ForegroundColor Yellow
try {
    $servers = Invoke-RestMethod -Uri "$BackendUrl/api/servers" -Method Get
    foreach ($server in $servers) {
        Write-Host "  - $($server.hostname)" -ForegroundColor White
    }
} catch {
    Write-Host "  Could not retrieve server list" -ForegroundColor Red
}

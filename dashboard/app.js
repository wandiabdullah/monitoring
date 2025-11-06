// Configuration
const API_BASE_URL = window.location.origin;
const REFRESH_INTERVAL = 5000; // 5 seconds

let selectedServer = null;
let historyChart = null;
let networkChart = null;
let refreshTimer = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadServers();
    startAutoRefresh();
});

// Auto refresh
function startAutoRefresh() {
    refreshTimer = setInterval(() => {
        loadServers();
        if (selectedServer) {
            loadServerDetail(selectedServer);
        }
    }, REFRESH_INTERVAL);
}

// Load servers list
async function loadServers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/servers`);
        const servers = await response.json();
        
        updateLastUpdateTime();
        renderServers(servers);
    } catch (error) {
        console.error('Error loading servers:', error);
    }
}

// Render servers grid
function renderServers(servers) {
    const grid = document.getElementById('serversGrid');
    
    if (servers.length === 0) {
        grid.innerHTML = '<div class="no-data">Tidak ada data server. Pastikan agent sudah berjalan dan mengirim data.</div>';
        return;
    }
    
    grid.innerHTML = servers.map(server => `
        <div class="server-card ${selectedServer === server.hostname ? 'selected' : ''}" 
             onclick="selectServer('${server.hostname}')">
            <div class="server-header">
                <div class="server-name">${server.hostname}</div>
                <div class="status-badge status-${server.status}">
                    ${server.status === 'online' ? '● Online' : '● Offline'}
                </div>
            </div>
            
            <div class="metric-row">
                <div class="metric-label">
                    <span>CPU</span>
                    <span>${server.cpu_percent.toFixed(1)}%</span>
                </div>
                <div class="metric-bar">
                    <div class="metric-fill cpu" style="width: ${server.cpu_percent}%"></div>
                </div>
            </div>
            
            <div class="metric-row">
                <div class="metric-label">
                    <span>Memory</span>
                    <span>${server.memory_percent.toFixed(1)}%</span>
                </div>
                <div class="metric-bar">
                    <div class="metric-fill memory" style="width: ${server.memory_percent}%"></div>
                </div>
            </div>
            
            <div style="font-size: 12px; color: #999; margin-top: 10px;">
                Last update: ${formatTime(server.last_update)}
            </div>
        </div>
    `).join('');
}

// Select server
async function selectServer(hostname) {
    selectedServer = hostname;
    loadServers(); // Update selection UI
    await loadServerDetail(hostname);
    document.getElementById('detailSection').classList.add('active');
    document.getElementById('detailTitle').textContent = `📊 ${hostname}`;
}

// Close detail
function closeDetail() {
    selectedServer = null;
    document.getElementById('detailSection').classList.remove('active');
    loadServers(); // Update selection UI
}

// Load server detail
async function loadServerDetail(hostname) {
    try {
        // Load current metrics
        const currentResponse = await fetch(`${API_BASE_URL}/api/servers/${hostname}/current`);
        const current = await currentResponse.json();
        
        // Load history
        const historyResponse = await fetch(`${API_BASE_URL}/api/servers/${hostname}/history?minutes=5&limit=60`);
        const history = await historyResponse.json();
        
        // Load disk info
        const diskResponse = await fetch(`${API_BASE_URL}/api/servers/${hostname}/disk`);
        const diskInfo = await diskResponse.json();
        
        // Load network info
        const networkResponse = await fetch(`${API_BASE_URL}/api/servers/${hostname}/network?minutes=5`);
        const networkInfo = await networkResponse.json();
        
        // Update UI
        updateCurrentStats(current);
        updateHistoryChart(history);
        updateDiskInfo(diskInfo);
        updateNetworkChart(networkInfo);
        
    } catch (error) {
        console.error('Error loading server detail:', error);
    }
}

// Update current stats
function updateCurrentStats(data) {
    const cpu = data.cpu || {};
    const memory = data.memory || {};
    
    document.getElementById('cpuCurrent').textContent = `${cpu.cpu_percent_total?.toFixed(1) || 0}%`;
    document.getElementById('memoryCurrent').textContent = `${memory.memory_percent?.toFixed(1) || 0}%`;
    document.getElementById('cpuCores').textContent = cpu.cpu_count_logical || '-';
    document.getElementById('memoryTotal').textContent = formatBytes(memory.memory_total || 0);
}

// Update history chart
function updateHistoryChart(history) {
    const ctx = document.getElementById('historyChart');
    
    // Reverse to show oldest to newest
    const sortedHistory = history.reverse();
    
    const labels = sortedHistory.map(m => formatTime(m.timestamp));
    const cpuData = sortedHistory.map(m => m.cpu?.cpu_percent_total || 0);
    const memoryData = sortedHistory.map(m => m.memory?.memory_percent || 0);
    
    if (historyChart) {
        historyChart.destroy();
    }
    
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'CPU %',
                    data: cpuData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Memory %',
                    data: memoryData,
                    borderColor: '#f5576c',
                    backgroundColor: 'rgba(245, 87, 108, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        maxTicksLimit: 10
                    }
                }
            }
        }
    });
}

// Update network chart
function updateNetworkChart(networkData) {
    const ctx = document.getElementById('networkChart');
    
    // Reverse to show oldest to newest
    const sortedData = networkData.reverse();
    
    const labels = sortedData.map(n => formatTime(n.timestamp));
    const uploadData = sortedData.map(n => (n.bytes_sent_per_sec || 0) / 1024); // KB/s
    const downloadData = sortedData.map(n => (n.bytes_recv_per_sec || 0) / 1024); // KB/s
    
    // Update current speeds
    if (sortedData.length > 0) {
        const latest = sortedData[sortedData.length - 1];
        document.getElementById('uploadSpeed').textContent = 
            `${((latest.bytes_sent_per_sec || 0) / 1024).toFixed(1)} KB/s`;
        document.getElementById('downloadSpeed').textContent = 
            `${((latest.bytes_recv_per_sec || 0) / 1024).toFixed(1)} KB/s`;
    }
    
    if (networkChart) {
        networkChart.destroy();
    }
    
    networkChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Upload (KB/s)',
                    data: uploadData,
                    borderColor: '#43e97b',
                    backgroundColor: 'rgba(67, 233, 123, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Download (KB/s)',
                    data: downloadData,
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.5,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + ' KB/s';
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                        maxTicksLimit: 10
                    }
                }
            }
        }
    });
}

// Update disk info
function updateDiskInfo(disks) {
    const container = document.getElementById('diskList');
    
    if (!disks || disks.length === 0) {
        container.innerHTML = '<div class="no-data">Tidak ada data disk</div>';
        return;
    }
    
    container.innerHTML = disks.map(disk => `
        <div class="disk-item">
            <div class="disk-header">
                <div class="disk-name">${disk.mountpoint}</div>
                <div class="disk-size">${formatBytes(disk.used)} / ${formatBytes(disk.total)}</div>
            </div>
            <div class="metric-row">
                <div class="metric-label">
                    <span>${disk.device} (${disk.fstype})</span>
                    <span>${disk.percent.toFixed(1)}%</span>
                </div>
                <div class="metric-bar">
                    <div class="metric-fill disk" style="width: ${disk.percent}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

// Utility functions
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = 
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    if (historyChart) {
        historyChart.destroy();
    }
    if (networkChart) {
        networkChart.destroy();
    }
});

// Host Detail Page JavaScript
let hostname = '';
let historyChart = null;
let networkChart = null;
let updateInterval = null;

// Get hostname from URL
function getHostnameFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('host');
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format speed
function formatSpeed(bytesPerSec) {
    if (bytesPerSec < 1024) return bytesPerSec.toFixed(2) + ' B/s';
    if (bytesPerSec < 1024 * 1024) return (bytesPerSec / 1024).toFixed(2) + ' KB/s';
    return (bytesPerSec / (1024 * 1024)).toFixed(2) + ' MB/s';
}

// Update host info
function updateHostInfo(data) {
    const infoGrid = document.getElementById('hostInfo');
    const system = data.system || {};
    
    infoGrid.innerHTML = `
        <div class="info-item">
            <div class="info-label">Hostname</div>
            <div class="info-value">${data.hostname || '-'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Operating System</div>
            <div class="info-value">${system.os || '-'} ${system.os_version || ''}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Kernel</div>
            <div class="info-value">${system.kernel || '-'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Architecture</div>
            <div class="info-value">${system.architecture || '-'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Uptime</div>
            <div class="info-value">${system.uptime || '-'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Last Boot</div>
            <div class="info-value">${system.boot_time || '-'}</div>
        </div>
    `;
}

// Update stats cards
function updateStats(data) {
    const cpu = data.cpu || {};
    const memory = data.memory || {};
    const swap = data.swap || {};
    const load = data.load_average || [0, 0, 0];

    // CPU
    document.getElementById('cpuValue').textContent = cpu.percent?.toFixed(1) + '%' || '0%';
    document.getElementById('cpuCores').textContent = `${cpu.cores || 0} cores`;
    document.getElementById('cpuProgress').style.width = (cpu.percent || 0) + '%';

    // Memory
    const memPercent = memory.percent || 0;
    const memUsed = formatBytes(memory.used || 0);
    const memTotal = formatBytes(memory.total || 0);
    document.getElementById('memoryValue').textContent = memPercent.toFixed(1) + '%';
    document.getElementById('memorySize').textContent = `${memUsed} / ${memTotal}`;
    document.getElementById('memoryProgress').style.width = memPercent + '%';

    // Swap
    const swapPercent = swap.percent || 0;
    const swapUsed = formatBytes(swap.used || 0);
    const swapTotal = formatBytes(swap.total || 0);
    document.getElementById('swapValue').textContent = swapPercent.toFixed(1) + '%';
    document.getElementById('swapSize').textContent = `${swapUsed} / ${swapTotal}`;
    document.getElementById('swapProgress').style.width = swapPercent + '%';

    // Load Average
    document.getElementById('loadValue').textContent = load[0]?.toFixed(2) || '0.0';
}

// Update disk list
function updateDiskList(data) {
    const diskList = document.getElementById('diskList');
    const disks = data.disks || [];

    if (disks.length === 0) {
        diskList.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">No disk data available</div>';
        return;
    }

    diskList.innerHTML = disks.map(disk => {
        const percent = disk.percent || 0;
        const color = percent > 90 ? '#dc3545' : percent > 75 ? '#ffc107' : '#4facfe';
        
        return `
            <div class="disk-item">
                <div class="disk-header">
                    <div class="disk-name">
                        <i class="fas fa-hdd"></i> ${disk.mountpoint || disk.device}
                    </div>
                    <div class="disk-usage">${percent.toFixed(1)}% Used</div>
                </div>
                <div class="disk-progress">
                    <div class="disk-progress-fill" style="width: ${percent}%; background: ${color}"></div>
                </div>
                <div class="disk-size">
                    ${formatBytes(disk.used || 0)} / ${formatBytes(disk.total || 0)} 
                    (${formatBytes(disk.free || 0)} free)
                </div>
            </div>
        `;
    }).join('');
}

// Update network speeds
function updateNetworkSpeeds(data) {
    const network = data.network || {};
    const upload = network.bytes_sent_per_sec || 0;
    const download = network.bytes_recv_per_sec || 0;

    document.getElementById('uploadSpeed').textContent = formatSpeed(upload);
    document.getElementById('downloadSpeed').textContent = formatSpeed(download);
}

// Initialize history chart
function initHistoryChart() {
    const ctx = document.getElementById('historyChart');
    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'CPU %',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Memory %',
                    data: [],
                    borderColor: '#f093fb',
                    backgroundColor: 'rgba(240, 147, 251, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
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
                }
            }
        }
    });
}

// Initialize network chart
function initNetworkChart() {
    const ctx = document.getElementById('networkChart');
    networkChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Upload',
                    data: [],
                    borderColor: '#43e97b',
                    backgroundColor: 'rgba(67, 233, 123, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Download',
                    data: [],
                    borderColor: '#38f9d7',
                    backgroundColor: 'rgba(56, 249, 215, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatSpeed(value);
                        }
                    }
                }
            }
        }
    });
}

// Update history chart
function updateHistoryChart(data) {
    if (!historyChart) return;

    const history = data.history || [];
    const maxPoints = 60; // 5 minutes of data (5s interval)

    const labels = history.map(h => {
        const date = new Date(h.timestamp);
        return date.toLocaleTimeString();
    }).slice(-maxPoints);

    const cpuData = history.map(h => h.cpu?.percent || 0).slice(-maxPoints);
    const memData = history.map(h => h.memory?.percent || 0).slice(-maxPoints);

    historyChart.data.labels = labels;
    historyChart.data.datasets[0].data = cpuData;
    historyChart.data.datasets[1].data = memData;
    historyChart.update('none'); // Update without animation
}

// Update network chart
function updateNetworkChart(data) {
    if (!networkChart) return;

    const network = data.network_history || [];
    const maxPoints = 60;

    const labels = network.map(n => {
        const date = new Date(n.timestamp);
        return date.toLocaleTimeString();
    }).slice(-maxPoints);

    const uploadData = network.map(n => n.bytes_sent_per_sec || 0).slice(-maxPoints);
    const downloadData = network.map(n => n.bytes_recv_per_sec || 0).slice(-maxPoints);

    networkChart.data.labels = labels;
    networkChart.data.datasets[0].data = uploadData;
    networkChart.data.datasets[1].data = downloadData;
    networkChart.update('none');
}

// Fetch current data
async function fetchCurrentData() {
    try {
        console.log('[DEBUG] Fetching current data for:', hostname);
        const response = await fetch(`/api/servers/${hostname}/current`);
        console.log('[DEBUG] Current data response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('[DEBUG] Current data received:', data);
        
        // Update all components
        updateStats(data);
        updateHostInfo(data);
        updateNetworkSpeeds(data);
        
        // Update status badge
        const statusBadge = document.getElementById('hostStatus');
        statusBadge.innerHTML = '<i class="fas fa-circle"></i> Online';
        statusBadge.className = 'status-badge online';
        
        // Update last update time
        const now = new Date();
        document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();
        
    } catch (error) {
        console.error('[ERROR] Error fetching current data:', error);
        const statusBadge = document.getElementById('hostStatus');
        statusBadge.innerHTML = '<i class="fas fa-circle"></i> Offline';
        statusBadge.className = 'status-badge offline';
    }
}

// Fetch history data
async function fetchHistoryData() {
    try {
        const response = await fetch(`/api/servers/${hostname}/history`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        updateHistoryChart(data);
    } catch (error) {
        console.error('Error fetching history data:', error);
    }
}

// Fetch disk data
async function fetchDiskData() {
    try {
        const response = await fetch(`/api/servers/${hostname}/disk`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        updateDiskList(data);
    } catch (error) {
        console.error('Error fetching disk data:', error);
    }
}

// Fetch network data
async function fetchNetworkData() {
    try {
        const response = await fetch(`/api/servers/${hostname}/network`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        updateNetworkChart(data);
    } catch (error) {
        console.error('Error fetching network data:', error);
    }
}

// Fetch all data
async function fetchAllData() {
    await Promise.all([
        fetchCurrentData(),
        fetchHistoryData(),
        fetchDiskData(),
        fetchNetworkData()
    ]);
}

// Initialize page
async function init() {
    hostname = getHostnameFromURL();
    
    if (!hostname) {
        alert('No host specified in URL');
        window.location.href = '/';
        return;
    }

    // Update page title
    document.getElementById('hostName').textContent = hostname;
    document.getElementById('hostSubtitle').textContent = `Monitoring ${hostname}`;
    document.title = `${hostname} - Host Monitoring`;

    // Initialize charts
    initHistoryChart();
    initNetworkChart();

    // Fetch initial data
    await fetchAllData();

    // Show content, hide loading
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('contentArea').style.display = 'block';

    // Start auto-refresh (every 5 seconds)
    updateInterval = setInterval(fetchAllData, 5000);
}

// Refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
    fetchAllData();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});

// Host Detail Page JavaScript
let hostname = '';
let historyChart = null;
let networkChart = null;
let updateInterval = null;
let lastSystemInfo = {}; // Cache system info since it's only sent every 5 minutes

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

// Format speed (input in KB/s)
function formatSpeed(kbPerSec) {
    if (kbPerSec < 1) return (kbPerSec * 1024).toFixed(2) + ' B/s';
    if (kbPerSec < 1024) return kbPerSec.toFixed(2) + ' KB/s';
    return (kbPerSec / 1024).toFixed(2) + ' MB/s';
}

// Update host info
function updateHostInfo(data) {
    const infoGrid = document.getElementById('hostInfo');
    
    // Use current system info if available, otherwise use cached
    if (data.system && Object.keys(data.system).length > 0) {
        lastSystemInfo = data.system;
        console.log('[DEBUG] System info updated:', lastSystemInfo);
    }
    
    const system = Object.keys(lastSystemInfo).length > 0 ? lastSystemInfo : {};
    
    infoGrid.innerHTML = `
        <div class="info-item">
            <div class="info-label">Hostname</div>
            <div class="info-value">${data.hostname || hostname || '-'}</div>
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
            <div class="info-value">${system.uptime || 'Loading...'}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Last Boot</div>
            <div class="info-value">${system.boot_time || '-'}</div>
        </div>
    `;
    
    console.log('[DEBUG] Host info display updated');
}

// Update stats cards
function updateStats(data) {
    console.log('[DEBUG] Updating stats with data:', data);
    
    // Map agent data format to expected format
    const cpu = data.cpu || {};
    const memory = data.memory || {};
    const loadAverage = cpu.load_average || [0, 0, 0];

    try {
        // CPU - handle both formats
        const cpuPercent = cpu.cpu_percent_total || cpu.percent || 0;
        const cpuCores = cpu.cpu_count_logical || cpu.cores || 0;
        
        document.getElementById('cpuValue').textContent = cpuPercent.toFixed(1) + '%';
        document.getElementById('cpuCores').textContent = `${cpuCores} cores`;
        document.getElementById('cpuProgress').style.width = cpuPercent + '%';

        // Memory - handle both formats
        const memPercent = memory.memory_percent || memory.percent || 0;
        const memUsed = memory.memory_used || memory.used || 0;
        const memTotal = memory.memory_total || memory.total || 0;
        
        document.getElementById('memoryValue').textContent = memPercent.toFixed(1) + '%';
        document.getElementById('memorySize').textContent = `${formatBytes(memUsed)} / ${formatBytes(memTotal)}`;
        document.getElementById('memoryProgress').style.width = memPercent + '%';

        // Swap - handle both formats
        const swapPercent = memory.swap_percent || 0;
        const swapUsed = memory.swap_used || 0;
        const swapTotal = memory.swap_total || 0;
        
        document.getElementById('swapValue').textContent = swapPercent.toFixed(1) + '%';
        document.getElementById('swapSize').textContent = `${formatBytes(swapUsed)} / ${formatBytes(swapTotal)}`;
        document.getElementById('swapProgress').style.width = swapPercent + '%';

        // Load Average
        const loadValue = loadAverage && loadAverage.length > 0 ? loadAverage[0] : 0;
        document.getElementById('loadValue').textContent = loadValue.toFixed(2);
        
        console.log('[DEBUG] Stats updated successfully');
        console.log('[DEBUG] CPU:', cpuPercent + '%', 'Memory:', memPercent + '%', 'Swap:', swapPercent + '%');
    } catch (error) {
        console.error('[ERROR] Error updating stats:', error);
    }
}

// Update disk list
function updateDiskList(data) {
    const diskList = document.getElementById('diskList');
    
    // Handle both formats: array or object with disks/partitions property
    let disks = [];
    if (Array.isArray(data)) {
        disks = data;
    } else if (data.disks && Array.isArray(data.disks)) {
        disks = data.disks;
    } else if (data.partitions && Array.isArray(data.partitions)) {
        disks = data.partitions;
    }

    console.log('[DEBUG] Processing disk data, count:', disks.length);

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
    // Agent sends io.network, handle both formats
    const io = data.io || {};
    const network = io.network || data.network || {};
    const upload = (network.bytes_sent_per_sec || 0) / 1024; // Convert to KB/s
    const download = (network.bytes_recv_per_sec || 0) / 1024; // Convert to KB/s

    console.log('[DEBUG] Network speeds - Upload:', upload, 'KB/s, Download:', download, 'KB/s');
    
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

    // data is already an array from /api/servers/{hostname}/history
    const history = Array.isArray(data) ? data : (data.history || []);
    const maxPoints = 60; // 5 minutes of data (5s interval)

    const labels = history.map(h => {
        const date = new Date(h.timestamp);
        return date.toLocaleTimeString();
    }).slice(-maxPoints);

    // Handle both formats: cpu.cpu_percent_total and cpu.percent
    const cpuData = history.map(h => {
        const cpu = h.cpu || {};
        return cpu.cpu_percent_total || cpu.percent || 0;
    }).slice(-maxPoints);
    
    const memData = history.map(h => {
        const memory = h.memory || {};
        return memory.memory_percent || memory.percent || 0;
    }).slice(-maxPoints);

    historyChart.data.labels = labels;
    historyChart.data.datasets[0].data = cpuData;
    historyChart.data.datasets[1].data = memData;
    historyChart.update('none');
    
    console.log('[DEBUG] History chart updated with', history.length, 'data points');
}

// Update network chart
function updateNetworkChart(data) {
    if (!networkChart) {
        console.log('[DEBUG] Network chart not initialized');
        return;
    }

    // Data is directly an array from /api/servers/{hostname}/network endpoint
    const network = Array.isArray(data) ? data : (data.network_history || []);
    const maxPoints = 60;

    console.log('[DEBUG] Updating network chart with', network.length, 'data points');

    if (network.length === 0) {
        console.log('[DEBUG] No network data available');
        return;
    }

    const labels = network.map(n => {
        const date = new Date(n.timestamp);
        return date.toLocaleTimeString();
    }).slice(-maxPoints);

    // Convert bytes per second to KB/s or MB/s for better readability
    const uploadData = network.map(n => (n.bytes_sent_per_sec || 0) / 1024).slice(-maxPoints); // KB/s
    const downloadData = network.map(n => (n.bytes_recv_per_sec || 0) / 1024).slice(-maxPoints); // KB/s

    networkChart.data.labels = labels;
    networkChart.data.datasets[0].data = uploadData;
    networkChart.data.datasets[1].data = downloadData;
    networkChart.update('none');
    
    console.log('[DEBUG] Network chart updated - Upload points:', uploadData.length, 'Download points:', downloadData.length);
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
        console.log('[DEBUG] Fetching history data for:', hostname);
        const response = await fetch(`/api/servers/${hostname}/history`);
        console.log('[DEBUG] History data response status:', response.status);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('[DEBUG] History data received, items:', data.length);
        updateHistoryChart(data);
    } catch (error) {
        console.error('[ERROR] Error fetching history data:', error);
    }
}

// Fetch disk data
async function fetchDiskData() {
    try {
        console.log('[DEBUG] Fetching disk data for:', hostname);
        const response = await fetch(`/api/servers/${hostname}/disk`);
        console.log('[DEBUG] Disk data response status:', response.status);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('[DEBUG] Disk data received:', data);
        
        updateDiskList(data);
    } catch (error) {
        console.error('[ERROR] Error fetching disk data:', error);
    }
}

// Fetch network data
async function fetchNetworkData() {
    try {
        console.log('[DEBUG] Fetching network data for:', hostname);
        const response = await fetch(`/api/servers/${hostname}/network`);
        console.log('[DEBUG] Network data response status:', response.status);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('[DEBUG] Network data received, items:', data.length);
        updateNetworkChart(data);
    } catch (error) {
        console.error('[ERROR] Error fetching network data:', error);
    }
}

// Fetch all data
async function fetchAllData() {
    console.log('[DEBUG] Starting fetchAllData for hostname:', hostname);
    try {
        await Promise.allSettled([
            fetchCurrentData(),
            fetchHistoryData(),
            fetchDiskData(),
            fetchNetworkData()
        ]);
        console.log('[DEBUG] All fetch operations completed');
    } catch (error) {
        console.error('[ERROR] Error in fetchAllData:', error);
    }
}

// Initialize page
async function init() {
    try {
        console.log('[DEBUG] Starting initialization...');
        
        hostname = getHostnameFromURL();
        console.log('[DEBUG] Hostname from URL:', hostname);
        
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
        console.log('[DEBUG] Initializing charts...');
        initHistoryChart();
        initNetworkChart();

        // Show content first, hide loading - so user can see something even if fetch fails
        console.log('[DEBUG] Showing content area...');
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('contentArea').style.display = 'block';

        // Fetch initial data
        console.log('[DEBUG] Fetching initial data...');
        await fetchAllData();
        console.log('[DEBUG] Initial data fetch complete');

        // Start auto-refresh (every 5 seconds)
        updateInterval = setInterval(fetchAllData, 5000);
        console.log('[DEBUG] Initialization complete');
        
    } catch (error) {
        console.error('[ERROR] Error during initialization:', error);
        
        // Still show content area with error message
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('contentArea').style.display = 'block';
        
        // Show error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #e74c3c; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); z-index: 9999;';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Error:</strong> ${error.message}`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
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

// Dashboard JavaScript
const API_BASE = window.location.origin;
let currentUser = null;
let groups = [];
let hosts = [];
let refreshInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    await loadGroups();
    await loadHosts();
    initializeEventListeners();
    startAutoRefresh();
    updateStats();
});

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/api/current-user`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            window.location.href = '/login';
            return;
        }
        
        currentUser = await response.json();
        updateUserInfo();
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
    }
}

// Update user info in sidebar
function updateUserInfo() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.username;
        document.getElementById('userRole').textContent = currentUser.is_admin ? 'Administrator' : 'User';
        document.getElementById('userAvatar').textContent = currentUser.username.charAt(0).toUpperCase();
    }
}

// Load groups from localStorage (since backend doesn't have groups yet)
async function loadGroups() {
    const savedGroups = localStorage.getItem('serverGroups');
    if (savedGroups) {
        groups = JSON.parse(savedGroups);
    } else {
        // Default groups
        groups = [
            { id: 1, name: 'Production', icon: 'fa-server', description: 'Production servers', color: '#667eea' },
            { id: 2, name: 'Development', icon: 'fa-code', description: 'Development environment', color: '#28a745' },
            { id: 3, name: 'Database', icon: 'fa-database', description: 'Database servers', color: '#17a2b8' }
        ];
        saveGroups();
    }
}

// Save groups to localStorage
function saveGroups() {
    localStorage.setItem('serverGroups', JSON.stringify(groups));
}

// Load hosts from API
async function loadHosts() {
    try {
        const response = await fetch(`${API_BASE}/api/hosts`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load hosts');
        
        hosts = await response.json();
        
        // Get current metrics for each host
        const serversResponse = await fetch(`${API_BASE}/api/servers`, {
            credentials: 'include'
        });
        
        if (serversResponse.ok) {
            const servers = await serversResponse.json();
            
            // Merge metrics with hosts
            hosts = hosts.map(host => {
                const server = servers.find(s => s.hostname === host.hostname);
                return {
                    ...host,
                    metrics: server || null,
                    status: server ? 'online' : 'offline'
                };
            });
        }
        
        renderGroups();
        updateStats();
    } catch (error) {
        console.error('Error loading hosts:', error);
        showAlert('hostAlert', 'Failed to load hosts', 'danger');
    }
}

// Render groups and hosts
function renderGroups() {
    const container = document.getElementById('groupsList');
    
    if (groups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Groups Yet</h3>
                <p>Create your first group to organize your servers</p>
                <button class="btn btn-primary" onclick="openModal('addGroupModal')">
                    <i class="fas fa-plus"></i> Create Group
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    groups.forEach(group => {
        const groupHosts = hosts.filter(h => h.group_id === group.id || (!h.group_id && group.id === 0));
        const onlineCount = groupHosts.filter(h => h.status === 'online').length;
        
        const groupCard = document.createElement('div');
        groupCard.className = 'group-card';
        groupCard.innerHTML = `
            <div class="group-header" onclick="toggleGroup(${group.id})">
                <div class="group-info">
                    <div class="group-icon">
                        <i class="fas ${group.icon}"></i>
                    </div>
                    <div class="group-details">
                        <h3>${group.name}</h3>
                        <p>${group.description}</p>
                    </div>
                </div>
                <div class="group-stats">
                    <div class="group-stat">
                        <div class="number">${groupHosts.length}</div>
                        <div class="label">Hosts</div>
                    </div>
                    <div class="group-stat">
                        <div class="number" style="color: var(--success-color)">${onlineCount}</div>
                        <div class="label">Online</div>
                    </div>
                    <i class="fas fa-chevron-down group-toggle" id="toggle-${group.id}"></i>
                </div>
            </div>
            <div class="group-hosts" id="hosts-${group.id}">
                ${renderHosts(groupHosts)}
            </div>
        `;
        
        container.appendChild(groupCard);
    });
    
    // Add ungrouped hosts
    const ungroupedHosts = hosts.filter(h => !h.group_id);
    if (ungroupedHosts.length > 0) {
        const ungroupedCard = document.createElement('div');
        ungroupedCard.className = 'group-card';
        ungroupedCard.innerHTML = `
            <div class="group-header" onclick="toggleGroup(0)">
                <div class="group-info">
                    <div class="group-icon">
                        <i class="fas fa-server"></i>
                    </div>
                    <div class="group-details">
                        <h3>Ungrouped</h3>
                        <p>Hosts without a group</p>
                    </div>
                </div>
                <div class="group-stats">
                    <div class="group-stat">
                        <div class="number">${ungroupedHosts.length}</div>
                        <div class="label">Hosts</div>
                    </div>
                    <i class="fas fa-chevron-down group-toggle" id="toggle-0"></i>
                </div>
            </div>
            <div class="group-hosts" id="hosts-0">
                ${renderHosts(ungroupedHosts)}
            </div>
        `;
        
        container.appendChild(ungroupedCard);
    }
}

// Render hosts in a group
function renderHosts(hostList) {
    if (hostList.length === 0) {
        return '<div class="empty-state"><p>No hosts in this group</p></div>';
    }
    
    const hostsHtml = hostList.map(host => {
        const metrics = host.metrics || {};
        const cpuPercent = metrics.cpu_percent || 0;
        const memoryPercent = metrics.memory_percent || 0;
        
        return `
            <div class="host-card" onclick="viewHostDetails('${host.hostname}')">
                <div class="host-header">
                    <div class="host-name">${host.hostname}</div>
                    <div class="status-dot ${host.status}"></div>
                </div>
                <div class="host-info">
                    ${host.ip_address ? `<i class="fas fa-network-wired"></i> ${host.ip_address}` : ''}
                    ${host.description ? `<br><small>${host.description}</small>` : ''}
                </div>
                <div class="host-metrics">
                    <div class="metric">
                        <i class="fas fa-microchip"></i>
                        <span>CPU: <span class="metric-value">${cpuPercent.toFixed(1)}%</span></span>
                    </div>
                    <div class="metric">
                        <i class="fas fa-memory"></i>
                        <span>RAM: <span class="metric-value">${memoryPercent.toFixed(1)}%</span></span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    return `<div class="hosts-grid">${hostsHtml}</div>`;
}

// Toggle group expansion
function toggleGroup(groupId) {
    const hostsContainer = document.getElementById(`hosts-${groupId}`);
    const toggle = document.getElementById(`toggle-${groupId}`);
    
    if (hostsContainer.classList.contains('expanded')) {
        hostsContainer.classList.remove('expanded');
        toggle.classList.add('collapsed');
    } else {
        hostsContainer.classList.add('expanded');
        toggle.classList.remove('collapsed');
    }
}

// Update statistics
function updateStats() {
    const total = hosts.length;
    const online = hosts.filter(h => h.status === 'online').length;
    const offline = total - online;
    
    document.getElementById('totalHosts').textContent = total;
    document.getElementById('onlineHosts').textContent = online;
    document.getElementById('offlineHosts').textContent = offline;
    document.getElementById('totalGroups').textContent = groups.length;
}

// Initialize event listeners
function initializeEventListeners() {
    // Menu navigation
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
                logout();
                return;
            }
            
            e.preventDefault();
            document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const view = link.dataset.view;
            if (view === 'add-host') {
                openModal('addHostModal');
            } else if (view === 'add-group') {
                openModal('addGroupModal');
            }
        });
    });
    
    // Add host button
    document.getElementById('addHostBtn').addEventListener('click', () => {
        openModal('addHostModal');
    });
    
    // Add group button
    document.getElementById('addGroupBtn').addEventListener('click', () => {
        openModal('addGroupModal');
    });
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        const btn = document.getElementById('refreshBtn');
        const icon = btn.querySelector('i');
        icon.classList.add('fa-spin');
        await loadHosts();
        setTimeout(() => icon.classList.remove('fa-spin'), 500);
    });
    
    // Save host
    document.getElementById('saveHostBtn').addEventListener('click', saveHost);
    
    // Save group
    document.getElementById('saveGroupBtn').addEventListener('click', saveGroup);
    
    // Load groups into select
    loadGroupsIntoSelect();
}

// Load groups into select dropdown
function loadGroupsIntoSelect() {
    const select = document.getElementById('hostGroup');
    select.innerHTML = '<option value="">No Group</option>';
    
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        select.appendChild(option);
    });
}

// Open modal
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
    
    // Reset forms
    if (modalId === 'addHostModal') {
        document.getElementById('addHostForm').reset();
        document.getElementById('apiKeyResult').style.display = 'none';
        document.getElementById('saveHostBtn').style.display = 'inline-flex';
        hideAlert('hostAlert');
    } else if (modalId === 'addGroupModal') {
        document.getElementById('addGroupForm').reset();
        hideAlert('groupAlert');
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Save host
async function saveHost() {
    const form = document.getElementById('addHostForm');
    const formData = new FormData(form);
    
    const hostname = formData.get('hostname');
    const ipAddress = formData.get('ipAddress');
    const description = formData.get('description');
    const groupId = formData.get('hostGroup');
    const enableKeyMapping = formData.get('enableKeyMapping') === 'on';
    
    if (!hostname) {
        showAlert('hostAlert', 'Hostname is required', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/hosts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                hostname,
                ip_address: ipAddress,
                description,
                group_id: groupId ? parseInt(groupId) : null,
                enable_key_mapping: enableKeyMapping
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add host');
        }
        
        const result = await response.json();
        
        // Show API key
        document.getElementById('generatedApiKey').textContent = result.api_key;
        document.getElementById('apiKeyResult').style.display = 'block';
        document.getElementById('saveHostBtn').style.display = 'none';
        
        // Reload hosts
        await loadHosts();
        
        // Show success message
        showAlert('hostAlert', 'Host added successfully! Copy the API key below.', 'success');
        
    } catch (error) {
        console.error('Error adding host:', error);
        showAlert('hostAlert', error.message, 'danger');
    }
}

// Save group
function saveGroup() {
    const form = document.getElementById('addGroupForm');
    const formData = new FormData(form);
    
    const name = formData.get('groupName');
    const icon = formData.get('groupIcon');
    const description = formData.get('groupDescription');
    
    if (!name) {
        showAlert('groupAlert', 'Group name is required', 'danger');
        return;
    }
    
    const newGroup = {
        id: Date.now(),
        name,
        icon,
        description,
        color: getRandomColor()
    };
    
    groups.push(newGroup);
    saveGroups();
    loadGroupsIntoSelect();
    renderGroups();
    updateStats();
    
    showAlert('groupAlert', 'Group created successfully!', 'success');
    
    setTimeout(() => {
        closeModal('addGroupModal');
    }, 1500);
}

// Copy API key
function copyApiKey() {
    const apiKey = document.getElementById('generatedApiKey').textContent;
    navigator.clipboard.writeText(apiKey).then(() => {
        const btn = event.target.closest('.copy-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    });
}

// View host details
function viewHostDetails(hostname) {
    // Redirect to old index.html for detailed view
    window.location.href = `index.html?host=${hostname}`;
}

// Show alert
function showAlert(elementId, message, type) {
    const alert = document.getElementById(elementId);
    alert.className = `alert alert-${type} show`;
    alert.textContent = message;
}

// Hide alert
function hideAlert(elementId) {
    const alert = document.getElementById(elementId);
    alert.classList.remove('show');
}

// Get random color
function getRandomColor() {
    const colors = ['#667eea', '#28a745', '#17a2b8', '#ffc107', '#dc3545', '#6f42c1'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Auto refresh
function startAutoRefresh() {
    refreshInterval = setInterval(() => {
        loadHosts();
    }, 10000); // Refresh every 10 seconds
}

// Logout
async function logout() {
    try {
        await fetch(`${API_BASE}/api/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    window.location.href = '/login';
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});

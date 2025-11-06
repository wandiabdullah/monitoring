// Dashboard JavaScript
const API_BASE = window.location.origin;
let currentUser = null;
let groups = [];
let hosts = [];
let refreshInterval = null;
let expandedGroups = new Set(); // Track which groups are expanded
let currentView = 'dashboard'; // Track current view: 'dashboard', 'allhosts', 'groups'
let sidebarCollapsed = false; // Track sidebar state

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[DEBUG] Dashboard initializing...');
    try {
        await checkAuth();
        console.log('[DEBUG] Auth check completed');
        
        await loadGroups();
        console.log('[DEBUG] Groups loaded:', groups.length);
        
        await loadHosts();
        console.log('[DEBUG] Hosts loaded:', hosts.length);
        
        initializeEventListeners();
        console.log('[DEBUG] Event listeners initialized');
        
        initializeSidebarToggle();
        console.log('[DEBUG] Sidebar toggle initialized');
        
        startAutoRefresh();
        console.log('[DEBUG] Auto-refresh started');
        
        updateStats();
        console.log('[DEBUG] Stats updated');
        
        console.log('[DEBUG] Dashboard initialization complete!');
    } catch (error) {
        console.error('[ERROR] Dashboard initialization failed:', error);
    }
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

// Load groups from backend API
async function loadGroups() {
    try {
        const response = await fetch(`${API_BASE}/api/groups`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            groups = await response.json();
        } else {
            // If no groups exist, create default groups
            console.log('No groups found, creating defaults...');
            groups = [];
        }
    } catch (error) {
        console.error('Error loading groups:', error);
        groups = [];
    }
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
        
        // Re-render current view to update data
        refreshCurrentView();
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
            <div class="group-header">
                <div class="group-info" onclick="toggleGroup(${group.id})">
                    <div class="group-icon">
                        <i class="fas ${group.icon}"></i>
                    </div>
                    <div class="group-details">
                        <h3>${group.name}</h3>
                        <p>${group.description}</p>
                    </div>
                </div>
                <div class="group-stats" onclick="toggleGroup(${group.id})">
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
                <div class="group-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); editGroup(${group.id})" title="Edit Group">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn danger" onclick="event.stopPropagation(); deleteGroup(${group.id}, '${escapeHtml(group.name)}')" title="Delete Group">
                        <i class="fas fa-trash"></i>
                    </button>
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
    
    // Restore expanded state after render
    restoreExpandedState();
}

// Restore expanded state for groups
function restoreExpandedState() {
    expandedGroups.forEach(groupId => {
        const hostsContainer = document.getElementById(`hosts-${groupId}`);
        const toggle = document.getElementById(`toggle-${groupId}`);
        
        if (hostsContainer && toggle) {
            hostsContainer.classList.add('expanded');
            toggle.classList.remove('collapsed');
        }
    });
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
            <div class="host-card">
                <div class="host-actions">
                    <button class="action-btn-small" onclick="event.stopPropagation(); editHost(${host.id})" title="Edit Host">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn-small danger" onclick="event.stopPropagation(); deleteHost(${host.id}, '${escapeHtml(host.hostname)}')" title="Delete Host">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div onclick="viewHostDetails('${host.hostname}')">
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
            </div>
        `;
    }).join('');
    
    return `<div class="hosts-grid">${hostsHtml}</div>`;
}

// Toggle group expansion
function toggleGroup(groupId) {
    const hostsContainer = document.getElementById(`hosts-${groupId}`);
    const toggle = document.getElementById(`toggle-${groupId}`);
    
    if (!hostsContainer || !toggle) {
        console.error('[ERROR] Group elements not found:', groupId);
        return;
    }
    
    if (hostsContainer.classList.contains('expanded')) {
        hostsContainer.classList.remove('expanded');
        toggle.classList.add('collapsed');
        expandedGroups.delete(groupId); // Remove from expanded set
    } else {
        hostsContainer.classList.add('expanded');
        toggle.classList.remove('collapsed');
        expandedGroups.add(groupId); // Add to expanded set
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

// Refresh current view (called during auto-refresh)
function refreshCurrentView() {
    console.log('[DEBUG] Refreshing current view:', currentView);
    
    switch (currentView) {
        case 'dashboard':
            renderGroups();
            break;
        case 'allhosts':
            showAllHostsView();
            break;
        case 'groups':
            showGroupsView();
            break;
        default:
            renderGroups();
    }
}

// Initialize event listeners
function initializeEventListeners() {
    console.log('[DEBUG] Initializing event listeners...');
    
    // Menu navigation
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
                e.preventDefault();
                logout();
                return;
            }
            
            e.preventDefault();
            document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const view = link.dataset.view;
            console.log('[DEBUG] Menu clicked:', view);
            
            // Handle different views
            if (view === 'dashboard') {
                showDashboardView();
            } else if (view === 'hosts') {
                showAllHostsView();
            } else if (view === 'groups') {
                showGroupsView();
            } else if (view === 'add-host') {
                openModal('addHostModal');
            } else if (view === 'add-group') {
                openModal('addGroupModal');
            } else if (view === 'account') {
                showAccountSettings();
            } else if (view === 'users') {
                showUserManagement();
            } else if (view === 'settings') {
                showSettingsView();
            }
        });
    });
    
    // Add host button
    const addHostBtn = document.getElementById('addHostBtn');
    if (addHostBtn) {
        addHostBtn.addEventListener('click', () => {
            console.log('[DEBUG] Add Host button clicked');
            openModal('addHostModal');
        });
        console.log('[DEBUG] Add Host button listener attached');
    } else {
        console.error('[ERROR] Add Host button not found!');
    }
    
    // Add group button
    const addGroupBtn = document.getElementById('addGroupBtn');
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', () => {
            console.log('[DEBUG] Add Group button clicked');
            openModal('addGroupModal');
        });
        console.log('[DEBUG] Add Group button listener attached');
    } else {
        console.error('[ERROR] Add Group button not found!');
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            console.log('[DEBUG] Refresh button clicked');
            const icon = refreshBtn.querySelector('i');
            icon.classList.add('fa-spin');
            await loadGroups();
            await loadHosts();
            setTimeout(() => icon.classList.remove('fa-spin'), 500);
        });
        console.log('[DEBUG] Refresh button listener attached');
    } else {
        console.error('[ERROR] Refresh button not found!');
    }
    
    // Save host
    const saveHostBtn = document.getElementById('saveHostBtn');
    if (saveHostBtn) {
        saveHostBtn.addEventListener('click', saveHost);
        console.log('[DEBUG] Save Host button listener attached');
    }
    
    // Save group
    const saveGroupBtn = document.getElementById('saveGroupBtn');
    if (saveGroupBtn) {
        saveGroupBtn.addEventListener('click', saveGroup);
        console.log('[DEBUG] Save Group button listener attached');
    }
    
    // Load groups into select
    loadGroupsIntoSelect();
    
    console.log('[DEBUG] Event listeners initialized successfully');
}

// Initialize Sidebar Toggle
function initializeSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (!sidebarToggle) {
        console.error('[ERROR] Sidebar toggle button not found!');
        return;
    }
    
    // Load saved state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        toggleSidebar();
    }
    
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // Keyboard shortcut: Ctrl+B to toggle sidebar
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            toggleSidebar();
        }
    });
    
    console.log('[DEBUG] Sidebar toggle initialized (Click button or press Ctrl+B)');
}

// Toggle Sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebarCollapsed = !sidebarCollapsed;
    
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    } else {
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
    }
    
    // Save state to localStorage
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
    
    console.log('[DEBUG] Sidebar toggled:', sidebarCollapsed ? 'collapsed' : 'expanded');
}

// View Functions
function showDashboardView() {
    console.log('[DEBUG] Showing dashboard view');
    currentView = 'dashboard';
    document.getElementById('pageTitle').textContent = 'Dashboard Overview';
    renderGroups();
}

function showAllHostsView() {
    console.log('[DEBUG] Showing all hosts view');
    currentView = 'allhosts';
    document.getElementById('pageTitle').textContent = 'All Hosts';
    const container = document.getElementById('groupsList');
    
    if (hosts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-server"></i>
                <h3>No Hosts Yet</h3>
                <p>Add your first host to start monitoring</p>
                <button class="btn btn-primary" onclick="openModal('addHostModal')">
                    <i class="fas fa-plus"></i> Add Host
                </button>
            </div>
        `;
        return;
    }
    
    // Show all hosts in a single card - always expanded
    const allHostsCard = `
        <div class="group-card">
            <div class="group-header">
                <div class="group-info">
                    <div class="group-icon">
                        <i class="fas fa-server"></i>
                    </div>
                    <div class="group-details">
                        <h3>All Hosts</h3>
                        <p>Complete list of monitored servers</p>
                    </div>
                </div>
                <div class="group-stats">
                    <div class="group-stat">
                        <div class="number">${hosts.length}</div>
                        <div class="label">Total</div>
                    </div>
                    <div class="group-stat">
                        <div class="number" style="color: var(--success-color)">${hosts.filter(h => h.status === 'online').length}</div>
                        <div class="label">Online</div>
                    </div>
                </div>
            </div>
            <div class="group-hosts expanded" style="max-height: none !important;">
                ${renderHosts(hosts)}
            </div>
        </div>
    `;
    
    container.innerHTML = allHostsCard;
}

function showGroupsView() {
    console.log('[DEBUG] Showing groups view');
    currentView = 'groups';
    document.getElementById('pageTitle').textContent = 'Manage Groups';
    const container = document.getElementById('groupsList');
    
    if (groups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-layer-group"></i>
                <h3>No Groups Yet</h3>
                <p>Create groups to organize your servers</p>
                <button class="btn btn-primary" onclick="openModal('addGroupModal')">
                    <i class="fas fa-plus"></i> Create Group
                </button>
            </div>
        `;
        return;
    }
    
    let html = '<div class="groups-management">';
    
    groups.forEach(group => {
        const groupHosts = hosts.filter(h => h.group_id === group.id);
        
        html += `
            <div class="group-card">
                <div class="group-header">
                    <div class="group-info">
                        <div class="group-icon" style="background: ${group.color}20; color: ${group.color}">
                            <i class="fas ${group.icon}"></i>
                        </div>
                        <div class="group-details">
                            <h3>${group.name}</h3>
                            <p>${group.description || 'No description'}</p>
                        </div>
                    </div>
                    <div class="group-stats">
                        <div class="group-stat">
                            <div class="number">${groupHosts.length}</div>
                            <div class="label">Hosts</div>
                        </div>
                        <button class="btn btn-danger" onclick="deleteGroup(${group.id})" style="padding: 8px 16px; font-size: 12px;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function showSettingsView() {
    console.log('[DEBUG] Showing settings view');
    document.getElementById('pageTitle').textContent = 'Settings';
    const container = document.getElementById('groupsList');
    
    container.innerHTML = `
        <div class="settings-container">
            <div class="group-card">
                <div class="group-header">
                    <div class="group-info">
                        <div class="group-icon">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="group-details">
                            <h3>User Information</h3>
                            <p>Current logged in user</p>
                        </div>
                    </div>
                </div>
                <div class="group-hosts expanded" style="padding: 24px;">
                    <div style="display: grid; gap: 16px;">
                        <div>
                            <strong>Username:</strong> ${currentUser ? currentUser.username : 'N/A'}
                        </div>
                        <div>
                            <strong>Role:</strong> ${currentUser && currentUser.is_admin ? 'Administrator' : 'User'}
                        </div>
                        <div>
                            <strong>Email:</strong> ${currentUser && currentUser.email ? currentUser.email : 'Not set'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="group-card">
                <div class="group-header">
                    <div class="group-info">
                        <div class="group-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="group-details">
                            <h3>System Statistics</h3>
                            <p>Monitoring system overview</p>
                        </div>
                    </div>
                </div>
                <div class="group-hosts expanded" style="padding: 24px;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                        <div>
                            <strong>Total Hosts:</strong> ${hosts.length}
                        </div>
                        <div>
                            <strong>Online Hosts:</strong> ${hosts.filter(h => h.status === 'online').length}
                        </div>
                        <div>
                            <strong>Total Groups:</strong> ${groups.length}
                        </div>
                        <div>
                            <strong>Offline Hosts:</strong> ${hosts.filter(h => h.status === 'offline').length}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="group-card">
                <div class="group-header">
                    <div class="group-info">
                        <div class="group-icon" style="background: #dc354520; color: #dc3545">
                            <i class="fas fa-sign-out-alt"></i>
                        </div>
                        <div class="group-details">
                            <h3>Account Actions</h3>
                            <p>Manage your session</p>
                        </div>
                    </div>
                </div>
                <div class="group-hosts expanded" style="padding: 24px;">
                    <button class="btn btn-danger" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        </div>
    `;
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
    console.log('[DEBUG] Opening modal:', modalId);
    const modal = document.getElementById(modalId);
    
    if (!modal) {
        console.error('[ERROR] Modal not found:', modalId);
        return;
    }
    
    modal.classList.add('show');
    
    // Reset forms
    if (modalId === 'addHostModal') {
        const form = document.getElementById('addHostForm');
        if (form) form.reset();
        
        const apiKeyResult = document.getElementById('apiKeyResult');
        if (apiKeyResult) apiKeyResult.style.display = 'none';
        
        const saveBtn = document.getElementById('saveHostBtn');
        if (saveBtn) saveBtn.style.display = 'inline-flex';
        
        hideAlert('hostAlert');
        loadGroupsIntoSelect(); // Refresh groups dropdown
        
    } else if (modalId === 'addGroupModal') {
        const form = document.getElementById('addGroupForm');
        if (form) form.reset();
        
        hideAlert('groupAlert');
    }
    
    console.log('[DEBUG] Modal opened successfully:', modalId);
}

// Close modal
function closeModal(modalId) {
    console.log('[DEBUG] Closing modal:', modalId);
    const modal = document.getElementById(modalId);
    
    if (!modal) {
        console.error('[ERROR] Modal not found:', modalId);
        return;
    }
    
    modal.classList.remove('show');
    console.log('[DEBUG] Modal closed successfully:', modalId);
}

// Copy API key function (called from HTML)
function copyApiKey() {
    console.log('[DEBUG] copyApiKey called');
    const apiKeyElement = document.getElementById('generatedApiKey');
    
    if (!apiKeyElement) {
        console.error('[ERROR] API key element not found');
        return;
    }
    
    const apiKey = apiKeyElement.textContent;
    
    if (!apiKey) {
        console.error('[ERROR] No API key to copy');
        return;
    }
    
    navigator.clipboard.writeText(apiKey).then(() => {
        console.log('[DEBUG] API key copied to clipboard');
        const btn = event.target.closest('.copy-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.style.background = '#28a745';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);
        }
    }).catch(err => {
        console.error('[ERROR] Failed to copy:', err);
        alert('Failed to copy API key. Please select and copy manually.');
    });
}

// Delete group function
async function deleteGroup(groupId, groupName) {
    console.log('[DEBUG] deleteGroup called:', groupId);
    
    if (!confirm(`Are you sure you want to delete group "${groupName}"?\nHosts in this group will be ungrouped.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/groups/${groupId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete group');
        }
        
        console.log('[DEBUG] Group deleted successfully');
        
        // Reload data
        await loadGroups();
        loadGroupsIntoSelect();
        await loadHosts();
        
        // Refresh current view
        refreshCurrentView();
        
    } catch (error) {
        console.error('[ERROR] Error deleting group:', error);
        alert('Error deleting group: ' + error.message);
    }
}

// Edit Group
async function editGroup(groupId) {
    console.log('[DEBUG] editGroup called:', groupId);
    
    // Find group data
    const group = groups.find(g => g.id === groupId);
    if (!group) {
        alert('Group not found');
        return;
    }
    
    // Populate form
    document.getElementById('editGroupId').value = group.id;
    document.getElementById('editGroupName').value = group.name;
    document.getElementById('editGroupIcon').value = group.icon;
    document.getElementById('editGroupDescription').value = group.description || '';
    
    // Show modal
    openModal('editGroupModal');
    
    // Setup save handler
    document.getElementById('updateGroupBtn').onclick = updateGroup;
}

// Update Group
async function updateGroup() {
    console.log('[DEBUG] updateGroup called');
    
    const groupId = document.getElementById('editGroupId').value;
    const name = document.getElementById('editGroupName').value.trim();
    const icon = document.getElementById('editGroupIcon').value;
    const description = document.getElementById('editGroupDescription').value.trim();
    
    if (!name) {
        showAlert('editGroupAlert', 'Group name is required', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/groups/${groupId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                name,
                icon,
                description
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update group');
        }
        
        const result = await response.json();
        console.log('Group updated:', result);
        
        // Reload groups and hosts
        await loadGroups();
        loadGroupsIntoSelect();
        await loadHosts();
        
        showAlert('editGroupAlert', 'Group updated successfully!', 'success');
        
        setTimeout(() => {
            closeModal('editGroupModal');
            refreshCurrentView();
        }, 1500);
        
    } catch (error) {
        console.error('Error updating group:', error);
        showAlert('editGroupAlert', error.message, 'danger');
    }
}

// Edit Host
async function editHost(hostId) {
    console.log('[DEBUG] editHost called:', hostId);
    
    // Find host data
    const host = hosts.find(h => h.id === hostId);
    if (!host) {
        alert('Host not found');
        return;
    }
    
    // Populate form
    document.getElementById('editHostId').value = host.id;
    document.getElementById('editHostname').value = host.hostname;
    document.getElementById('editIpAddress').value = host.ip_address || '';
    document.getElementById('editHostGroup').value = host.group_id || '';
    document.getElementById('editDescription').value = host.description || '';
    
    // Load groups into select
    const select = document.getElementById('editHostGroup');
    select.innerHTML = '<option value="">No Group</option>';
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        if (group.id === host.group_id) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // Show modal
    openModal('editHostModal');
    
    // Setup save handler
    document.getElementById('updateHostBtn').onclick = updateHost;
}

// Update Host
async function updateHost() {
    console.log('[DEBUG] updateHost called');
    
    const hostId = document.getElementById('editHostId').value;
    const hostname = document.getElementById('editHostname').value.trim();
    const ipAddress = document.getElementById('editIpAddress').value.trim();
    const groupId = document.getElementById('editHostGroup').value;
    const description = document.getElementById('editDescription').value.trim();
    
    if (!hostname) {
        showAlert('editHostAlert', 'Hostname is required', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/hosts/${hostId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                hostname,
                ip_address: ipAddress,
                group_id: groupId ? parseInt(groupId) : null,
                description
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update host');
        }
        
        const result = await response.json();
        console.log('Host updated:', result);
        
        // Reload hosts
        await loadHosts();
        
        showAlert('editHostAlert', 'Host updated successfully!', 'success');
        
        setTimeout(() => {
            closeModal('editHostModal');
            refreshCurrentView();
        }, 1500);
        
    } catch (error) {
        console.error('Error updating host:', error);
        showAlert('editHostAlert', error.message, 'danger');
    }
}

// Delete Host
async function deleteHost(hostId, hostname) {
    console.log('[DEBUG] deleteHost called:', hostId);
    
    if (!confirm(`Are you sure you want to delete host "${hostname}"?\nAll metrics data will be lost.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/hosts/${hostId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete host');
        }
        
        console.log('[DEBUG] Host deleted successfully');
        
        // Reload hosts
        await loadHosts();
        
        // Refresh current view
        refreshCurrentView();
        
    } catch (error) {
        console.error('[ERROR] Error deleting host:', error);
        alert('Error deleting host: ' + error.message);
    }
}


// Save host
async function saveHost() {
    console.log('[DEBUG] saveHost called');
    const form = document.getElementById('addHostForm');
    const formData = new FormData(form);
    
    const hostname = formData.get('hostname');
    const ipAddress = formData.get('ipAddress');
    const description = formData.get('description');
    const groupId = formData.get('hostGroup');
    const enableKeyMapping = document.getElementById('enableKeyMapping').checked;
    
    console.log('[DEBUG] Form data:', {
        hostname,
        ipAddress,
        description,
        groupId,
        enableKeyMapping
    });
    
    if (!hostname) {
        showAlert('hostAlert', 'Hostname is required', 'danger');
        return;
    }
    
    try {
        const payload = {
            hostname,
            ip_address: ipAddress,
            description,
            group_id: groupId ? parseInt(groupId) : null,
            enable_key_mapping: enableKeyMapping
        };
        
        console.log('[DEBUG] Sending payload:', payload);
        
        const response = await fetch(`${API_BASE}/api/hosts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        
        console.log('[DEBUG] Response status:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('[ERROR] Server error:', error);
            throw new Error(error.error || 'Failed to add host');
        }
        
        const result = await response.json();
        console.log('[DEBUG] Host added successfully:', result);
        
        // Show API key
        document.getElementById('generatedApiKey').textContent = result.api_key;
        document.getElementById('apiKeyResult').style.display = 'block';
        document.getElementById('saveHostBtn').style.display = 'none';
        
        // Reload hosts
        await loadHosts();
        
        // Show success message
        showAlert('hostAlert', 'Host added successfully! Copy the API key below.', 'success');
        
    } catch (error) {
        console.error('[ERROR] Error adding host:', error);
        showAlert('hostAlert', error.message, 'danger');
    }
}

// Save group
async function saveGroup() {
    const form = document.getElementById('addGroupForm');
    const formData = new FormData(form);
    
    const name = formData.get('groupName');
    const icon = formData.get('groupIcon');
    const description = formData.get('groupDescription');
    
    if (!name) {
        showAlert('groupAlert', 'Group name is required', 'danger');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                name,
                icon,
                description,
                color: getRandomColor()
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create group');
        }
        
        const result = await response.json();
        console.log('Group created:', result);
        
        // Reload groups and hosts
        await loadGroups();
        loadGroupsIntoSelect();
        await loadHosts();
        updateStats();
        
        showAlert('groupAlert', 'Group created successfully!', 'success');
        
        setTimeout(() => {
            closeModal('addGroupModal');
        }, 1500);
        
    } catch (error) {
        console.error('Error creating group:', error);
        showAlert('groupAlert', error.message, 'danger');
    }
}

// View host details
function viewHostDetails(hostname) {
    console.log('[DEBUG] Viewing host details:', hostname);
    // Redirect to dedicated host detail page
    window.location.href = `/host-detail?host=${encodeURIComponent(hostname)}`;
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

// ========================================
// ACCOUNT SETTINGS & USER MANAGEMENT
// ========================================

// Show Account Settings
function showAccountSettings() {
    openModal('accountModal');
    loadAccountInfo();
    
    // Setup form handlers
    document.getElementById('updateEmailForm').onsubmit = handleUpdateEmail;
    document.getElementById('changePasswordForm').onsubmit = handleChangePassword;
}

// Load current account info
async function loadAccountInfo() {
    if (currentUser) {
        document.getElementById('currentEmail').value = currentUser.email || 'No email set';
    }
}

// Handle email update
async function handleUpdateEmail(e) {
    e.preventDefault();
    const newEmail = document.getElementById('newEmail').value;
    
    try {
        const response = await fetch(`${API_BASE}/api/account/email`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: newEmail })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('accountAlert', 'success', 'Email updated successfully!');
            currentUser.email = newEmail;
            document.getElementById('currentEmail').value = newEmail;
            document.getElementById('newEmail').value = '';
        } else {
            showAlert('accountAlert', 'danger', data.error || 'Failed to update email');
        }
    } catch (error) {
        showAlert('accountAlert', 'danger', 'Connection error');
    }
}

// Handle password change
async function handleChangePassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate
    if (newPassword !== confirmPassword) {
        showAlert('accountAlert', 'danger', 'New passwords do not match!');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('accountAlert', 'danger', 'Password must be at least 6 characters!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/account/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ 
                current_password: currentPassword,
                new_password: newPassword 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('accountAlert', 'success', 'Password changed successfully!');
            document.getElementById('changePasswordForm').reset();
        } else {
            showAlert('accountAlert', 'danger', data.error || 'Failed to change password');
        }
    } catch (error) {
        showAlert('accountAlert', 'danger', 'Connection error');
    }
}

// Show User Management
function showUserManagement() {
    openModal('userManagementModal');
    loadUsers();
    
    // Setup form handler
    document.getElementById('createUserForm').onsubmit = handleCreateUser;
}

// Load all users
async function loadUsers() {
    const tbody = document.getElementById('userListBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin"></i> Loading users...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE}/api/users`, {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to load users');
        
        const users = await response.json();
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td><strong>${escapeHtml(user.username)}</strong></td>
                <td>${escapeHtml(user.email || '-')}</td>
                <td><span class="badge ${user.is_admin ? 'admin' : 'user'}">${user.is_admin ? 'Admin' : 'User'}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    ${currentUser.username !== user.username ? `
                        <button class="action-btn danger" onclick="deleteUser(${user.id}, '${escapeHtml(user.username)}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : '<em style="color: #999;">Current user</em>'}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #dc3545;">Error loading users</td></tr>';
    }
}

// Handle create user
async function handleCreateUser(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password'),
        is_admin: formData.get('role') === 'admin'
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('userAlert', 'success', 'User created successfully!');
            hideAddUserForm();
            loadUsers();
        } else {
            showAlert('userAlert', 'danger', data.error || 'Failed to create user');
        }
    } catch (error) {
        showAlert('userAlert', 'danger', 'Connection error');
    }
}

// Delete user
async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('userAlert', 'success', 'User deleted successfully!');
            loadUsers();
        } else {
            showAlert('userAlert', 'danger', data.error || 'Failed to delete user');
        }
    } catch (error) {
        showAlert('userAlert', 'danger', 'Connection error');
    }
}

// Show/Hide add user form
function showAddUserForm() {
    document.getElementById('addUserForm').style.display = 'block';
    document.getElementById('createUserForm').reset();
}

function hideAddUserForm() {
    document.getElementById('addUserForm').style.display = 'none';
    document.getElementById('createUserForm').reset();
}

// Helper: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make all necessary functions globally available for HTML onclick handlers
window.openModal = openModal;
window.closeModal = closeModal;
window.copyApiKey = copyApiKey;
window.toggleGroup = toggleGroup;
window.viewHostDetails = viewHostDetails;
window.deleteGroup = deleteGroup;
window.editGroup = editGroup;
window.editHost = editHost;
window.deleteHost = deleteHost;
window.logout = logout;
window.showAddUserForm = showAddUserForm;
window.hideAddUserForm = hideAddUserForm;
window.deleteUser = deleteUser;

console.log('[DEBUG] All window functions registered:', {
    openModal: typeof window.openModal,
    closeModal: typeof window.closeModal,
    copyApiKey: typeof window.copyApiKey,
    toggleGroup: typeof window.toggleGroup,
    viewHostDetails: typeof window.viewHostDetails,
    deleteGroup: typeof window.deleteGroup,
    editGroup: typeof window.editGroup,
    editHost: typeof window.editHost,
    deleteHost: typeof window.deleteHost,
    logout: typeof window.logout
});

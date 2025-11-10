// Dashboard JavaScript
const API_BASE = window.location.origin;
let currentUser = null;
let groups = [];
let hosts = [];
let refreshInterval = null;
let expandedGroups = new Set(); // Track which groups are expanded
let currentView = 'dashboard'; // Track current view: 'dashboard', 'allhosts', 'groups'
let sidebarCollapsed = false; // Track sidebar state

// Toast Notification Function
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.error('Toast container not found');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    let icon = '📢';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'info') icon = 'ℹ️';
    
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => {
            toast.remove();
        }, 300); // Match animation duration
    }, 5000);
}

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
        
        // Hide all views initially before restoring
        hideAllViews();
        console.log('[DEBUG] All views hidden');
        
        // Restore last view or show dashboard
        restoreLastView();
        console.log('[DEBUG] View restored');
        
        console.log('[DEBUG] Dashboard initialization complete!');
    } catch (error) {
        console.error('[ERROR] Dashboard initialization failed:', error);
    }
});

// Hide all views
function hideAllViews() {
    const allViews = document.querySelectorAll('.content-view');
    allViews.forEach(view => {
        view.style.display = 'none';
    });
}

// Save current view to localStorage
function saveCurrentView(viewName) {
    try {
        localStorage.setItem('lastView', viewName);
        console.log('[DEBUG] Saved view to localStorage:', viewName);
    } catch (e) {
        console.error('[ERROR] Failed to save view:', e);
    }
}

// Restore last view from localStorage
function restoreLastView() {
    try {
        const lastView = localStorage.getItem('lastView') || 'dashboard';
        console.log('[DEBUG] Restoring last view:', lastView);
        
        // Update active menu item
        document.querySelectorAll('.menu-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === lastView) {
                link.classList.add('active');
            }
        });
        
        // Show the view without saving (to prevent override)
        if (lastView === 'dashboard') {
            showDashboardView(true);
        } else if (lastView === 'hosts') {
            showAllHostsView(true);
        } else if (lastView === 'groups') {
            showGroupsView(true);
        } else if (lastView === 'alerts') {
            showAlertsView(true);
        } else if (lastView === 'settings') {
            showSettingsView(true);
        } else {
            // Default to dashboard if unknown view
            showDashboardView(true);
        }
    } catch (e) {
        console.error('[ERROR] Failed to restore view:', e);
        showDashboardView(true);
    }
}

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
                <div class="group-info group-toggle-trigger" data-group-id="${group.id}">
                    <div class="group-icon">
                        <i class="fas ${group.icon}"></i>
                    </div>
                    <div class="group-details">
                        <h3>${group.name}</h3>
                        <p>${group.description}</p>
                    </div>
                </div>
                <div class="group-stats group-toggle-trigger" data-group-id="${group.id}">
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
            <div class="group-header group-toggle-trigger" data-group-id="0">
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
    
    // Use setTimeout to ensure DOM is fully rendered before manipulating classes
    setTimeout(() => {
        console.log('[DEBUG] Starting post-render initialization for Dashboard');
        
        // Attach click listeners first
        attachGroupToggleListeners();
        
        // Restore expanded state after render
        restoreExpandedState();
        
        // If no groups are expanded, expand all groups by default
        if (expandedGroups.size === 0) {
            console.log('[DEBUG] No expanded groups, expanding all by default');
            expandAllGroups();
        } else {
            console.log('[DEBUG] Restored expanded groups:', Array.from(expandedGroups));
        }
        
        console.log('[DEBUG] Dashboard initialization complete');
    }, 100);
}

// Restore expanded state for groups
function restoreExpandedState() {
    console.log('[DEBUG] Restoring expanded state for:', Array.from(expandedGroups));
    expandedGroups.forEach(groupId => {
        const hostsContainer = document.getElementById(`hosts-${groupId}`);
        const toggle = document.getElementById(`toggle-${groupId}`);
        
        if (hostsContainer && toggle) {
            hostsContainer.classList.add('expanded');
            toggle.classList.remove('collapsed');
            console.log('[DEBUG] Restored group:', groupId);
        }
    });
}

// Expand all groups by default
function expandAllGroups() {
    console.log('[DEBUG] Expanding all groups...');
    
    // Get all group IDs from rendered groups
    const groupContainers = document.querySelectorAll('.group-hosts');
    console.log('[DEBUG] Found group containers:', groupContainers.length);
    
    groupContainers.forEach(hostsContainer => {
        const groupId = hostsContainer.id.replace('hosts-', '');
        const toggle = document.getElementById(`toggle-${groupId}`);
        
        console.log('[DEBUG] Processing group:', groupId, hostsContainer, toggle);
        
        if (hostsContainer && toggle) {
            hostsContainer.classList.add('expanded');
            toggle.classList.remove('collapsed');
            const numericGroupId = groupId === '0' ? 0 : parseInt(groupId);
            expandedGroups.add(numericGroupId);
            console.log('[DEBUG] Expanded group:', groupId);
        }
    });
    
    console.log('[DEBUG] All expanded groups:', Array.from(expandedGroups));
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
    console.log('[DEBUG] toggleGroup called with groupId:', groupId);
    
    const hostsContainer = document.getElementById(`hosts-${groupId}`);
    const toggle = document.getElementById(`toggle-${groupId}`);
    
    console.log('[DEBUG] hostsContainer:', hostsContainer);
    console.log('[DEBUG] toggle:', toggle);
    
    if (!hostsContainer || !toggle) {
        console.error('[ERROR] Group elements not found:', groupId);
        return;
    }
    
    if (hostsContainer.classList.contains('expanded')) {
        console.log('[DEBUG] Collapsing group:', groupId);
        hostsContainer.classList.remove('expanded');
        toggle.classList.add('collapsed');
        expandedGroups.delete(groupId); // Remove from expanded set
    } else {
        console.log('[DEBUG] Expanding group:', groupId);
        hostsContainer.classList.add('expanded');
        toggle.classList.remove('collapsed');
        expandedGroups.add(groupId); // Add to expanded set
    }
    
    console.log('[DEBUG] expandedGroups after toggle:', Array.from(expandedGroups));
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
            // Render All Hosts view without saving
            renderAllHostsView();
            break;
        case 'groups':
            // Render Groups view without saving
            renderGroupsView();
            break;
        case 'alerts':
            // Don't refresh alerts view (has its own data loading)
            console.log('[DEBUG] Skipping refresh for alerts view');
            break;
        default:
            // Don't do anything if view is unknown
            console.log('[DEBUG] Unknown view, skipping refresh');
    }
}

// Render All Hosts view (without changing view state)
function renderAllHostsView() {
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

// Render Groups view (without changing view state)
function renderGroupsView() {
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
    
    renderGroups();
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
            } else if (view === 'alerts') {
                showAlertsView();
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
function showDashboardView(skipSave = false) {
    console.log('[DEBUG] Showing dashboard view');
    
    // Save current view (unless restoring)
    if (!skipSave) {
        saveCurrentView('dashboard');
    }
    
    // Show dashboard view
    const dashboardView = document.getElementById('dashboardView');
    if (dashboardView) {
        dashboardView.style.display = 'block';
    }
    
    // Hide all other content views
    const allViews = document.querySelectorAll('.content-view');
    allViews.forEach(view => {
        if (view.id !== 'dashboardView') {
            view.style.display = 'none';
        }
    });
    
    currentView = 'dashboard';
    document.getElementById('pageTitle').textContent = 'Dashboard Overview';
    
    // Render groups for dashboard view
    renderGroups();
}

function showAllHostsView(skipSave = false) {
    console.log('[DEBUG] Showing all hosts view');
    
    // Save current view (unless restoring)
    if (!skipSave) {
        saveCurrentView('hosts');
    }
    
    // Hide all other content views first
    const allViews = document.querySelectorAll('.content-view');
    allViews.forEach(view => {
        view.style.display = 'none';
    });
    
    // Show dashboard view (which contains groupsList)
    const dashboardView = document.getElementById('dashboardView');
    if (dashboardView) {
        dashboardView.style.display = 'block';
    }
    
    currentView = 'allhosts';
    document.getElementById('pageTitle').textContent = 'All Hosts';
    
    // Render content
    renderAllHostsView();
}
    
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

function showGroupsView(skipSave = false) {
    console.log('[DEBUG] Showing groups view');
    
    // Save current view (unless restoring)
    if (!skipSave) {
        saveCurrentView('groups');
    }
    
    // Hide all other content views first
    const allViews = document.querySelectorAll('.content-view');
    allViews.forEach(view => {
        view.style.display = 'none';
    });
    
    // Show dashboard view (which contains groupsList)
    const dashboardView = document.getElementById('dashboardView');
    if (dashboardView) {
        dashboardView.style.display = 'block';
    }
    
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
    
    // Clear container completely before rendering
    container.innerHTML = '';
    console.log('[DEBUG] Cleared container, rendering', groups.length, 'groups');
    
    groups.forEach((group, index) => {
        console.log('[DEBUG] Rendering group', index + 1, ':', group.name, 'ID:', group.id);
        const groupHosts = hosts.filter(h => h.group_id === group.id || (!h.group_id && group.id === 0));
        const onlineCount = groupHosts.filter(h => h.status === 'online').length;
        
        const groupCard = document.createElement('div');
        groupCard.className = 'group-card';
        
        const htmlContent = `
            <div class="group-header">
                <div class="group-info group-toggle-trigger" data-group-id="${group.id}">
                    <div class="group-icon">
                        <i class="fas ${group.icon}"></i>
                    </div>
                    <div class="group-details">
                        <h3>${group.name}</h3>
                        <p>${group.description}</p>
                    </div>
                </div>
                <div class="group-stats group-toggle-trigger" data-group-id="${group.id}">
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
        
        groupCard.innerHTML = htmlContent;
        console.log('[DEBUG] Group HTML for', group.name, ':', htmlContent.substring(0, 200));
        
        container.appendChild(groupCard);
        console.log('[DEBUG] Appended group card for:', group.name);
    });
    
    console.log('[DEBUG] Finished rendering all groups');
    
    // Add ungrouped hosts
    const ungroupedHosts = hosts.filter(h => !h.group_id);
    if (ungroupedHosts.length > 0) {
        console.log('[DEBUG] Adding ungrouped hosts:', ungroupedHosts.length);
        const ungroupedCard = document.createElement('div');
        ungroupedCard.className = 'group-card';
        ungroupedCard.innerHTML = `
            <div class="group-header">
                <div class="group-info group-toggle-trigger" data-group-id="0">
                    <div class="group-icon">
                        <i class="fas fa-server"></i>
                    </div>
                    <div class="group-details">
                        <h3>Ungrouped</h3>
                        <p>Hosts without a group</p>
                    </div>
                </div>
                <div class="group-stats group-toggle-trigger" data-group-id="0">
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
    
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
        console.log('[DEBUG] Starting post-render initialization for Groups view');
        
        // Attach click listeners to all toggle triggers
        attachGroupToggleListeners();
        
        // Restore expanded state after render
        restoreExpandedState();
        
        // If no groups are expanded, expand all groups by default
        if (expandedGroups.size === 0) {
            console.log('[DEBUG] No expanded groups in Groups view, expanding all by default');
            expandAllGroups();
        } else {
            console.log('[DEBUG] Restored expanded groups in Groups view:', Array.from(expandedGroups));
        }
        
        console.log('[DEBUG] Groups view initialization complete');
    }, 100);
}

// Attach click listeners for group toggle
function attachGroupToggleListeners() {
    console.log('[DEBUG] Attaching group toggle listeners...');
    
    const triggers = document.querySelectorAll('.group-toggle-trigger');
    console.log('[DEBUG] Found toggle triggers:', triggers.length);
    
    triggers.forEach((trigger, index) => {
        const groupId = trigger.getAttribute('data-group-id');
        console.log('[DEBUG] Processing trigger', index, 'with group ID:', groupId);
        
        // Check if listener already attached
        if (trigger.dataset.listenerAttached === 'true') {
            console.log('[DEBUG] Listener already attached to group:', groupId);
            return;
        }
        
        // Mark as having listener attached
        trigger.dataset.listenerAttached = 'true';
        
        trigger.addEventListener('click', (e) => {
            console.log('[DEBUG] Click event fired on trigger for group:', groupId);
            
            // Don't trigger if clicking on action buttons
            if (e.target.closest('.group-actions')) {
                console.log('[DEBUG] Click was on action button, ignoring');
                return;
            }
            
            console.log('[DEBUG] Calling toggleGroup for group:', groupId);
            const numericGroupId = groupId === '0' ? 0 : parseInt(groupId);
            toggleGroup(numericGroupId);
        });
        
        // Make it look clickable
        trigger.style.cursor = 'pointer';
        
        console.log('[DEBUG] Successfully attached listener to group:', groupId);
    });
    
    console.log('[DEBUG] Finished attaching all listeners');
}

function showSettingsView(skipSave = false) {
    console.log('[DEBUG] Showing settings view');
    
    // Save current view (unless restoring)
    if (!skipSave) {
        saveCurrentView('settings');
    }
    
    // Hide all other content views first
    const allViews = document.querySelectorAll('.content-view');
    allViews.forEach(view => {
        view.style.display = 'none';
    });
    
    // Show dashboard view (which contains groupsList)
    const dashboardView = document.getElementById('dashboardView');
    if (dashboardView) {
        dashboardView.style.display = 'block';
    }
    
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

// Show Alerts View
function showAlertsView(skipSave = false) {
    console.log('[DEBUG] ========== Showing Alerts View ==========');
    console.log('[DEBUG] Function called at:', new Date().toISOString());
    
    // Save current view (unless restoring)
    if (!skipSave) {
        saveCurrentView('alerts');
    }
    
    // Hide dashboard view
    const dashboardView = document.getElementById('dashboardView');
    if (dashboardView) {
        dashboardView.style.display = 'none';
        console.log('[DEBUG] Dashboard view hidden');
    }
    
    // Hide all other content views
    const allViews = document.querySelectorAll('.content-view');
    console.log('[DEBUG] Total content views found:', allViews.length);
    allViews.forEach(view => {
        if (view.id !== 'alertsView') {
            console.log('[DEBUG] Hiding view:', view.id);
            view.style.display = 'none';
        }
    });
    
    // Show alerts view
    const alertsView = document.getElementById('alertsView');
    console.log('[DEBUG] alertsView element:', alertsView);
    
    if (alertsView) {
        console.log('[DEBUG] Setting alertsView display to block');
        alertsView.style.display = 'block';
        console.log('[DEBUG] alertsView display is now:', alertsView.style.display);
        
        console.log('[DEBUG] Calling initializeAlertsView()');
        initializeAlertsView();
        console.log('[DEBUG] ========== Alerts View Shown ==========');
    } else {
        console.error('[ERROR] alertsView element NOT FOUND!');
        console.error('[ERROR] Please check if id="alertsView" exists in HTML');
    }
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

// ==================== ALERT MANAGEMENT ====================

// Load alert configuration
async function loadAlertConfig() {
    try {
        const response = await fetch('/api/alerts/config', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to load alert config');
        
        const config = await response.json();
        
        // Update form fields
        document.getElementById('alertEnabled').checked = config.enabled == 1;
        document.getElementById('serverDownTimeout').value = config.server_down_timeout || 60;
        document.getElementById('cpuThreshold').value = config.cpu_threshold || 70;
        document.getElementById('diskThreshold').value = config.disk_threshold || 90;
        document.getElementById('memoryThreshold').value = config.memory_threshold || 90;
        document.getElementById('networkTimeout').value = config.network_timeout || 60;
        document.getElementById('cooldownPeriod').value = config.cooldown_period || 300;
        
        showToast('Alert configuration loaded', 'success');
    } catch (error) {
        console.error('Error loading alert config:', error);
        showToast('Failed to load alert configuration', 'error');
    }
}

// Save alert configuration
async function saveAlertConfig(event) {
    event.preventDefault();
    
    const config = {
        enabled: document.getElementById('alertEnabled').checked ? 1 : 0,
        server_down_timeout: parseInt(document.getElementById('serverDownTimeout').value),
        cpu_threshold: parseInt(document.getElementById('cpuThreshold').value),
        disk_threshold: parseInt(document.getElementById('diskThreshold').value),
        memory_threshold: parseInt(document.getElementById('memoryThreshold').value),
        network_timeout: parseInt(document.getElementById('networkTimeout').value),
        cooldown_period: parseInt(document.getElementById('cooldownPeriod').value)
    };
    
    try {
        const response = await fetch('/api/alerts/config', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify(config)
        });
        
        if (!response.ok) throw new Error('Failed to save config');
        
        showToast('Alert configuration saved successfully!', 'success');
        loadAlertStats();
    } catch (error) {
        console.error('Error saving alert config:', error);
        showToast('Failed to save alert configuration', 'error');
    }
}

// Load notification channels
async function loadNotificationChannels() {
    try {
        const response = await fetch('/api/alerts/channels', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to load channels');
        
        const channels = await response.json();
        const container = document.getElementById('channelsList');
        
        if (channels.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 10px;"></i>
                    <p>No notification channels configured yet</p>
                    <button class="btn btn-primary" onclick="showAddChannelModal()">
                        <i class="fas fa-plus"></i> Add Your First Channel
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = channels.map(channel => {
            const config = JSON.parse(channel.config);
            const icons = {
                email: 'fa-envelope',
                telegram: 'fa-telegram',
                whatsapp: 'fa-whatsapp'
            };
            
            let details = '';
            if (channel.channel_type === 'email') {
                details = config.to_emails ? config.to_emails.join(', ') : 'N/A';
            } else if (channel.channel_type === 'telegram') {
                details = `Chat ID: ${config.chat_id || 'N/A'}`;
            } else if (channel.channel_type === 'whatsapp') {
                details = config.provider === 'fonnte' 
                    ? `Fonnte: ${config.target || 'N/A'}`
                    : `Twilio: ${config.to_number || 'N/A'}`;
            }
            
            return `
                <div class="channel-item" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <i class="fab ${icons[channel.channel_type] || 'fa-bell'}" style="font-size: 24px; color: #667eea;"></i>
                        <div>
                            <div style="font-weight: 600; text-transform: capitalize;">${channel.channel_type}</div>
                            <div style="font-size: 13px; color: #6b7280;">${details}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="badge ${channel.enabled ? 'badge-success' : 'badge-secondary'}">
                            ${channel.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <button class="btn btn-sm btn-secondary" onclick="testChannelById(${channel.id})" title="Test">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteChannel(${channel.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update stats
        const activeCount = channels.filter(c => c.enabled).length;
        document.getElementById('alertActiveChannels').textContent = activeCount;
        
    } catch (error) {
        console.error('Error loading channels:', error);
        document.getElementById('channelsList').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #f56565;">
                <i class="fas fa-exclamation-triangle"></i> Failed to load channels
            </div>
        `;
    }
}

// Show add channel modal
function showAddChannelModal() {
    document.getElementById('channelModalTitle').textContent = 'Add Notification Channel';
    document.getElementById('channelForm').reset();
    document.getElementById('channelModal').style.display = 'flex';
    updateChannelForm();
}

// Close channel modal
function closeChannelModal() {
    document.getElementById('channelModal').style.display = 'none';
}

// Update channel form based on selected type
function updateChannelForm() {
    const type = document.getElementById('channelType').value;
    
    // Hide all configs
    document.querySelectorAll('.channel-config').forEach(el => el.style.display = 'none');
    
    // Show selected config
    if (type === 'email') {
        document.getElementById('emailConfig').style.display = 'block';
    } else if (type === 'telegram') {
        document.getElementById('telegramConfig').style.display = 'block';
    } else if (type === 'whatsapp') {
        document.getElementById('whatsappConfig').style.display = 'block';
        updateWhatsAppForm();
    }
}

// Update WhatsApp form based on provider
function updateWhatsAppForm() {
    const provider = document.getElementById('whatsappProvider').value;
    document.getElementById('fonnteConfig').style.display = provider === 'fonnte' ? 'block' : 'none';
    document.getElementById('twilioConfig').style.display = provider === 'twilio' ? 'block' : 'none';
}

// Save notification channel
async function saveChannel(event) {
    event.preventDefault();
    
    const type = document.getElementById('channelType').value;
    if (!type) {
        showToast('Please select a channel type', 'error');
        return;
    }
    
    let config = {};
    
    if (type === 'email') {
        const toEmails = document.getElementById('toEmails').value.split(',').map(e => e.trim());
        config = {
            smtp_server: document.getElementById('smtpServer').value,
            smtp_port: parseInt(document.getElementById('smtpPort').value),
            username: document.getElementById('smtpUsername').value,
            password: document.getElementById('smtpPassword').value,
            from_email: document.getElementById('fromEmail').value,
            to_emails: toEmails
        };
    } else if (type === 'telegram') {
        config = {
            bot_token: document.getElementById('botToken').value,
            chat_id: document.getElementById('chatId').value
        };
    } else if (type === 'whatsapp') {
        const provider = document.getElementById('whatsappProvider').value;
        if (provider === 'fonnte') {
            config = {
                provider: 'fonnte',
                api_key: document.getElementById('fonnteApiKey').value,
                target: document.getElementById('fonnteTarget').value
            };
        } else {
            config = {
                provider: 'twilio',
                account_sid: document.getElementById('twilioAccountSid').value,
                auth_token: document.getElementById('twilioAuthToken').value,
                from_number: document.getElementById('twilioFromNumber').value,
                to_number: document.getElementById('twilioToNumber').value
            };
        }
    }
    
    const data = {
        channel_type: type,
        config: config,
        enabled: document.getElementById('channelEnabled').checked ? 1 : 0
    };
    
    try {
        const response = await fetch('/api/alerts/channels', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed to save channel');
        
        showToast('Notification channel saved successfully!', 'success');
        closeChannelModal();
        loadNotificationChannels();
    } catch (error) {
        console.error('Error saving channel:', error);
        showToast('Failed to save notification channel', 'error');
    }
}

// Test notification channel
async function testChannel() {
    const type = document.getElementById('channelType').value;
    if (!type) {
        showToast('Please select and configure a channel first', 'error');
        return;
    }
    
    let config = {};
    
    if (type === 'email') {
        const toEmails = document.getElementById('toEmails').value.split(',').map(e => e.trim());
        config = {
            smtp_server: document.getElementById('smtpServer').value,
            smtp_port: parseInt(document.getElementById('smtpPort').value),
            username: document.getElementById('smtpUsername').value,
            password: document.getElementById('smtpPassword').value,
            from_email: document.getElementById('fromEmail').value,
            to_emails: toEmails
        };
    } else if (type === 'telegram') {
        config = {
            bot_token: document.getElementById('botToken').value,
            chat_id: document.getElementById('chatId').value
        };
    } else if (type === 'whatsapp') {
        const provider = document.getElementById('whatsappProvider').value;
        if (provider === 'fonnte') {
            config = {
                provider: 'fonnte',
                api_key: document.getElementById('fonnteApiKey').value,
                target: document.getElementById('fonnteTarget').value
            };
        } else {
            config = {
                provider: 'twilio',
                account_sid: document.getElementById('twilioAccountSid').value,
                auth_token: document.getElementById('twilioAuthToken').value,
                from_number: document.getElementById('twilioFromNumber').value,
                to_number: document.getElementById('twilioToNumber').value
            };
        }
    }
    
    try {
        showToast('Sending test notification...', 'info');
        
        const response = await fetch('/api/alerts/test', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({channel_type: type, config: config})
        });
        
        console.log('[DEBUG] Test response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[ERROR] Test failed with status:', response.status, errorText);
            showToast(`Test failed (${response.status}): ${errorText}`, 'error');
            return;
        }
        
        const result = await response.json();
        console.log('[DEBUG] Test result:', result);
        
        if (result.success) {
            showToast('Test notification sent successfully! Check your ' + type, 'success');
        } else {
            showToast('Test failed: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error testing channel:', error);
        showToast('Failed to send test notification: ' + error.message, 'error');
    }
}

// Test channel by ID
async function testChannelById(channelId) {
    try {
        console.log('[DEBUG] Testing channel ID:', channelId);
        showToast('Sending test notification...', 'info');
        
        const response = await fetch(`/api/alerts/channels/${channelId}/test`, {
            method: 'POST',
            credentials: 'include'
        });
        
        console.log('[DEBUG] Test response status:', response.status);
        const result = await response.json();
        console.log('[DEBUG] Test result:', result);
        
        if (!response.ok) {
            console.error('[ERROR] Test failed with status:', response.status, result);
            showToast('Test failed: ' + (result.error || 'Server error'), 'error');
            return;
        }
        
        if (result.success) {
            showToast('Test notification sent successfully!', 'success');
        } else {
            showToast('Test failed: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('[ERROR] Exception in testChannelById:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

// Delete notification channel
async function deleteChannel(channelId) {
    if (!confirm('Are you sure you want to delete this notification channel?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/alerts/channels/${channelId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to delete channel');
        
        showToast('Notification channel deleted successfully', 'success');
        loadNotificationChannels();
    } catch (error) {
        console.error('Error deleting channel:', error);
        showToast('Failed to delete notification channel', 'error');
    }
}

// Load alert statistics
async function loadAlertStats() {
    try {
        const response = await fetch('/api/alerts/stats', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to load stats');
        
        const stats = await response.json();
        
        document.getElementById('alertTotalToday').textContent = stats.total_today || 0;
        document.getElementById('alertUnresolved').textContent = stats.unresolved || 0;
        
        // Update system status
        const configResponse = await fetch('/api/alerts/config', {
            credentials: 'include'
        });
        const config = await configResponse.json();
        document.getElementById('alertSystemStatus').textContent = config.enabled ? 'Active' : 'Disabled';
        
    } catch (error) {
        console.error('Error loading alert stats:', error);
    }
}

// Load alert history
async function loadAlertHistory() {
    try {
        const response = await fetch('/api/alerts/history?limit=20', {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to load history');
        
        const alerts = await response.json();
        const container = document.getElementById('alertHistoryList');
        
        if (alerts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 10px; color: #48bb78;"></i>
                    <p>No alerts yet. System is monitoring...</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="max-height: 400px; overflow-y: auto;">
                ${alerts.map(alert => {
                    const severityColors = {
                        critical: '#f56565',
                        warning: '#ed8936',
                        info: '#4299e1'
                    };
                    
                    const severityIcons = {
                        critical: 'fa-exclamation-triangle',
                        warning: 'fa-exclamation-circle',
                        info: 'fa-info-circle'
                    };
                    
                    const date = new Date(alert.created_at);
                    
                    return `
                        <div style="border-left: 4px solid ${severityColors[alert.severity]}; padding: 15px; margin-bottom: 10px; background: #f9fafb; border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <i class="fas ${severityIcons[alert.severity]}" style="color: ${severityColors[alert.severity]};"></i>
                                    <div>
                                        <div style="font-weight: 600;">${alert.hostname} - ${alert.alert_type.replace('_', ' ').toUpperCase()}</div>
                                        <div style="font-size: 12px; color: #6b7280;">${date.toLocaleString()}</div>
                                    </div>
                                </div>
                                <span class="badge ${alert.resolved ? 'badge-success' : 'badge-warning'}">
                                    ${alert.resolved ? 'Resolved' : 'Active'}
                                </span>
                            </div>
                            <div style="font-size: 13px; color: #374151; white-space: pre-line;">${alert.message}</div>
                            ${!alert.resolved ? `
                                <button class="btn btn-sm btn-primary" onclick="resolveAlert(${alert.id})" style="margin-top: 10px;">
                                    <i class="fas fa-check"></i> Mark as Resolved
                                </button>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading alert history:', error);
        document.getElementById('alertHistoryList').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #f56565;">
                <i class="fas fa-exclamation-triangle"></i> Failed to load alert history
            </div>
        `;
    }
}

// Resolve alert
async function resolveAlert(alertId) {
    try {
        const response = await fetch(`/api/alerts/${alertId}/resolve`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('Failed to resolve alert');
        
        showToast('Alert marked as resolved', 'success');
        loadAlertHistory();
        loadAlertStats();
    } catch (error) {
        console.error('Error resolving alert:', error);
        showToast('Failed to resolve alert', 'error');
    }
}

// Initialize alerts view
function initializeAlertsView() {
    console.log('[DEBUG] ========== Initializing Alerts View ==========');
    
    console.log('[DEBUG] Loading alert config...');
    loadAlertConfig();
    
    console.log('[DEBUG] Loading notification channels...');
    loadNotificationChannels();
    
    console.log('[DEBUG] Loading alert stats...');
    loadAlertStats();
    
    console.log('[DEBUG] Loading alert history...');
    loadAlertHistory();
    
    // Setup form handlers
    console.log('[DEBUG] Setting up form handlers...');
    const alertConfigForm = document.getElementById('alertConfigForm');
    if (alertConfigForm) {
        console.log('[DEBUG] alertConfigForm found, adding submit handler');
        alertConfigForm.removeEventListener('submit', saveAlertConfig);
        alertConfigForm.addEventListener('submit', saveAlertConfig);
    } else {
        console.error('[ERROR] alertConfigForm NOT FOUND!');
    }
    
    const channelForm = document.getElementById('channelForm');
    if (channelForm) {
        console.log('[DEBUG] channelForm found, adding submit handler');
        channelForm.removeEventListener('submit', saveChannel);
        channelForm.addEventListener('submit', saveChannel);
    } else {
        console.error('[ERROR] channelForm NOT FOUND!');
    }
    
    console.log('[DEBUG] ========== Alerts View Initialized ==========');
}

// ==================== END ALERT MANAGEMENT ====================

// Helper: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make all necessary functions globally available for HTML onclick handlers
window.showToast = showToast;
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

// Alert Management Functions
window.loadAlertConfig = loadAlertConfig;
window.showAddChannelModal = showAddChannelModal;
window.closeChannelModal = closeChannelModal;
window.updateChannelForm = updateChannelForm;
window.updateWhatsAppForm = updateWhatsAppForm;
window.saveChannel = saveChannel;
window.testChannel = testChannel;
window.testChannelById = testChannelById;
window.deleteChannel = deleteChannel;
window.resolveAlert = resolveAlert;
window.loadAlertHistory = loadAlertHistory;

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
    logout: typeof window.logout,
    alertFunctions: typeof window.showAddChannelModal
});

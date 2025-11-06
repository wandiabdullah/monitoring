# Testing Checklist - Dashboard Features

## 🧪 Manual Testing Guide

### Pre-requisites
1. Backend running: `python backend/app.py`
2. Login with admin/admin123
3. Open browser console (F12)

---

## ✅ Test Cases

### 1. **Add Host Button**

**Steps:**
1. Click "Add Host" button in header
2. Check console for: `[DEBUG] Add Host button clicked`
3. Modal should appear with title "Add New Host"
4. Check console for: `[DEBUG] Opening modal: addHostModal`

**Expected:**
- ✅ Modal opens smoothly
- ✅ Form is empty/reset
- ✅ Groups dropdown populated
- ✅ "Enable Key Mapping" checkbox is checked by default

**Test Data:**
```
Hostname: test-server-01
IP Address: 192.168.1.100
Group: Production (or any)
Description: Test server for monitoring
Key Mapping: ✅ Checked
```

**Click "Add Host" button in modal**

**Expected:**
- ✅ Console shows: `[DEBUG] saveHost called`
- ✅ Console shows: `[DEBUG] Form data: {...}`
- ✅ Console shows: `[DEBUG] Sending payload: {...}`
- ✅ Console shows: `[DEBUG] Response status: 201`
- ✅ Console shows: `[DEBUG] Host added successfully: {...}`
- ✅ API key displayed in green box
- ✅ "Copy" button appears
- ✅ Success alert shows
- ✅ Groups list refreshes with new host

**Click "Copy" button:**
- ✅ API key copied to clipboard
- ✅ Button changes to "Copied!" briefly

---

### 2. **Add Group Button**

**Steps:**
1. Click "Add Group" button
2. Check console for: `[DEBUG] Add Group button clicked`
3. Modal should appear with title "Create New Group"
4. Check console for: `[DEBUG] Opening modal: addGroupModal`

**Expected:**
- ✅ Modal opens smoothly
- ✅ Form is empty/reset
- ✅ Icon dropdown has options

**Test Data:**
```
Group Name: Testing Servers
Icon: fa-flask (or any)
Description: Servers for testing purposes
```

**Click "Create Group" button in modal**

**Expected:**
- ✅ Console shows group creation process
- ✅ Success alert appears
- ✅ Modal closes after 1.5 seconds
- ✅ New group appears in groups list
- ✅ New group available in "Add Host" dropdown

---

### 3. **Refresh Button**

**Steps:**
1. Click "Refresh" button
2. Check console for: `[DEBUG] Refresh button clicked`

**Expected:**
- ✅ Refresh icon spins
- ✅ Data reloads from server
- ✅ Stats cards update
- ✅ Host status updates (online/offline)

---

### 4. **Sidebar Menu**

**Test each menu item:**

**Dashboard:**
- ✅ Click highlights menu item
- ✅ Shows main dashboard view

**Add Host (sidebar):**
- ✅ Opens Add Host modal
- ✅ Console shows: `[DEBUG] Opening modal: addHostModal`

**Add Group (sidebar):**
- ✅ Opens Add Group modal
- ✅ Console shows: `[DEBUG] Opening modal: addGroupModal`

**Logout:**
- ✅ Logs out user
- ✅ Redirects to /login

---

### 5. **Group Expansion**

**Steps:**
1. Find any group card
2. Click on group header
3. Check console for toggleGroup call

**Expected:**
- ✅ Group hosts section expands
- ✅ Chevron icon rotates
- ✅ Hosts grid visible
- ✅ Click again to collapse

---

### 6. **Host Card Click**

**Steps:**
1. Click on any host card
2. Check console for: `[DEBUG] Viewing host details: hostname`

**Expected:**
- ✅ Redirects to `/old-dashboard?host=hostname`
- ✅ Shows detailed metrics for that host

---

### 7. **Statistics Cards**

**Check all 4 cards update correctly:**

**Total Hosts:**
- ✅ Shows correct count
- ✅ Updates when host added

**Online Hosts:**
- ✅ Shows hosts with metrics
- ✅ Green color

**Offline Hosts:**
- ✅ Shows hosts without recent metrics
- ✅ Red color

**Total Groups:**
- ✅ Shows correct count
- ✅ Updates when group added

---

### 8. **Modal Close Buttons**

**Test all close methods:**

**X button (top right):**
- ✅ Closes modal
- ✅ Console shows: `[DEBUG] Closing modal: ...`

**Cancel button:**
- ✅ Closes modal

**Outside modal click:**
- ❓ Should close modal (optional enhancement)

---

### 9. **Form Validation**

**Add Host - Empty hostname:**
1. Open Add Host modal
2. Leave hostname empty
3. Click "Add Host"
4. ✅ Shows error: "Hostname is required"

**Add Group - Empty name:**
1. Open Add Group modal
2. Leave name empty
3. Click "Create Group"
4. ✅ Shows error: "Group name is required"

---

### 10. **API Integration**

**Check backend endpoints:**

```bash
# List groups
curl http://localhost:5000/api/groups -b cookies.txt

# List hosts
curl http://localhost:5000/api/hosts -b cookies.txt

# Add group
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Test Group","icon":"fa-server"}'

# Add host
curl -X POST http://localhost:5000/api/hosts \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"hostname":"test-01","group_id":1,"enable_key_mapping":true}'
```

---

## 🐛 Common Issues & Fixes

### Issue: Button doesn't work

**Check:**
1. Console for errors
2. Element ID matches JavaScript
3. Event listener attached
4. Console shows: `[DEBUG] ... button listener attached`

**Fix:**
```javascript
// Verify in console:
document.getElementById('addHostBtn')  // Should not be null
```

---

### Issue: Modal doesn't open

**Check:**
1. Modal element exists
2. Console shows: `[ERROR] Modal not found`
3. CSS class 'show' applied

**Fix:**
```javascript
// Verify in console:
document.getElementById('addHostModal')  // Should not be null
```

---

### Issue: Form submission fails

**Check:**
1. Network tab (F12)
2. Request payload
3. Response status and body
4. Console errors

**Fix:**
- Check backend is running
- Check API endpoint exists
- Verify authentication (session cookie)

---

### Issue: Groups not loading

**Check:**
1. Console: `[DEBUG] Groups loaded: X`
2. Network tab: `/api/groups` request
3. Response data

**Fix:**
```bash
# Create default group via API
curl -X POST http://localhost:5000/api/groups \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Production","icon":"fa-server","description":"Production servers"}'
```

---

### Issue: Hosts not showing in groups

**Check:**
1. Host has `group_id` set
2. Group exists
3. Console logs during render

**Fix:**
```bash
# Update host group
curl -X PUT http://localhost:5000/api/hosts/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"group_id":1}'
```

---

## 📊 Console Output Reference

**Successful initialization:**
```
[DEBUG] Dashboard initializing...
[DEBUG] Auth check completed
[DEBUG] Groups loaded: 3
[DEBUG] Hosts loaded: 5
[DEBUG] Event listeners initialized
[DEBUG] Add Host button listener attached
[DEBUG] Add Group button listener attached
[DEBUG] Refresh button listener attached
[DEBUG] Save Host button listener attached
[DEBUG] Save Group button listener attached
[DEBUG] Auto-refresh started
[DEBUG] Stats updated
[DEBUG] Dashboard initialization complete!
```

**Successful host addition:**
```
[DEBUG] Add Host button clicked
[DEBUG] Opening modal: addHostModal
[DEBUG] Modal opened successfully: addHostModal
[DEBUG] saveHost called
[DEBUG] Form data: {...}
[DEBUG] Sending payload: {...}
[DEBUG] Response status: 201
[DEBUG] Host added successfully: {...}
[DEBUG] Groups loaded: 3
[DEBUG] Hosts loaded: 6
```

---

## ✅ Final Checklist

Before marking as complete, verify:

- [ ] All buttons respond to clicks
- [ ] All modals open and close
- [ ] Forms submit successfully
- [ ] Data persists in database
- [ ] Stats update in real-time
- [ ] Groups expand/collapse
- [ ] Host cards clickable
- [ ] API keys copyable
- [ ] No console errors
- [ ] Backend logs show requests

---

## 🎯 Success Criteria

Dashboard is working if:
1. ✅ Can add new groups
2. ✅ Can add new hosts with API key
3. ✅ Hosts appear in correct groups
4. ✅ Can copy API key
5. ✅ Stats update correctly
6. ✅ Can view host details
7. ✅ All buttons functional
8. ✅ No JavaScript errors

---

**Test Report Date:** _____________

**Tested By:** _____________

**Result:** ✅ Pass / ❌ Fail

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

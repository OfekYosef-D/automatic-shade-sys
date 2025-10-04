# 🧪 Manual Testing Guide - Areas Section

## Pre-Test Setup
1. ✅ SQL file executed with `password_hash` and `area_assignments` table
2. ✅ Server running on port 3001
3. ✅ Client running on port 5173
4. ✅ Browser localStorage cleared (F12 → Application → Clear)

---

## 🔴 ADMIN TESTING (alice@campus.edu / password123)

### Test 1: Authentication
```
1. Open http://localhost:5173
2. Should redirect to /login
3. Enter: alice@campus.edu / password123
4. Click Sign In
✅ Expected: Redirects to dashboard
✅ Expected: Navbar shows "Alice Green" + "admin" badge
✅ Expected: Logout button visible
```

### Test 2: Areas - Upload Map
```
1. Click "Areas" in navbar
2. Should see "Upload Map" button
3. Click "Upload Map"
4. Upload any image file (< 10MB)
5. Enter name: "Test Building A"
6. Enter description: "Main floor plan"
7. Click "Upload Map"
✅ Expected: Progress bar shows 0% → 100%
✅ Expected: Modal closes, area card appears
✅ Expected: Activity log shows "Map uploaded"
```

### Test 3: Areas - Configure (Admin)
```
1. On area card, verify buttons visible:
   - View button (blue)
   - Configure button (⚙️ gear icon, Admin only)
   - Manage button (green with +, Admin & Maintenance)
   - Delete button (red trash, Admin only)
2. Click Configure (⚙️) button
3. Modal opens with title: "Test Building A - Configure"
4. Click "Area Settings" button in header
5. Change name to "Test Building A - Edited"
6. Click "Save Settings"
✅ Expected: Toast shows "Area settings saved"
✅ Expected: Header updates to new name immediately
✅ Expected: Activity log updates
7. Close modal and reopen → Name should persist
```

### Test 4: Areas - Replace Map
```
1. In Configure mode, click "Area Settings"
2. Click "Replace Map" button
3. Select a different image
4. Click "Upload" button
✅ Expected: Map image changes immediately
✅ Expected: Toast shows "Map replaced successfully"
✅ Expected: No placeholder shown
```

### Test 5: Device Management - Add Device
```
1. In Configure/Manage mode
2. Click anywhere on the map
✅ Expected: Green pulsing dot appears
✅ Expected: Sidebar shows "Add New Device" form with coordinates
3. Enter description: "Window Shade 101"
4. Select type: "Blinds"
5. Set position: 50%
6. Click "Add Device"
✅ Expected: Device appears on map at clicked position
✅ Expected: Toast: "Device added successfully"
✅ Expected: Activity log updates
```

### Test 6: Device - Drag to Reposition
```
1. In Configure/Manage mode
2. Drag a device to new position
3. Release mouse
✅ Expected: Toast: "Device position saved"
✅ Expected: Position persists after refresh
```

### Test 7: Device - Control & Status
```
1. Click View button on an area
2. Click a device on map
3. Sidebar shows device control panel
✅ Expected: Status dropdown visible (Admin/Maintenance only)
4. Change status to "Under Maintenance"
✅ Expected: Device reloads with yellow border + 🔧 badge
✅ Expected: Warning banner: "Device Under Maintenance"
✅ Expected: Controls disabled
5. Change status back to "Active"
✅ Expected: Normal white border, controls enabled
```

### Test 8: Device - Delete
```
1. In View mode, click a device
2. Scroll down in control panel
✅ Expected: "Delete Device" button visible (red)
3. Click Delete
4. Confirm dialog
✅ Expected: Device removed from map
✅ Expected: Activity log: "Shade device deleted"
```

### Test 9: Area - Delete
```
1. On areas page
2. Click red trash button on an area card
3. Confirm dialog
✅ Expected: Spinner shows during deletion
✅ Expected: Area card disappears
✅ Expected: Map file deleted from server
✅ Expected: All devices in that area deleted
```

### Test 10: Alerts - Full Workflow
```
1. On dashboard, click "Add Alert" button
2. Fill: Description "Test alert", Location (select area), Priority "High"
3. Submit
✅ Expected: Redirect to dashboard
✅ Expected: Alert appears in Active Alerts
4. Assign alert to "Bob Shade" via dropdown
✅ Expected: Status changes to "acknowledged" automatically
✅ Expected: "Being handled" badge appears
✅ Expected: Activity log: "Alert assigned and acknowledged"
5. Click "Mark Resolved"
✅ Expected: Alert disappears from active alerts
✅ Expected: Activity log updates
```

---

## 🟡 MAINTENANCE TESTING (bob@campus.edu / password123)

### Test 1: Login
```
1. Logout if logged in
2. Login: bob@campus.edu / password123
✅ Expected: Dashboard loads
✅ Expected: Navbar shows "Bob Shade" + "maintenance" badge
```

### Test 2: Areas - Button Visibility
```
1. Click "Areas" in navbar
2. On area cards, verify buttons:
✅ View button: VISIBLE ✅
✅ Configure (⚙️): HIDDEN ❌ (Admin only)
✅ Manage (green +): VISIBLE ✅
✅ Delete (trash): HIDDEN ❌ (Admin only)
✅ Upload Map button in header: HIDDEN ❌
```

### Test 3: Manage Mode - Add Device
```
1. Click green "Manage" button
2. Modal title: "Area Name - Manage Devices" (not "Configure")
3. No "Area Settings" button in header
4. Click on map to add device
✅ Expected: Add device form appears
5. Add device successfully
✅ Expected: Works, activity log shows your name
```

### Test 4: Device - Control & Delete
```
1. In View mode, click a device
2. Control panel opens
✅ Expected: Status dropdown VISIBLE (can mark under maintenance)
✅ Expected: Quick actions work (Open/Close/Half)
✅ Expected: Delete button VISIBLE ✅
3. Delete device
✅ Expected: Works, device removed
```

### Test 5: Alerts - Assignment
```
1. On dashboard, create an alert
2. Assign dropdown: VISIBLE ✅
3. Assign to yourself ("👤 Me (Bob Shade)")
✅ Expected: Works, auto-acknowledges
4. "My Alerts" button shows count
5. Click "My Alerts (1)"
✅ Expected: Filters to show only your alerts
6. Click "Show All"
✅ Expected: Shows all alerts again
```

### Test 6: Alerts - Management
```
1. Acknowledge alert
✅ Expected: Works
2. Resolve alert
✅ Expected: Works
3. Delete alert
✅ Expected: Works
```

### Test 7: Restrictions
```
1. Try to access area Settings panel
✅ Expected: Button not visible in Manage mode
2. Try to delete area
✅ Expected: Button not visible
```

---

## 🔵 PLANNER TESTING (dana@campus.edu / password123)

### Test 1: Login
```
1. Logout if logged in
2. Login: dana@campus.edu / password123
✅ Expected: Dashboard loads
✅ Expected: Navbar shows "Dana Planner" + "planner" badge
```

### Test 2: Areas - Button Visibility
```
1. Click "Areas" in navbar
2. On area cards, verify:
✅ View button: VISIBLE ✅
✅ Configure (⚙️): HIDDEN ❌
✅ Manage (green +): HIDDEN ❌ (Maintenance+ only)
✅ Delete (trash): HIDDEN ❌
✅ Upload Map button: HIDDEN ❌
```

### Test 3: Device Control - WITHOUT Assignment
```
1. Click "View" button on any area
2. Click a device on map
3. Try to control device (move slider, click Open/Close)
✅ Expected: Gets 403 error from server
✅ Expected: Error modal appears:
   Title: "🛡️ Permission Denied"
   Message: "Access denied: You are not assigned to this area"
   Help: "Contact administrator for access"
```

### Test 4: Device Control - WITH Assignment
```
Prerequisites: In MySQL Workbench, run:
  INSERT INTO area_assignments (user_id, area_id) VALUES (3, 1);
  (Assigns Dana to area ID 1)

1. Refresh page
2. Click View on area ID 1
3. Click a device
4. Control panel opens
✅ Expected: Quick actions work (Open/Close/Half)
✅ Expected: Slider works
✅ Expected: Status dropdown: HIDDEN ❌
✅ Expected: Delete button: HIDDEN ❌
✅ Expected: Activity log shows "Dana Planner adjusted device"

5. Try device in different area (area ID 2, not assigned)
✅ Expected: Error modal appears
```

### Test 5: Alerts - Create Only
```
1. On dashboard, click "Add Alert"
2. Create alert
✅ Expected: Works, can create alerts
3. Back to dashboard, look at alert card
✅ Expected: NO acknowledge/resolve buttons
✅ Expected: NO delete button
✅ Expected: NO assign dropdown
✅ Expected: Message: "Only administrators and maintenance can manage alerts"
✅ Expected: If alert assigned, shows badge "Assigned to Bob Shade" (read-only)
```

### Test 6: Activity Log
```
1. View activity log on dashboard
✅ Expected: Can see all activities
✅ Expected: Filters work (Type and User)
✅ Expected: Your actions show "Dana Planner (planner)" badge
```

### Test 7: Restrictions Summary
```
❌ Cannot upload maps
❌ Cannot configure areas
❌ Cannot delete areas
❌ Cannot add devices
❌ Cannot delete devices
❌ Cannot update device status
❌ Cannot manage alerts (acknowledge/resolve/delete)
❌ Cannot create schedules
✅ Can view all areas/maps
✅ Can control devices in ASSIGNED areas only
✅ Can create alerts
✅ Can view activity log
```

---

## 🔒 SECURITY TESTS (Any Role)

### Test 1: Unauthorized Access
```
1. Logout completely
2. Try to navigate to http://localhost:5173/areas
✅ Expected: Redirects to /login
```

### Test 2: File Upload Limits
```
1. Login as Admin
2. Try to upload >10MB file
✅ Expected: Error: "File too large (limitMB: 10)"
```

### Test 3: SQL Injection
```
1. In area name field, enter: '; DROP TABLE users; --
✅ Expected: Sanitized, saved as plain text
```

### Test 4: XSS Prevention
```
1. In alert description, enter: <script>alert('xss')</script>
✅ Expected: HTML tags stripped, shows as text
```

---

## 📊 COMPREHENSIVE AREAS SECTION TEST

### Feature Matrix

| Feature | Admin | Maintenance | Planner |
|---------|-------|-------------|---------|
| **View Areas Page** | ✅ | ✅ | ✅ |
| **Upload Map Button** | ✅ | ❌ | ❌ |
| **View Button** | ✅ | ✅ | ✅ |
| **Configure Button (⚙️)** | ✅ | ❌ | ❌ |
| **Manage Button (green +)** | ✅ | ✅ | ❌ |
| **Delete Area Button** | ✅ | ❌ | ❌ |
| **Area Settings Panel** | ✅ | ❌ | ❌ |
| **Replace Map** | ✅ | ❌ | ❌ |
| **Click Map to Add Device** | ✅ | ✅ | ❌ |
| **Drag Device Position** | ✅ | ✅ | ❌ |
| **Click Device to Control** | ✅ All | ✅ All | ✅ Assigned |
| **Device Status Dropdown** | ✅ | ✅ | ❌ |
| **Delete Device Button** | ✅ | ✅ | ❌ |
| **Schedule Management** | ✅ | ✅ | ❌ |

---

## ✅ EXPECTED UI STATE BY ROLE

### Admin Views Area Card:
```
[Area Image]
Test Building A
Building 1 • Floor 2

Created by Alice Green  |  Dec 15, 2024

[View] [⚙️] [+Manage] [🗑️]
```

### Maintenance Views Area Card:
```
[Area Image]
Test Building A
Building 1 • Floor 2

Created by Alice Green  |  Dec 15, 2024

[View] [+Manage]
```

### Planner Views Area Card:
```
[Area Image]
Test Building A
Building 1 • Floor 2

Created by Alice Green  |  Dec 15, 2024

[View]
```

---

## 🐛 KNOWN FIXES APPLIED

### ✅ Fixed: Device Delete Not Working
- **Issue:** allowDelete was hardcoded to false
- **Fix:** Now checks user role: `allowDelete={user?.role === 'admin' || user?.role === 'maintenance'}`
- **Status:** FIXED

### ✅ Fixed: Maintenance Can't Add Devices
- **Issue:** Configure button was Admin-only
- **Fix:** Added separate "Manage" button for Admin + Maintenance
- **Status:** FIXED

### ✅ Fixed: Settings Panel Shows for Maintenance
- **Issue:** Settings panel appeared for all in edit mode
- **Fix:** Wrapped in `{isEditMode && user?.role === 'admin' && ...}`
- **Status:** FIXED

---

## 🎯 CRITICAL PATHS TO TEST

### Path 1: Full Area Lifecycle (Admin)
```
Upload Map → Configure → Add Device → Drag Device → 
Delete Device → Delete Area
```

### Path 2: Device Management (Maintenance)
```
Click Manage → Add Device → Control Device → 
Mark Under Maintenance → Delete Device
```

### Path 3: View & Report (Planner)
```
View Area → Try Control (fail) → Assign Area → 
Control Device (success) → Create Alert
```

---

## 🚨 STOP AND FIX IF:

- ❌ Admin can't delete device
- ❌ Maintenance can't add device
- ❌ Planner can see Configure button
- ❌ Area settings don't persist
- ❌ Map upload doesn't show progress
- ❌ Device status visual doesn't update
- ❌ Activity log doesn't refresh on changes
- ❌ Error modals don't appear for unauthorized actions

---

## ✅ TEST COMPLETION CHECKLIST

- [ ] Admin can do everything
- [ ] Maintenance cannot configure/delete areas
- [ ] Maintenance CAN add/delete devices
- [ ] Planner sees view-only UI
- [ ] Planner can only control assigned devices
- [ ] All buttons have correct visibility per role
- [ ] Error messages are clear and helpful
- [ ] Activity log updates in real-time
- [ ] Alert assignment auto-acknowledges
- [ ] Device status visuals work (colors, badges)
- [ ] Mobile-friendly (test on phone or DevTools)

**Start testing now and report any failures!**


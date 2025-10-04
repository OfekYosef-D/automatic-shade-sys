# System Testing Report - Pre-Submission

## Test Environment
- Date: Pre-submission review
- Tester Role: CTO-level comprehensive testing
- Test Users:
  - Admin: alice@campus.edu (ID: 1)
  - Maintenance: bob@campus.edu (ID: 2)
  - Planner: dana@campus.edu (ID: 3)

---

## 🔴 ADMIN ROLE TESTING (alice@campus.edu)

### Authentication
- [ ] Login with email/password
- [ ] JWT token generated and stored
- [ ] Logout clears token and redirects
- [ ] Invalid credentials rejected

### Areas & Maps
- [ ] View all areas
- [ ] Upload new map (with progress bar)
- [ ] Configure area (edit name, description)
- [ ] Replace map file
- [ ] Delete area (cascade deletes devices)
- [ ] UI shows: Upload button, Configure button, Delete button

### Devices
- [ ] Add device to map (click position)
- [ ] Drag device to reposition
- [ ] Control device position (slider + quick actions)
- [ ] Update device status (Active/Under Maintenance/Inactive)
- [ ] Delete device
- [ ] Create schedule for device
- [ ] Delete schedule

### Alerts
- [ ] Create alert
- [ ] Assign alert to maintenance user (auto-acknowledges)
- [ ] Acknowledge alert manually
- [ ] Resolve alert
- [ ] Delete alert
- [ ] See "My Alerts" filter (if assigned)

### Activity Log
- [ ] View all activities
- [ ] Filter by type
- [ ] Filter by user
- [ ] See user role badges
- [ ] Activities show correct user attribution

### Expected Permissions: FULL ACCESS TO EVERYTHING

---

## 🟡 MAINTENANCE ROLE TESTING (bob@campus.edu)

### Authentication
- [ ] Login with email/password
- [ ] JWT token generated
- [ ] Logout works

### Areas & Maps
- [ ] View all areas (read-only)
- [ ] Upload button: HIDDEN ❌
- [ ] Configure button: HIDDEN ❌
- [ ] Delete area button: HIDDEN ❌
- [ ] Can open View mode (view map + devices)

### Devices
- [ ] Add device to map
- [ ] Control device position (all devices campus-wide)
- [ ] Update device status dropdown visible
- [ ] Delete device (has permission)
- [ ] Create schedule
- [ ] Delete schedule
- [ ] Drag device: Should work only if allowed

### Alerts
- [ ] Create alert
- [ ] Assign alert to self or others
- [ ] Acknowledge alert
- [ ] Resolve alert
- [ ] Delete alert
- [ ] "My Alerts" filter shows count and filters correctly

### Activity Log
- [ ] View activities
- [ ] Filter by type/user

### Expected Restrictions:
- ❌ Cannot upload/configure/delete areas
- ✅ Can manage devices campus-wide
- ✅ Can manage alerts

---

## 🔵 PLANNER ROLE TESTING (dana@campus.edu)

### Authentication
- [ ] Login with email/password
- [ ] JWT token generated
- [ ] Logout works

### Areas & Maps
- [ ] View all areas (read-only)
- [ ] Upload button: HIDDEN ❌
- [ ] Configure button: HIDDEN ❌
- [ ] Delete area button: HIDDEN ❌
- [ ] Can only open View mode

### Devices (WITHOUT area assignment)
- [ ] Add device button: HIDDEN ❌
- [ ] Click device → Try to control
- [ ] Expected: ERROR "Access denied: You are not assigned to this area"
- [ ] Drag device: Should show error modal

### Devices (WITH area assignment)
Prerequisites: Run SQL: `INSERT INTO area_assignments (user_id, area_id) VALUES (3, 1);`
- [ ] Can control devices in assigned area ONLY
- [ ] Quick actions work (Open/Close/Half)
- [ ] Slider control works
- [ ] Cannot delete device
- [ ] Cannot create schedule
- [ ] Status dropdown: HIDDEN ❌

### Alerts
- [ ] Create alert (report problem)
- [ ] Acknowledge button: HIDDEN ❌
- [ ] Resolve button: HIDDEN ❌
- [ ] Delete button: HIDDEN ❌
- [ ] See "Only administrators and maintenance can manage alerts" message
- [ ] Can see assignment info (read-only badge)

### Activity Log
- [ ] View activities (read-only)
- [ ] Filters: HIDDEN or view-only ❌

### Expected Restrictions:
- ❌ Cannot upload/configure/delete areas
- ❌ Cannot add/delete devices
- ❌ Cannot manage alerts (only create)
- ❌ Can only control devices in assigned areas
- ✅ Can view everything
- ✅ Can create alerts

---

## 🔒 Security Tests

### JWT Token Tests
- [ ] Request without token → 401 Unauthorized
- [ ] Request with invalid token → 403 Forbidden
- [ ] Request with expired token → Auto-logout + redirect to login

### SQL Injection Tests
- [ ] Try SQL in map name: `'; DROP TABLE users; --`
- [ ] Expected: Sanitized, HTML stripped

### XSS Tests
- [ ] Try script in alert description: `<script>alert('xss')</script>`
- [ ] Expected: Tags stripped, shows as text

### File Upload Tests
- [ ] Upload 11MB file → 413 error "File too large"
- [ ] Upload .exe file → Rejected
- [ ] Upload SVG with script → Rejected "Unsafe SVG content"

---

## 🐛 Known Issues to Fix

### Critical (Must Fix)
- [ ] None found yet

### Medium (Should Fix)
- [ ] None found yet

### Low (Nice to Have)
- [ ] None found yet

---

## 📋 Test Execution Checklist

1. [ ] Restart server with latest code
2. [ ] Re-run SQL to update DB schema
3. [ ] Clear browser localStorage
4. [ ] Test each role systematically
5. [ ] Document all findings
6. [ ] Fix critical bugs
7. [ ] Re-test fixes
8. [ ] Mark as ready for submission

---

## Final Sign-Off

- [ ] All admin functions work as expected
- [ ] All maintenance restrictions enforced
- [ ] All planner restrictions enforced
- [ ] No critical security vulnerabilities
- [ ] Error messages are clear and helpful
- [ ] Mobile responsive works
- [ ] Activity log tracks all actions
- [ ] Alert assignment workflow complete

**Tested by:** _________________  
**Date:** _________________  
**Status:** ⬜ PASS / ⬜ FAIL / ⬜ NEEDS FIXES  
**Ready for Submission:** ⬜ YES / ⬜ NO  


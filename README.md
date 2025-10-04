# Automatic Shading Systems

A full‑stack project for managing areas, maps, and shading devices with alerts and dashboards.

## Prerequisites
- Node.js 18+
- npm 9+
- MySQL 8+ (or compatible)

## Repository Layout
- `client/` — Vite + React frontend
- `server/` — Express backend (MySQL via mysql2)
- `server/uploads/maps/` — Stored map files (ignored in VCS)
- `shade_system_test.sql` — Database schema and minimal seed

## 1) Database Setup
1. Create the database and tables:
   - Open MySQL client and run:
```sql
SOURCE shade_system_test.sql;
```
2. Ensure a user exists with permissions to the new database.

## 2) Backend Setup
```
cd server
npm install
```
Create a `.env` file in `server/`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=shade_system_test
DB_PORT=3306
```
Start the server:
```
npm start
```
- API base: `http://localhost:3001`
- CORS allows `http://localhost:5173`

## 3) Frontend Setup
```
cd client
npm install
npm run dev
```
- App runs at `http://localhost:5173`

## 4) Login Credentials
All demo accounts use password: **password123**

| Email | Role | Permissions |
|-------|------|-------------|
| alice@campus.edu | Admin | Full access: upload/configure/delete areas, add/delete devices, manage alerts |
| bob@campus.edu | Maintenance | Add devices, control positions, acknowledge/resolve/delete alerts |
| dana@campus.edu | Planner | View all data, control device positions (no delete/configure) |
| levigal50@gmail.com | Admin | Full access |

### Role Permission Summary (Production-Grade)

**ADMIN** (IT/Facilities Director)
- ✅ Full system access
- ✅ Upload/configure/delete areas and maps
- ✅ Add/delete/control all devices campus-wide
- ✅ Create/acknowledge/resolve/delete alerts
- ✅ Manage schedules for any device

**MAINTENANCE** (Facilities Crew)
- ✅ View all areas/maps (read-only, no configure)
- ✅ Add devices (installations)
- ✅ Control/delete all devices campus-wide
- ✅ Create/acknowledge/resolve/delete alerts
- ✅ Manage schedules for any device
- ❌ Cannot upload/configure/delete areas

**PLANNER** (Faculty/Staff/Room Users)
- ✅ View all areas/maps (read-only)
- ✅ Control device positions in ASSIGNED areas only
- ✅ Create alerts (report problems/tickets)
- ❌ Cannot acknowledge/resolve alerts (not their job)
- ❌ Cannot add/delete devices
- ❌ Cannot configure areas
- ❌ Cannot manage schedules
- ❌ Can only control devices in areas assigned to them

**Area Assignments:** Planners must be assigned to specific areas to control devices. Admins can assign planners to areas. Example:
```sql
-- Assign Dana (user_id=3) to Building A (area_id=1)
INSERT INTO area_assignments (user_id, area_id) VALUES (3, 1);
```

## Core Features
- Areas & Maps
  - Upload map (image/SVG, max 10MB), edit map name/description, replace map
  - Interactive map with device management (configure mode)
  - Device drag‑to‑reposition with persistence
- Devices (Shades)
  - Add devices at map coordinates, control position, quick actions
  - Device status management (Active, Under Maintenance, Inactive)
- **Automatic Scheduling System** 🆕
  - Create time-based schedules for devices
  - Automatic execution every minute
  - Daily or day-specific schedules (Monday-Sunday)
  - Activity logging for all schedule executions
  - Admin/Maintenance only management
- Alerts
  - Create alerts (via dashboard button), view active alerts, update status
  - Alert assignment to maintenance staff
  - "My Alerts" filtering for assigned maintenance tasks
- Dashboard
  - Metrics, active alerts, recent activity log
  - Real-time updates when data changes

## Routes Kept for Submission
- Frontend pages: `/` (Dashboard), `/areas`, `/add-alert`
- Backend routes: `/api/maps`, `/api/shades`, `/api/alerts`, `/api/dashboard`, `/api/users`

## Security & Validation
- **JWT Authentication**: Secure token-based auth with bcrypt password hashing
- **Role-Based Access Control**: Admin, Maintenance, Planner roles with different permissions
- Parameterized SQL everywhere (zero SQL injection risk)
- Input sanitization (trim, strip HTML/control chars, length limits)
- Images: MIME/type checked; SVGs scanned for scripts/JS
- Upload limit: 10MB (Multer); 413 error returned for oversize
- Protected routes return 401/403 with clear error messages
- Automatic token refresh and logout on expiry

## Quick Test Checklist

### 1. **Authentication & Roles**
   - Login as alice@campus.edu / password123 (Admin) → See all buttons
   - Login as bob@campus.edu / password123 (Maintenance) → No Configure/Delete area buttons
   - Login as dana@campus.edu / password123 (Planner) → View-only, can only create alerts
   - Test logout → Redirects to login

### 2. **Alert Assignment Workflow** ⭐ NEW
   - Login as Admin → Create alert
   - Assign alert to "Bob Shade" from dropdown → Auto-acknowledges + shows "Being handled" badge
   - Login as Bob (maintenance) → Click "My Alerts (1)" button → See only assigned alerts
   - Resolve alert → Disappears from active alerts

### 3. **Enhanced Activity Log** ⭐ NEW
   - Filter by Type: Select "Overrides" → See only override actions
   - Filter by User: Select "Bob Shade" → See only Bob's actions
   - Each entry shows: User name + Role badge + Icon + Description + Time
   - Shows last 10 activities (increased from 5)

### 4. **Area-Based Permissions (Planner)** ⭐ NEW
   - Login as Admin → Upload a map (create area 1)
   - In MySQL: `INSERT INTO area_assignments (user_id, area_id) VALUES (3, 1);` (assign Dana to area 1)
   - Login as Dana (planner) → Can control devices in area 1
   - Try to control device in unassigned area → See detailed error modal

### 5. **Error Handling** ⭐ NEW
   - Login as Planner → Try to click Configure (hidden, shouldn't see it)
   - Try to drag device in unassigned area → Detailed modal: "Access denied: You are not assigned to this area" + help text

### 6. **Areas** (Admin only)
   - Upload map; configure; change name/description; replace map; drag device
   
### 7. **Devices**
   - Admin: Can add/delete
   - Maintenance: Can add/delete
   - Planner: Can only control positions in assigned areas

### 8. **Automatic Scheduling** 🆕

The system includes a production-ready automatic scheduler that executes device schedules in real-time.

#### How It Works:

1. **Create a Schedule** (Admin/Maintenance only):
   - Open Configure mode for an area
   - Click on a device
   - Click "Add Schedule"
   - Fill in:
     - **Name**: "Morning Open", "Evening Close", etc.
     - **Day**: Daily or specific day (Monday-Sunday)
     - **Start Time**: When to begin (e.g., 07:00)
     - **End Time**: When to end (e.g., 09:00)
     - **Target Position**: Device position (0=closed, 100=open)

2. **Intelligent Automatic Execution** (Phase 2 - Smart Override Detection):
   - Scheduler runs every 2 minutes (configurable)
   - **Executes once per day at start_time** (not continuously)
   - **Detects manual overrides** - Skips execution if user changed device within 30 minutes
   - After execution, users maintain full manual control
   - Automatically resumes next matching day
   - Logs all executions and skips to activity log
   - Respects device status (skips inactive/maintenance devices)

3. **Example Schedule (Phase 2 - Intelligent Behavior)**:
   ```
   Name: "Morning Open"
   Day: Daily
   Start: 07:00
   End: 09:00
   Position: 100% (fully open)
   
   Scenario A - No User Intervention:
   07:00 → Schedule executes → Device opens to 100%
   07:30 → User manually changes to 50%
   07:32 → System respects change (no override)
   Next day 07:00 → Device opens to 100% again
   
   Scenario B - User Pre-sets (NEW in Phase 2):
   06:40 → User manually sets device to 50%
   07:00 → Schedule detects recent manual change (20 min ago)
         → SKIPS execution for today
         → Device stays at 50% (user's choice respected)
         → Activity log: "Schedule skipped: Manual override detected"
   Next day 07:00 → Schedule executes again (if no manual change)
   
   ✅ Automation sets initial state when needed
   ✅ Detects and respects user intent
   ✅ Users can prevent automation by manual pre-set
   ✅ Intelligent, context-aware behavior
   ```

4. **Activity Logging**:
   - All schedule executions are logged
   - Shows in activity log: "Schedule 'Morning Open' executed: Device Name → 100%"
   - Tracks which user created the schedule

5. **Professional Schedule Management**:
   - **Pause/Enable Toggle** - Temporarily disable schedules without deleting
   - **Visual Status Indicators** - See at a glance which schedules are active/paused
   - **Quick Controls** - Pause button for emergencies or maintenance
   - **Activity Logging** - All pause/enable actions tracked
   - Only executes on 'active' schedules
   - Skips devices that are 'under_maintenance' or 'inactive'
   
6. **Smart Schedule Behavior** (Professional Design):
   - **At Start Time** (e.g., 07:00): Schedule executes once, sets device position
   - **After Execution**: User has full manual control, changes are respected
   - **End Time** (e.g., 09:00): No action, device maintains current position
   - **Next Day**: Schedule executes again at start time
   - **Emergency Override**: Pause button available for Admin/Maintenance
   - **Best of Both Worlds**: Automation convenience + User control

#### Testing the Scheduler:

**Quick Test:**
1. Login as Admin (alice@campus.edu)
2. Create a schedule for 2 minutes from now
   - Example: If it's 15:30, create schedule 15:32-15:35
3. Wait for the time to arrive
4. Watch the device position change automatically
5. Check activity log for execution record

**Production Use Cases:**
- **Morning Open**: 07:00-09:00 → Open all classroom shades
- **Midday Shade**: 12:00-14:00 → Partial close to reduce glare
- **Evening Close**: 18:00-20:00 → Close all shades for security
- **Weekend Mode**: Saturday/Sunday → Different schedule

#### Scheduler Status (Admin API):
```bash
# Check if scheduler is running
GET /api/schedules/status

# Manually trigger execution (testing)
POST /api/schedules/execute-now
```

## Notes
- `server/uploads/maps/` is ignored by git and created at runtime
- To reset DB, re‑run `shade_system_test.sql`

## Build
- Frontend production build: `cd client && npm run build`
- Backend runs via `node server/index.js`



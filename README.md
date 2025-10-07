# Automatic Shading Systems

A production-grade full‑stack project for managing areas, maps, and shading devices with comprehensive authorization, alerts, dashboards, and intelligent automation.

## Prerequisites
- Node.js 18+
- npm 9+
- MySQL 8+ (or compatible)

## Repository Layout
- `client/` — Vite + React frontend with Tailwind CSS
- `server/` — Express backend with JWT auth, bcrypt, rate limiting, and security middleware
- `server/uploads/maps/` — Stored map files (ignored in VCS)
- `shade_system_test.sql` — Database schema with user authentication and area assignments

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
# Server
PORT=3001
JWT_SECRET=dev-change-this-secret

# Frontend origin(s)
CORS_ORIGINS=http://localhost:5173
CLIENT_ORIGIN=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=shade_system_test

# SMTP (set these to enable real emails; otherwise console fallback is used)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@autoshade.local
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

### 🔐 **Authentication & Authorization**
- **JWT-based authentication** with secure token management
- **bcrypt password hashing** for secure password storage
- **Role-based access control** (Admin, Maintenance, Planner)
- **Password reset functionality** with email tokens
- **Session management** with automatic logout on token expiry

### 🗺️ **Areas & Maps Management**
- Upload map files (image/SVG, max 10MB) with progress tracking
- Interactive map with device management (configure mode)
- Device drag‑to‑reposition with persistence
- Area-based permissions for planners
- Map replacement and metadata editing

### 🎛️ **Device Management**
- Add devices at map coordinates with precise positioning
- Real-time device control with position updates
- Device status management (Active, Under Maintenance, Inactive)
- Quick actions and bulk operations
- Device deletion with proper authorization checks

### ⏰ **Intelligent Scheduling System** 🆕
- **Automatic execution** with configurable intervals (1-5 minutes)
- **Smart override detection** - respects manual user changes
- **Execute-once-per-day** logic to prevent continuous overrides
- **Daily or day-specific schedules** (Monday-Sunday)
- **Pause/Enable functionality** for emergency control
- **Admin configuration panel** for scheduler settings
- **Activity logging** for all schedule executions and skips
- **Professional UX** with read-only summary and edit mode

### 🚨 **Advanced Alert System**
- Create alerts with priority levels and detailed descriptions
- **Alert assignment** to maintenance staff with auto-acknowledgment
- **"My Alerts" filtering** for assigned maintenance tasks
- Alert status workflow (Open → Acknowledged → Resolved)
- Real-time alert updates and notifications

### 👥 **User Management** (Admin Only)
- **Complete user CRUD** operations (Create, Read, Update, Delete)
- **Role assignment** with proper validation
- **Password generation** for new users
- **Password policy enforcement** (8+ chars, letters + numbers)
- **Self-protection** - admins cannot delete/demote themselves
- **Activity logging** for all user management actions

### 📊 **Dashboard & Analytics**
- **Real-time metrics** with device counts and status
- **Active alerts** with assignment and priority indicators
- **Comprehensive activity log** with filtering (type, user, date)
- **Scheduler status** with last execution time and settings
- **Admin-only scheduler configuration** panel
- Real-time updates when data changes

### 🔒 **Security & Validation**
- **Helmet.js** for HTTP security headers
- **Rate limiting** on all API endpoints
- **Input validation** with centralized middleware
- **SQL injection protection** with parameterized queries
- **CORS whitelist** for secure cross-origin requests
- **File upload security** with MIME type validation
- **Error handling** with user-friendly messages

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

### 1. **Authentication & Authorization** 🔐
   - Login as alice@campus.edu / password123 (Admin) → See all buttons and Users menu
   - Login as bob@campus.edu / password123 (Maintenance) → No Configure/Delete area buttons, no Users menu
   - Login as dana@campus.edu / password123 (Planner) → View-only, can only create alerts
   - Test "Forgot Password" → Email sent to console with reset link
   - Test logout → Redirects to login

### 2. **User Management** (Admin Only) 👥
   - Login as Admin → Click "Users" in navbar
   - Create new user with generated password
   - Edit user role and details
   - Test password policy (try weak password)
   - Delete user (cannot delete self)
   - Check activity log for user management actions

### 3. **Alert Assignment Workflow** 🚨
   - Login as Admin → Create alert
   - Assign alert to "Bob Shade" from dropdown → Auto-acknowledges + shows "Being handled" badge
   - Login as Bob (maintenance) → Click "My Alerts (1)" button → See only assigned alerts
   - Resolve alert → Disappears from active alerts

### 4. **Enhanced Activity Log** 📊
   - Filter by Type: Select "Overrides" → See only override actions
   - Filter by User: Select "Bob Shade" → See only Bob's actions
   - Filter by Type: Select "Users" → See user management actions
   - Each entry shows: User name + Role badge + Icon + Description + Time
   - Shows last 10 activities with comprehensive filtering

### 5. **Area-Based Permissions (Planner)** 🗺️
   - Login as Admin → Upload a map (create area 1)
   - In MySQL: `INSERT INTO area_assignments (user_id, area_id) VALUES (3, 1);` (assign Dana to area 1)
   - Login as Dana (planner) → Can control devices in area 1
   - Try to control device in unassigned area → See detailed error modal

### 6. **Scheduler Configuration** ⏰ (Admin Only)
   - Login as Admin → Home page → Scheduler Status card
   - Click "Edit" to reveal configuration panel
   - Change interval (1-5 minutes or custom)
   - Set override window (0-60 minutes)
   - Toggle pause/enable
   - Save changes → See updated status
   - Test "Reset" to restore defaults

### 7. **Intelligent Scheduling** 🤖
   - Create schedule for 2 minutes from now
   - Wait for automatic execution
   - Check activity log for execution record
   - Test manual override detection (change device before schedule)
   - Verify schedule skips when override detected

### 8. **Error Handling & Security** 🔒
   - Login as Planner → Try to click Configure (hidden, shouldn't see it)
   - Try to drag device in unassigned area → Detailed modal with help text
   - Test rate limiting (rapid API calls)
   - Test file upload security (try non-image files)
   - Test SQL injection protection (malicious inputs)

### 9. **Areas & Devices** 🎛️
   - Admin: Upload map, configure, change name/description, replace map, drag device
   - Maintenance: Add/delete devices, control positions
   - Planner: Control positions in assigned areas only

## 🚀 **Production-Ready Features**

### **Intelligent Scheduling System** ⏰
The system includes a production-grade automatic scheduler with intelligent override detection and professional configuration management.

#### **How It Works:**

1. **Create a Schedule** (Admin/Maintenance only):
   - Open Configure mode for an area
   - Click on a device → "Add Schedule"
   - Fill in:
     - **Name**: "Morning Open", "Evening Close", etc.
     - **Day**: Daily or specific day (Monday-Sunday)
     - **Start Time**: When to begin (e.g., 07:00)
     - **End Time**: When to end (e.g., 09:00)
     - **Target Position**: Device position (0=closed, 100=open)

2. **Intelligent Automatic Execution**:
   - **Configurable intervals** (1-5 minutes, default: 2 minutes)
   - **Execute-once-per-day** logic (prevents continuous overrides)
   - **Smart override detection** - Skips if user changed device within window
   - **Respects device status** (skips inactive/maintenance devices)
   - **Activity logging** for all executions and intelligent skips

3. **Professional Configuration** (Admin Only):
   - **Scheduler Status Card** on Home dashboard
   - **Edit Mode** with intuitive controls
   - **Interval Settings**: 1m, 2m, 5m buttons + custom input
   - **Override Window**: 0-60 minutes (detection sensitivity)
   - **Pause/Enable Toggle** for emergency control
   - **Real-time Status** with last execution time

4. **Smart Behavior Examples**:
   ```
   Scenario A - Normal Operation:
   07:00 → Schedule executes → Device opens to 100%
   07:30 → User manually changes to 50%
   07:32 → System respects change (no override)
   Next day 07:00 → Device opens to 100% again
   
   Scenario B - User Pre-sets (Intelligent Detection):
   06:40 → User manually sets device to 50%
   07:00 → Schedule detects recent manual change (20 min ago)
         → SKIPS execution for today
         → Device stays at 50% (user's choice respected)
         → Activity log: "Schedule skipped: Manual override detected"
   Next day 07:00 → Schedule executes again (if no manual change)
   ```

#### **Testing the Scheduler:**
1. **Quick Test**: Create schedule for 2 minutes from now → Watch automatic execution
2. **Override Test**: Change device manually before schedule → Verify skip behavior
3. **Configuration Test**: Admin → Home → Scheduler Status → Edit → Change settings
4. **Pause Test**: Toggle pause/enable → Verify scheduler respects setting

#### **Production Use Cases:**
- **Morning Open**: 07:00-09:00 → Open all classroom shades
- **Midday Shade**: 12:00-14:00 → Partial close to reduce glare  
- **Evening Close**: 18:00-20:00 → Close all shades for security
- **Weekend Mode**: Saturday/Sunday → Different schedule patterns

### **User Management System** 👥
Complete admin-only user management with security and audit features.

#### **Features:**
- **User CRUD** operations (Create, Read, Update, Delete)
- **Role assignment** with validation (Admin, Maintenance, Planner)
- **Password generation** for new users
- **Password policy enforcement** (8+ chars, letters + numbers)
- **Self-protection** - admins cannot delete/demote themselves
- **Activity logging** for all user management actions
- **Professional UI** with hover animations and role badges

### **Password Reset System** 🔐
Secure password reset with email token authentication.

#### **Features:**
- **Email-based reset** with secure tokens
- **Console fallback** for development (no SMTP required)
- **Token expiration** (1 hour default)
- **Secure token generation** with crypto.randomBytes
- **User-friendly interface** with clear instructions

### **Enhanced Security** 🔒
Production-grade security measures throughout the application.

#### **Security Features:**
- **Helmet.js** for HTTP security headers
- **Rate limiting** on all API endpoints (auth, users, dashboard, etc.)
- **Input validation** with centralized middleware
- **SQL injection protection** with parameterized queries
- **CORS whitelist** for secure cross-origin requests
- **File upload security** with MIME type validation
- **Error handling** with user-friendly messages
- **JWT token management** with automatic refresh

## 🛠️ **Technical Implementation**

### **Backend Architecture**
- **Express.js** with middleware-based architecture
- **MySQL** with connection pooling for stability
- **JWT authentication** with bcrypt password hashing
- **Role-based middleware** for granular access control
- **Rate limiting** and **Helmet.js** for security
- **Centralized validation** with custom middleware
- **Activity logging** for comprehensive audit trails

### **Frontend Architecture**
- **React 18** with functional components and hooks
- **Vite** for fast development and building
- **Tailwind CSS** for responsive, accessible design
- **Context API** for global state management
- **Custom hooks** for authentication and API calls
- **Error boundaries** and loading states

### **Database Schema**
- **Users table** with password hashing and role management
- **Area assignments** for planner permissions
- **Activity logging** with comprehensive event tracking
- **Password reset tokens** with expiration
- **Scheduler settings** with configuration storage

### **Security Measures**
- **SQL injection protection** with parameterized queries
- **XSS prevention** with input sanitization
- **CSRF protection** with same-origin policy
- **Rate limiting** on all endpoints
- **File upload validation** with MIME type checking
- **CORS whitelist** for secure cross-origin requests

## 📋 **Development Notes**
- `server/uploads/maps/` is ignored by git and created at runtime
- To reset DB, re‑run `shade_system_test.sql`
- All API calls use relative `/api` paths for production deployment
- Console logs are guarded for production environments
- SMTP configuration optional (console fallback available)

## 🚀 **Build & Deployment**
- **Frontend production build**: `cd client && npm run build`
- **Backend production**: `cd server && npm start`
- **Environment variables** required for production deployment
- **Database migrations** handled via SQL schema file



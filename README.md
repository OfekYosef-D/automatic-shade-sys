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

## Core Features
- Areas & Maps
  - Upload map (image/SVG, max 10MB), edit map name/description, replace map
  - Interactive map with device management (configure mode)
  - Device drag‑to‑reposition with persistence
- Devices (Shades)
  - Add devices at map coordinates, control position, quick actions
- Alerts
  - Create alerts (via dashboard button), view active alerts, update status
- Dashboard
  - Metrics, active alerts, recent activity log

## Routes Kept for Submission
- Frontend pages: `/` (Dashboard), `/areas`, `/users`
- Backend routes: `/api/maps`, `/api/shades`, `/api/alerts`, `/api/dashboard`, `/api/users`

## Security & Validation
- Parameterized SQL everywhere
- Input sanitization (trim, strip HTML/control chars, length limits)
- Images: MIME/type checked; SVGs scanned for scripts/JS
- Upload limit: 10MB (Multer); 413 error returned for oversize
- Clear error JSON via centralized handler

## Quick Test Checklist
1. Areas
   - Upload a map; open Configure; change name/description; replace map; drag a device
2. Devices
   - Add a device on map; adjust position via quick actions; verify persists
3. Alerts
   - Create alert; list on dashboard; change to acknowledged and resolved; delete
4. Delete Area
   - Trash button removes area and its devices/overrides/schedules and map file

## Notes
- `server/uploads/maps/` is ignored by git and created at runtime
- To reset DB, re‑run `shade_system_test.sql`

## Build
- Frontend production build: `cd client && npm run build`
- Backend runs via `node server/index.js`



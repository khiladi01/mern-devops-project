# PeopleDesk - Employee Management System

A modern SaaS-style HR dashboard: employees, departments, attendance and an admin dashboard with charts.
Built as a DevOps portfolio project, so the frontend and backend are fully independent and everything
(API URL, database, secrets, ports) is configured through environment variables.

| Layer    | Stack |
|----------|-------|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, Axios, Lucide icons, Recharts |
| Backend  | Node.js (18+), Express 5, MongoDB, Mongoose, JWT, bcrypt, express-validator, helmet, rate limiting |

```
employee-management-system/
├── backend/            REST API (controllers, models, routes, middleware, config, scripts, tests)
├── frontend/           React SPA (src, public, vite.config.js)
└── README.md
```

## Features

- **Admin auth**: JWT login, bcrypt-hashed passwords, protected routes, logout, change password.
- **Dashboard**: stat cards, 12-month growth chart, department distribution, attendance overview (today + last 7 days), recent additions, activity feed. All numbers come from MongoDB aggregations.
- **Employees**: add / view / edit / delete, search, filter by department and status, sortable columns, pagination, profile page with attendance history. Employee IDs (`EMP-0001`) are generated atomically.
- **Departments**: CRUD with live employee counts. A department that still has employees can't be deleted.
- **Attendance**: present / late / absent, check-in and check-out, single-day or date-range filter, status filter, edit records. One record per employee per day.
- **Responsive UI**: collapsible sidebar on desktop, drawer on mobile, loading skeletons, empty and error states, toasts, keyboard-accessible dialogs.
- **Ops-ready**: `/health` (liveness) and `/health/ready` (readiness, checks MongoDB), graceful shutdown, MongoDB connection retries, request logging.

## Quick start (local development)

Prerequisites: **Node.js 18+** and a **MongoDB** instance (local install, Docker, or Atlas).

```bash
# MongoDB in Docker, if you don't have one installed:
docker run -d --name mongo -p 27017:27017 -v mongo-data:/data/db mongo:7
```

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

1. Generate a JWT secret and paste it into `JWT_SECRET`:
   ```bash
   npm run gen-secret
   ```
2. Choose your first admin by setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` (10+ characters, letters and a number).
   The account is created on first start only if no admin exists yet. Remove `ADMIN_PASSWORD` from `.env` afterwards.

Then load demo data (optional) and start the API:

```bash
npm run seed        # 5 departments, 40 employees, ~2 weeks of attendance, activity feed
npm run dev         # http://localhost:5000  (auto-restarts on changes)
```

Run `npm run seed -- --force` to wipe and reseed. Seeding never creates admin credentials on its own.
To create or reset an admin at any time: `npm run create-admin` (prompts for a hidden password).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev         # http://localhost:5173
```

The dev server proxies `/api` to `http://localhost:5000`, so no CORS setup is needed. Sign in with the admin you configured.

## Configuration

### Backend (`backend/.env`)

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `MONGO_URI` | yes | - | MongoDB connection string |
| `JWT_SECRET` | yes | - | 32+ random characters (`npm run gen-secret`) |
| `PORT` | no | `5000` | API port |
| `HOST` | no | `0.0.0.0` | Bind address (all interfaces, container friendly) |
| `NODE_ENV` | no | `development` | Set to `production` when deployed |
| `JWT_EXPIRES_IN` | no | `8h` | Token lifetime |
| `BCRYPT_ROUNDS` | no | `12` | bcrypt cost |
| `CORS_ORIGIN` | no | `http://localhost:5173` | Comma-separated allowed origins (`*` = any). Not needed when a proxy serves both |
| `APP_TIMEZONE` | no | `UTC` | Decides what "today" means (e.g. `Asia/Kolkata`) |
| `TRUST_PROXY` | no | `1` in production | Number of reverse proxies (Nginx / ALB) so rate limiting sees real client IPs |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | no | - | First-run admin bootstrap |

The API refuses to start if `MONGO_URI` or `JWT_SECRET` is missing or the secret is too short.

### Frontend

The browser finds the API in this order:

1. `window.__APP_CONFIG__.API_URL` from `public/config.js` (after a build: `dist/config.js`). **Editable at deploy time with no rebuild.**
2. `VITE_API_URL` at build time.
3. `/api` on the same origin (works behind Nginx or the Vite proxy).

`VITE_PROXY_TARGET` (dev server and `vite preview` only) sets where `/api` is forwarded, e.g. `http://backend:5000` in Docker Compose.

## Production run

```bash
# Backend
cd backend
npm ci --omit=dev
NODE_ENV=production npm start

# Frontend: build static files, then serve `dist/` with Nginx (or any static host)
cd frontend
npm ci
npm run build              # outputs frontend/dist
npm run preview            # quick local check of the production build (port 4173)
```

For a production server, serve `frontend/dist` with a rule that falls back to `index.html` (single-page app)
and proxy `/api` to the backend. Minimal Nginx example:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;      # contents of frontend/dist
  index index.html;

  location /api/ { proxy_pass http://backend:5000; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; }
  location /health { proxy_pass http://backend:5000; }
  location / { try_files $uri /index.html; }
}
```

## API reference

All `/api` routes except login and health require `Authorization: Bearer <token>`.
Errors look like `{ "success": false, "message": "...", "errors": [{ "field", "message" }] }` with codes
400 (bad value), 401 (auth), 404, 409 (duplicate / blocked delete), 422 (validation), 429 (rate limited).

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/api/auth/login` | Rate limited: 10 failed attempts per 15 min per IP |
| GET / PUT | `/api/auth/me` | Current admin / update name |
| PUT | `/api/auth/password` | Change password |
| GET, POST | `/api/employees` | List supports `search`, `department`, `status`, `sortBy`, `order`, `page`, `limit` |
| GET, PUT, DELETE | `/api/employees/:id` | Delete also removes attendance |
| GET | `/api/employees/options` | Lightweight list for dropdowns |
| GET, POST | `/api/departments` | List includes `employeeCount` |
| PUT, DELETE | `/api/departments/:id` | Delete blocked while it has employees |
| GET, POST | `/api/attendance` | Filters: `date`, `from`, `to`, `employee`, `status`, `page`, `limit` |
| PUT | `/api/attendance/:id` | |
| GET | `/api/dashboard/stats` | Totals, growth, distribution, attendance, recent items |
| GET | `/health`, `/health/ready` | Also under `/api/health` |

## Testing

```bash
cd backend
TEST_MONGO_URI=mongodb://127.0.0.1:27017/peopledesk_test npm test
```

14 integration tests run the real Express app against a real MongoDB: auth, validation, duplicates,
CRUD for all modules, filtering, pagination, injection attempts, cascade delete and dashboard output.
**The test database is dropped afterwards. Never point it at real data.**

## Design decisions worth knowing

- **Secure admin setup**: no credentials exist in the repo. The first admin comes from environment variables or an interactive script, and passwords are validated and bcrypt-hashed. Login uses the same error for unknown emails and wrong passwords, and a dummy hash comparison to keep timing similar.
- **Dates as strings**: attendance dates are stored as `YYYY-MM-DD` and times as `HH:mm`, so "a day" never shifts with time zones. `APP_TIMEZONE` decides what today is on the server.
- **Runtime frontend config** (`config.js`): the same built image can point at different APIs per environment.
- **Readiness vs liveness**: use `/health` for container liveness and `/health/ready` for load balancer readiness.
- **Seed photos** come from `randomuser.me`. When an image can't load, initials are shown instead.

## Ideas for the DevOps stages

- `backend/Dockerfile` (node:22-alpine, `npm ci --omit=dev`, `HEALTHCHECK` on `/health`) and a multi-stage `frontend/Dockerfile` ending in `nginx`.
- `docker-compose.yml` with `mongo` (named volume), `backend`, `frontend`; pass secrets through `.env` or Docker secrets.
- GitHub Actions: install, `npm test` (with a `mongo` service container), `npm run build`, push images, deploy to EC2 over SSH.
- Monitoring: scrape `/health/ready` from an uptime check; add `prom-client` for metrics when you're ready.

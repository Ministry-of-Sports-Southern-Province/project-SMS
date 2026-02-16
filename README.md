# Southern Province Sports Score Management System

Web-based system for the Department of Sports - Southern Province (Sri Lanka) to record and manage provincial sports event scores.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Material-UI (MUI), react-i18next
- **Backend**: Express 4, TypeScript, mysql2
- **Database**: MySQL 8

## Prerequisites

- Node.js 18+
- MySQL 8

## Setup

### 1. Database

Create the database and seed initial data:

```bash
mysql -u root -p < backend/scripts/init-db.sql
```

### 2. Seed Users

```bash
cd backend
npm install
# Create .env with DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET
npm run seed:users
```

### 3. Backend

```bash
cd backend
npm install
# Copy .env.example to .env and configure
npm run dev
```

Backend runs on http://localhost:3001

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173 with proxy to backend.

## Environment Variables (backend/.env)

- `PORT` - Server port (default: 3001)
- `DB_HOST` - MySQL host (default: localhost)
- `DB_USER` - MySQL user (default: root)
- `DB_PASSWORD` - MySQL password
- `DB_NAME` - Database name (default: project_sms)
- `JWT_SECRET` - Secret for JWT signing

## Default Credentials

| Username | Password | Role  |
|----------|----------|-------|
| admin    | 1234     | admin |
| user     | 1234     | user  |

## Features (A-01 Athletic)

- Score entry with sport category, event, gender
- Individual events (3 places) and relay events (12 players: 4 per place x 3 places)
- Record validation: time (e.g. 12.05, 1.13.12) and distance (e.g. 12m, 40.34m) based on event
- Unique certificate numbers; no same person in multiple places per event
- View, Edit, Delete entries (dialog)
- Filters: district, DS office, gender, category, event, search
- Export Excel and PDF
- Admin: user management, dashboard
- Profile: display name, email, password, language, theme
- Dark/light mode
- i18n: Sinhala (default), English, Tamil
